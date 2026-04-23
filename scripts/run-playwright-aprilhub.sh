#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-aprilhub-playwright}"
DOCS_HTTP_PORT="${DOCS_HTTP_PORT:-8080}"
PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://localhost:${DOCS_HTTP_PORT}}"
PLAYWRIGHT_USER="${PLAYWRIGHT_USER:-april-dev}"
PLAYWRIGHT_PASSWORD="${PLAYWRIGHT_PASSWORD:-april-dev-pass}"
LOCAL_UID="${LOCAL_UID:-$(id -u)}"
LOCAL_GID="${LOCAL_GID:-$(id -g)}"
VITE_PROFILE_DEFAULT_ENTITY_TYPE_ID="${VITE_PROFILE_DEFAULT_ENTITY_TYPE_ID:-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb}"
# Для smoke-теста важно начать с PUT к «несуществующей» сущности, чтобы сработал сценарий POST→retry PUT.
VITE_PROFILE_DEMO_ENTITY_ID="${VITE_PROFILE_DEMO_ENTITY_ID:-00000000-0000-0000-0000-000000000001}"
export PLAYWRIGHT_BASE_URL PLAYWRIGHT_USER PLAYWRIGHT_PASSWORD LOCAL_UID LOCAL_GID
export VITE_PROFILE_DEFAULT_ENTITY_TYPE_ID VITE_PROFILE_DEMO_ENTITY_ID

compose() {
  docker compose -p "$COMPOSE_PROJECT_NAME" "$@"
}

cleanup() {
  compose --profile aprilhub down -v >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "[playwright] starting aprilhub profile"
compose --profile aprilhub up -d keycloak-db keycloak hub-bff hub-shell april-showcase nginx-docs

echo "[playwright] waiting for ingress health endpoint"
for _ in {1..90}; do
  if curl -fsS "${PLAYWRIGHT_BASE_URL}/healthz" >/dev/null; then
    break
  fi
  sleep 2
done
curl -fsS "${PLAYWRIGHT_BASE_URL}/healthz" >/dev/null

echo "[playwright] waiting for shell entrypoint"
for _ in {1..90}; do
  if curl -fsS "${PLAYWRIGHT_BASE_URL}/" >/dev/null; then
    break
  fi
  sleep 2
done
curl -fsS "${PLAYWRIGHT_BASE_URL}/" >/dev/null

echo "[playwright] running smoke suite"
(
  cd hub-shell
  npm ci
  npm run e2e:install
  npm run e2e
)
