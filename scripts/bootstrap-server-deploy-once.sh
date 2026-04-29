#!/usr/bin/env bash
# Однократная подготовка server-local файлов в DEPLOY_ROOT для AprilHub (april-worker).
# Идемпотентно: не перезаписывает существующие .env / images.env.
# См. docs/DEPLOYMENT_STRATEGY.md §5.1
set -euo pipefail

ROOT="${DEPLOY_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$ROOT"

log() { echo "[bootstrap-deploy] $*" >&2; }

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  log "ошибка: не git-репозиторий: $ROOT"
  exit 1
fi

origin_url="$(git remote get-url origin 2>/dev/null || true)"
if [[ "$origin_url" != *april-worker* ]]; then
  log "предупреждение: origin=$origin_url — ожидается клон ukituki-ps/april-worker"
fi

if [[ ! -f .env ]]; then
  if [[ -f .env.example ]]; then
    cp -n .env.example .env
    log "создан .env из .env.example — отредактируйте секреты и хосты под стенд"
  else
    log "ошибка: нет .env.example"
    exit 1
  fi
else
  log ".env уже есть — не трогаю"
fi

if [[ ! -f images.env ]]; then
  if [[ -f images.env.example ]]; then
    cp -n images.env.example images.env
    log "создан images.env из images.env.example"
  else
    log "ошибка: нет images.env.example"
    exit 1
  fi
else
  log "images.env уже есть — не трогаю"
fi

if ! grep -qE '^[[:space:]]*HUB_BFF_IMAGE=' images.env 2>/dev/null; then
  log "подсказка: в images.env нет HUB_BFF_IMAGE= — compose возьмёт дефолты из docker-compose.yml; для ghcr задайте SHA см. DEPLOYMENT_STRATEGY.md"
fi

for x in deploy.sh scripts/db-backup.sh scripts/run-migrations.sh scripts/rollback-migrations.sh scripts/smoke-after-deploy.sh scripts/observability-onboard-stand.sh; do
  if [[ -f "$x" && ! -x "$x" ]]; then
    chmod +x "$x"
    log "chmod +x $x"
  fi
done

mkdir -p .deploy-state .deploy-artifacts 2>/dev/null || true

log "готово: $ROOT"
log "далее: GitHub → Settings → Variables → APRIL_DEPLOY_ROOT=$ROOT"
log "далее: GitHub → Secrets → APRIL_PROFILE_DEPLOY_KEY (SSH для vendor/april-profile в deploy.sh)"
log "проверка: docker compose config (из каталога $ROOT)"
