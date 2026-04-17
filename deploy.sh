#!/usr/bin/env bash
# Развёртывание на dev/stage: см. docs/DEPLOYMENT_STRATEGY.md
# Запуск из корня клона (на сервере обычно /opt/april-worker): ./deploy.sh
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
  REQUIRE_GIT_PULL=1   завершать с ошибкой при неуспехе git pull
  SKIP_OPENAPI_LINT=1  не выполнять make openapi-lint
  SKIP_DB_BACKUP=1     не вызывать scripts/db-backup.sh (если есть)
  SKIP_MIGRATIONS=1    не вызывать scripts/run-migrations.sh (если есть)
  SKIP_FRONTEND_RECREATE=1 пропустить force-recreate frontend-сервисов при изменении lock-файлов
  SKIP_KEYCLOAK_RECREATE=1 пропустить force-recreate keycloak при изменении theme/realm/compose
  SKIP_OBSERVABILITY_ONBOARD=1 пропустить авто-onboarding стенда в central observability
  SKIP_HEALTHCHECK=1   пропустить health/readiness проверки
  INGRESS_BASE_URL     базовый URL ingress-check (по умолчанию http://127.0.0.1:${DOCS_HTTP_PORT:-8080})
  DEPLOY_INGRESS_RETRIES количество попыток ingress-check (по умолчанию 20)
  DEPLOY_INGRESS_SLEEP_SEC задержка между попытками ingress-check (по умолчанию 2)
  SKIP_SMOKE=1         пропустить scripts/smoke-after-deploy.sh
  AUTO_ROLLBACK=0      отключить авто-rollback (по умолчанию включён)
  REQUIRE_IMAGES_ENV=0 не требовать images.env (по умолчанию REQUIRE_IMAGES_ENV=1)
  DEPLOY_ARTIFACTS_DIR каталог артефактов (по умолчанию .deploy-artifacts)
  HUB_BFF_BASE_URL     базовый URL для health/readiness (по умолчанию http://127.0.0.1:${DOCS_HTTP_PORT:-8080})
  OBS_AUTO_ONBOARD=1   включить авто-регистрацию стенда в central observability
  OBS_CENTRAL_HOST     host/IP центрального observability (обязательно для OBS_AUTO_ONBOARD=1)
  OBS_CENTRAL_USER     SSH-пользователь центрального observability (по умолчанию текущий)
  OBS_CENTRAL_OBS_PATH путь до infra/observability на central host (по умолчанию /opt/april/infra/observability)
  OBS_STAND_HOST       адрес текущего стенда (по умолчанию hostname -I | awk '{print $1}')
  OBS_STAND_NAME       идентификатор стенда (по умолчанию stand-<OBS_STAND_HOST с дефисами>)
  OBS_SERVICE_NAME     сервис для metrics target (по умолчанию hub-bff)
  OBS_METRICS_PORT     порт /metrics сервиса (по умолчанию HUB_BFF_PORT или 8081)
  OBS_ENV_NAME         env label для target (по умолчанию dev)
  OBS_SETUP_LOCAL_PROMTAIL_AGENT=1 включить авто-setup promtail-agent на текущем стенде
  OBS_LOKI_PUSH_URL    URL push endpoint Loki для promtail-agent (по умолчанию http://<OBS_CENTRAL_HOST>:3100/loki/api/v1/push)

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

run_named_docker() {
  local container_name="$1"
  shift
  # deterministic name makes temporary build containers easy to track in docker ps/logs
  docker rm -f "${container_name}" >/dev/null 2>&1 || true
  docker run --name "${container_name}" --rm "$@"
}

calc_sha256() {
  local path="$1"
  if [[ ! -f "$path" ]]; then
    return 1
  fi
  sha256sum "$path" | awk '{print $1}'
}

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
  local upstream
  upstream="$(git rev-parse --abbrev-ref --symbolic-full-name "@{u}" 2>/dev/null || true)"
  if [[ -z "$upstream" ]]; then
    log "для текущей ветки не настроен upstream — пропуск git pull"
    return 0
  fi
  log "git pull --ff-only"
  if ! git pull --ff-only; then
    if [[ "${REQUIRE_GIT_PULL:-0}" == "1" ]]; then
      fail "git pull не выполнен при REQUIRE_GIT_PULL=1"
    fi
    log "git pull не выполнен — продолжаем без обновления кода (REQUIRE_GIT_PULL=0)"
  fi
}

run_submodules() {
  if [[ "${SKIP_SUBMODULES:-}" == "1" ]]; then
    log "пропуск submodules (SKIP_SUBMODULES=1)"
    return 0
  fi
  if ! git rev-parse --git-dir >/dev/null 2>&1; then
    log "не git-репозиторий — пропуск submodule update"
    return 0
  fi
  if [[ ! -f "${ROOT}/.gitmodules" ]]; then
    log "нет .gitmodules — пропуск submodule update"
    return 0
  fi

  # Этот submodule используется в hub-shell ds:prepare (pnpm --dir ../design-system/DisignApril ...).
  # На dev-сервере иногда нет доступа к https URL, поэтому заранее выставляем SSH URL для субмодуля.
  # Переопределение возможно переменной DISIGNAPRIL_SUBMODULE_URL.
  local design_april_submodule="design-system/DisignApril"
  local disignapril_ssh_default="git@github-disignapril:ukituki-ps/DisignApril.git"
  local disignapril_ssh_fallback="git@github.com:ukituki-ps/DisignApril.git"
  local disignapril_url="${DISIGNAPRIL_SUBMODULE_URL:-}"

  if [[ -z "${disignapril_url}" ]]; then
    if ssh -G github-disignapril >/dev/null 2>&1; then
      disignapril_url="${disignapril_ssh_default}"
    else
      disignapril_url="${disignapril_ssh_fallback}"
    fi
  fi

  git config "submodule.${design_april_submodule}.url" "${disignapril_url}" || true

  log "git submodule update --init --recursive"
  git submodule update --init --recursive "${design_april_submodule}"
}

run_openapi_lint() {
  if [[ "${SKIP_OPENAPI_LINT:-}" == "1" ]]; then
    log "пропуск openapi-lint (SKIP_OPENAPI_LINT=1)"
    return 0
  fi
  if command -v make >/dev/null 2>&1 && command -v npx >/dev/null 2>&1; then
    log "make openapi-lint"
    make openapi-lint
    return
  fi
  if command -v docker >/dev/null 2>&1; then
    log "make/npx недоступны — openapi-lint через node:22-bookworm-slim"
    run_named_docker "april-openapi-lint" \
      -v "${ROOT}:/repo" \
      -w /repo \
      node:22-bookworm-slim \
      sh -c "npx --yes @redocly/cli@1.25.0 lint openapi/openapi.yaml openapi/mail-gateway-openapi.yaml openapi/aprilhub-bff.yaml --config redocly.yaml"
    return
  fi
  log "нет make+npx и docker — пропуск openapi-lint"
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
  if command -v make >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
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
    run_named_docker "april-docs-build" \
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
  local nginx_conf="${ROOT}/infra/nginx/default.conf"
  local nginx_hash_file="${state_dir}/nginx-default.sha256"
  local nginx_hash_before=""
  local nginx_hash_after=""

  nginx_hash_before="$(calc_sha256 "$nginx_conf" || true)"

  log "docker compose pull"
  "${compose_files[@]}" pull
  log "docker compose up -d"
  "${compose_files[@]}" up -d

  nginx_hash_after="$(calc_sha256 "$nginx_conf" || true)"
  if [[ -n "$nginx_hash_after" ]]; then
    if [[ "$nginx_hash_after" != "$nginx_hash_before" || ! -f "$nginx_hash_file" || "$(cat "$nginx_hash_file" 2>/dev/null || true)" != "$nginx_hash_after" ]]; then
      log "обнаружено изменение infra/nginx/default.conf — force-recreate nginx-docs"
      "${compose_files[@]}" up -d --force-recreate nginx-docs
      printf '%s\n' "$nginx_hash_after" >"$nginx_hash_file"
    fi
  fi
  capture_compose_ps
}

is_service_running() {
  local service="$1"
  "${compose_files[@]}" ps --services --status running | awk '{print $1}' | grep -qx "$service"
}

sync_frontend_service_on_lock_change() {
  local service="$1"
  local lock_file="$2"
  local state_file="$3"
  local lock_hash
  local prev_hash=""

  lock_hash="$(calc_sha256 "$lock_file" || true)"
  if [[ -z "$lock_hash" ]]; then
    log "lock-файл ${lock_file} не найден — пропуск sync для ${service}"
    return 0
  fi

  if [[ -f "$state_file" ]]; then
    prev_hash="$(cat "$state_file" 2>/dev/null || true)"
  fi

  if [[ "$lock_hash" == "$prev_hash" ]]; then
    log "lock-файл без изменений для ${service} — force-recreate не требуется"
    return 0
  fi

  if ! is_service_running "$service"; then
    log "${service} не запущен — hash lock-файла обновлён, force-recreate пропущен"
    printf '%s\n' "$lock_hash" >"$state_file"
    return 0
  fi

  log "обнаружено изменение lock-файла для ${service} — docker compose up -d --force-recreate ${service}"
  "${compose_files[@]}" up -d --force-recreate "$service"
  printf '%s\n' "$lock_hash" >"$state_file"
}

sync_frontend_dependencies() {
  if [[ "${SKIP_FRONTEND_RECREATE:-}" == "1" ]]; then
    log "пропуск frontend force-recreate (SKIP_FRONTEND_RECREATE=1)"
    return 0
  fi

  sync_frontend_service_on_lock_change \
    "hub-shell" \
    "${ROOT}/hub-shell/package-lock.json" \
    "${state_dir}/hub-shell-package-lock.sha256"

  sync_frontend_service_on_lock_change \
    "april-showcase" \
    "${ROOT}/design-system/DisignApril/pnpm-lock.yaml" \
    "${state_dir}/april-showcase-pnpm-lock.sha256"
}

sync_keycloak_on_theme_or_realm_change() {
  if [[ "${SKIP_KEYCLOAK_RECREATE:-}" == "1" ]]; then
    log "пропуск keycloak force-recreate (SKIP_KEYCLOAK_RECREATE=1)"
    return 0
  fi

  if ! is_service_running "keycloak"; then
    log "keycloak не запущен — пропуск keycloak force-recreate sync"
    return 0
  fi

  local state_file="${state_dir}/keycloak-theme-realm.sha256"
  local compose_hash_file="${ROOT}/docker-compose.yml"
  local realm_hash_file="${ROOT}/infra/keycloak/realm/april-realm.json"
  local login_theme_file="${ROOT}/infra/keycloak/themes/aprilhub/login/theme.properties"
  local login_css_file="${ROOT}/infra/keycloak/themes/aprilhub/login/resources/css/aprilhub-login.css"
  local account_theme_file="${ROOT}/infra/keycloak/themes/aprilhub/account/theme.properties"
  local account_css_file="${ROOT}/infra/keycloak/themes/aprilhub/account/resources/css/aprilhub-account.css"
  local merged_hash
  local prev_hash=""

  merged_hash="$(
    sha256sum \
      "$compose_hash_file" \
      "$realm_hash_file" \
      "$login_theme_file" \
      "$login_css_file" \
      "$account_theme_file" \
      "$account_css_file" \
    | sha256sum | awk '{print $1}'
  )"

  if [[ -f "$state_file" ]]; then
    prev_hash="$(cat "$state_file" 2>/dev/null || true)"
  fi

  if [[ "$merged_hash" == "$prev_hash" ]]; then
    log "keycloak theme/realm/compose без изменений — force-recreate не требуется"
    return 0
  fi

  log "обнаружены изменения keycloak theme/realm/compose — docker compose up -d --force-recreate keycloak"
  "${compose_files[@]}" up -d --force-recreate keycloak
  printf '%s\n' "$merged_hash" >"$state_file"
}

run_health_checks() {
  if [[ "${SKIP_HEALTHCHECK:-}" == "1" ]]; then
    log "пропуск health/readiness (SKIP_HEALTHCHECK=1)"
    return 0
  fi
  if ! "${compose_files[@]}" ps --services --status running | awk '{print $1}' | grep -qx "hub-bff"; then
    log "hub-bff не запущен — пропуск health/readiness для BFF"
    return 0
  fi
  local base_url="${HUB_BFF_BASE_URL:-http://127.0.0.1:${DOCS_HTTP_PORT:-8080}}"
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

run_ingress_checks() {
  if [[ "${SKIP_HEALTHCHECK:-}" == "1" ]]; then
    log "пропуск ingress-check (SKIP_HEALTHCHECK=1)"
    return 0
  fi
  if ! "${compose_files[@]}" ps --services --status running | awk '{print $1}' | grep -qx "nginx-docs"; then
    log "nginx-docs не запущен — пропуск ingress-check"
    return 0
  fi

  local ingress_base="${INGRESS_BASE_URL:-http://127.0.0.1:${DOCS_HTTP_PORT:-8080}}"
  local retries="${DEPLOY_INGRESS_RETRIES:-20}"
  local sleep_s="${DEPLOY_INGRESS_SLEEP_SEC:-2}"
  local code=""

  log "ingress-check ${ingress_base}/ (ожидается не 5xx)"
  for _ in $(seq 1 "$retries"); do
    code="$(curl -sS -o /tmp/deploy-ingress.out -w "%{http_code}" "${ingress_base}/" || true)"
    if [[ "$code" =~ ^[1234][0-9][0-9]$ ]]; then
      return 0
    fi
    sleep "$sleep_s"
  done

  log "ingress-check не прошёл: HTTP ${code:-n/a} для ${ingress_base}/"
  [[ -f /tmp/deploy-ingress.out ]] && cat /tmp/deploy-ingress.out >&2 || true
  fail "ingress-check не прошёл"
}

run_smoke() {
  if [[ "${SKIP_SMOKE:-}" == "1" ]]; then
    log "пропуск smoke-after-deploy (SKIP_SMOKE=1)"
    return 0
  fi
  if ! "${compose_files[@]}" ps --services --status running | awk '{print $1}' | grep -qx "hub-bff"; then
    log "hub-bff не запущен — пропуск smoke-after-deploy"
    return 0
  fi
  if [[ ! -x "${ROOT}/scripts/smoke-after-deploy.sh" ]]; then
    log "smoke-after-deploy не найден или не исполняемый — пропуск smoke"
    return 0
  fi
  log "запуск smoke-after-deploy"
  "${ROOT}/scripts/smoke-after-deploy.sh" >"${deploy_artifacts_dir}/smoke.log" 2>&1
}

run_observability_onboarding() {
  if [[ "${SKIP_OBSERVABILITY_ONBOARD:-}" == "1" ]]; then
    log "пропуск observability onboarding (SKIP_OBSERVABILITY_ONBOARD=1)"
    return 0
  fi
  if [[ "${OBS_AUTO_ONBOARD:-0}" != "1" ]]; then
    log "observability onboarding отключен (OBS_AUTO_ONBOARD!=1)"
    return 0
  fi
  if [[ ! -x "${ROOT}/scripts/observability-onboard-stand.sh" ]]; then
    log "observability onboarding script не найден или не исполняемый — пропуск"
    return 0
  fi

  log "запуск observability onboarding"
  "${ROOT}/scripts/observability-onboard-stand.sh" >"${deploy_artifacts_dir}/observability-onboard.log" 2>&1
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
  run_submodules
  run_openapi_lint
  run_hook "scripts/db-backup.sh" "SKIP_DB_BACKUP" "db-backup"
  run_hook "scripts/run-migrations.sh" "SKIP_MIGRATIONS" "миграции"
  run_docs_build
  run_compose
  sync_keycloak_on_theme_or_realm_change
  sync_frontend_dependencies
  run_observability_onboarding
  run_health_checks
  run_ingress_checks
  run_smoke
  mark_last_good
  capture_compose_ps
  log "готово"
  log "артефакты: ${deploy_artifacts_dir}"
}

main "$@"
