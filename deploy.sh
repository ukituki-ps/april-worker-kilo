#!/usr/bin/env bash
# Развёртывание на dev/stage: см. docs/DEPLOYMENT_STRATEGY.md
# Запуск из корня клона (на сервере обычно /opt/april): ./deploy.sh
set -euo pipefail

ROOT="${DEPLOY_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
cd "$ROOT"

log() { echo "[deploy] $*" >&2; }
fail() { log "ошибка: $*"; exit 1; }

usage() {
  cat <<'EOF'
deploy.sh — выкладка на dev/stage: git pull, make openapi-lint, опциональные хуки БД/миграций,
make docs-build, docker compose pull && up -d. Подробности: docs/DEPLOYMENT_STRATEGY.md

Использование: ./deploy.sh

EOF
  cat <<'EOF'

Переменные окружения:
  DEPLOY_ROOT          каталог репозитория (по умолчанию — каталог deploy.sh)
  SKIP_GIT_PULL=1      не выполнять git pull
  SKIP_OPENAPI_LINT=1  не выполнять make openapi-lint
  SKIP_DB_BACKUP=1     не вызывать scripts/db-backup.sh (если есть)
  SKIP_MIGRATIONS=1    не вызывать scripts/run-migrations.sh (если есть)
  SKIP_HEALTHCHECK=1   пропустить health/readiness проверки
  SKIP_SMOKE=1         пропустить scripts/smoke-after-deploy.sh
  AUTO_ROLLBACK=0      отключить авто-rollback (по умолчанию включён)
  REQUIRE_IMAGES_ENV=0 не требовать images.env (по умолчанию REQUIRE_IMAGES_ENV=1)
  DEPLOY_ARTIFACTS_DIR каталог артефактов (по умолчанию .deploy-artifacts)
  HUB_BFF_BASE_URL     базовый URL для health/readiness (по умолчанию http://127.0.0.1:${HUB_BFF_HOST_PORT:-8081})

Опциональные хуки (если исполняемы):
  scripts/db-backup.sh      дамп БД до миграций/up (см. DEPLOYMENT_STRATEGY.md)
  scripts/run-migrations.sh миграции до docker compose up
  scripts/rollback-migrations.sh откат миграций при auto-rollback
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

compose_files=(docker compose)
if [[ -f .env ]]; then
  compose_files+=(--env-file .env)
fi
if [[ -f images.env ]]; then
  compose_files+=(--env-file images.env)
fi

timestamp="$(date -u +"%Y%m%dT%H%M%SZ")"
artifacts_root="${DEPLOY_ARTIFACTS_DIR:-$ROOT/.deploy-artifacts}"
deploy_artifacts_dir="${artifacts_root}/deploy-${timestamp}"
state_dir="${ROOT}/.deploy-state"
mkdir -p "$deploy_artifacts_dir" "$state_dir"

auto_rollback="${AUTO_ROLLBACK:-1}"
require_images_env="${REQUIRE_IMAGES_ENV:-1}"
rollback_in_progress=0

capture_compose_ps() {
  "${compose_files[@]}" ps >"${deploy_artifacts_dir}/compose-ps.txt" 2>&1 || true
}

capture_metadata() {
  local rev="unknown"
  if git rev-parse --git-dir >/dev/null 2>&1; then
    rev="$(git rev-parse HEAD)"
  fi
  cat >"${deploy_artifacts_dir}/metadata.env" <<EOF
DEPLOY_TIMESTAMP=${timestamp}
DEPLOY_GIT_SHA=${rev}
DEPLOY_ROOT=${ROOT}
EOF
}

preflight() {
  if [[ "$require_images_env" == "1" && ! -f "${ROOT}/images.env" ]]; then
    fail "images.env обязателен (REQUIRE_IMAGES_ENV=1), но файл отсутствует"
  fi
  if ! command -v docker >/dev/null 2>&1; then
    fail "docker не найден"
  fi
  capture_metadata
}

persist_images_state() {
  if [[ -f "${ROOT}/images.env" ]]; then
    cp "${ROOT}/images.env" "${state_dir}/images.env.previous"
  fi
}

mark_last_good() {
  if [[ -f "${ROOT}/images.env" ]]; then
    cp "${ROOT}/images.env" "${state_dir}/images.env.last-good"
  fi
  cp "${deploy_artifacts_dir}/metadata.env" "${state_dir}/last-good.env"
}

run_git_pull() {
  if [[ "${SKIP_GIT_PULL:-}" == "1" ]]; then
    log "пропуск git pull (SKIP_GIT_PULL=1)"
    return 0
  fi
  if ! git rev-parse --git-dir >/dev/null 2>&1; then
    log "не git-репозиторий — пропуск git pull"
    return 0
  fi
  log "git pull --ff-only"
  git pull --ff-only
}

run_openapi_lint() {
  if [[ "${SKIP_OPENAPI_LINT:-}" == "1" ]]; then
    log "пропуск openapi-lint (SKIP_OPENAPI_LINT=1)"
    return 0
  fi
  if ! command -v make >/dev/null 2>&1; then
    log "make не найден — пропуск openapi-lint"
    return 0
  fi
  log "make openapi-lint"
  make openapi-lint
}

run_hook() {
  local path="$1"
  local skip_var="$2"
  local name="$3"
  if [[ "${!skip_var:-}" == "1" ]]; then
    log "пропуск ${name} (${skip_var}=1)"
    return 0
  fi
  if [[ ! -f "$path" ]]; then
    log "нет ${path} — пропуск ${name}"
    return 0
  fi
  if [[ ! -x "$path" ]]; then
    log "ошибка: ${path} существует, но не исполняемый (chmod +x)"
    exit 1
  fi
  log "запуск ${path}"
  "$path"
}

run_docs_build() {
  if command -v make >/dev/null 2>&1; then
    log "make docs-build"
    make docs-build
    return
  fi
  if command -v npm >/dev/null 2>&1; then
    log "make не найден — сборка как в Makefile: docs-site (npm ci && npm run build)"
    (cd docs-site && npm ci && npm run build)
    return
  fi
  if command -v docker >/dev/null 2>&1; then
    log "make и npm не найдены — сборка docs-site через образ node:22-bookworm-slim (как на минимальном сервере без Node в PATH)"
    docker run --rm \
      -v "${ROOT}:/repo" \
      -w /repo/docs-site \
      node:22-bookworm-slim \
      sh -c "npm ci && npm run build"
    return
  fi
  log "ошибка: нужны make, npm или docker для docs-build"
  exit 1
}

run_compose() {
  log "docker compose config (проверка)"
  "${compose_files[@]}" config >"${deploy_artifacts_dir}/compose-config.txt"
  log "docker compose pull"
  "${compose_files[@]}" pull
  log "docker compose up -d"
  "${compose_files[@]}" up -d
  capture_compose_ps
}

run_health_checks() {
  if [[ "${SKIP_HEALTHCHECK:-}" == "1" ]]; then
    log "пропуск health/readiness (SKIP_HEALTHCHECK=1)"
    return 0
  fi
  local base_url="${HUB_BFF_BASE_URL:-http://127.0.0.1:${HUB_BFF_HOST_PORT:-8081}}"
  local retries="${DEPLOY_HEALTH_RETRIES:-30}"
  local sleep_s="${DEPLOY_HEALTH_SLEEP_SEC:-2}"
  log "health-check ${base_url}/healthz + ${base_url}/readyz"
  for _ in $(seq 1 "$retries"); do
    if curl -fsS "${base_url}/healthz" >/dev/null && curl -fsS "${base_url}/readyz" >/dev/null; then
      return 0
    fi
    sleep "$sleep_s"
  done
  fail "health/readiness проверки не прошли"
}

run_smoke() {
  if [[ "${SKIP_SMOKE:-}" == "1" ]]; then
    log "пропуск smoke-after-deploy (SKIP_SMOKE=1)"
    return 0
  fi
  if [[ ! -x "${ROOT}/scripts/smoke-after-deploy.sh" ]]; then
    fail "smoke-after-deploy не найден или не исполняемый: scripts/smoke-after-deploy.sh"
  fi
  log "запуск smoke-after-deploy"
  "${ROOT}/scripts/smoke-after-deploy.sh" >"${deploy_artifacts_dir}/smoke.log" 2>&1
}

run_rollback() {
  if [[ "$rollback_in_progress" == "1" ]]; then
    return 0
  fi
  rollback_in_progress=1
  log "старт auto-rollback"
  if [[ -f "${state_dir}/images.env.last-good" ]]; then
    cp "${state_dir}/images.env.last-good" "${ROOT}/images.env"
    log "images.env откатан к last-good"
  else
    log "last-good images.env не найден, откат image set пропущен"
  fi
  if [[ -x "${ROOT}/scripts/rollback-migrations.sh" ]]; then
    "${ROOT}/scripts/rollback-migrations.sh" >>"${deploy_artifacts_dir}/rollback.log" 2>&1 || true
  fi
  run_compose >>"${deploy_artifacts_dir}/rollback.log" 2>&1
  run_health_checks >>"${deploy_artifacts_dir}/rollback.log" 2>&1
  run_smoke >>"${deploy_artifacts_dir}/rollback.log" 2>&1
  log "auto-rollback завершён"
}

on_error() {
  local exit_code="$1"
  set +e
  capture_compose_ps
  if [[ "$auto_rollback" == "1" ]]; then
    run_rollback || true
  else
    log "auto-rollback отключён (AUTO_ROLLBACK=0)"
  fi
  log "деплой завершился с ошибкой (exit ${exit_code}), артефакты: ${deploy_artifacts_dir}"
  exit "$exit_code"
}

main() {
  trap 'on_error $?' ERR
  log "каталог: $ROOT"
  preflight
  persist_images_state
  run_git_pull
  run_openapi_lint
  run_hook "scripts/db-backup.sh" "SKIP_DB_BACKUP" "db-backup"
  run_hook "scripts/run-migrations.sh" "SKIP_MIGRATIONS" "миграции"
  run_docs_build
  run_compose
  run_health_checks
  run_smoke
  mark_last_good
  capture_compose_ps
  log "готово"
  log "артефакты: ${deploy_artifacts_dir}"
}

main "$@"
