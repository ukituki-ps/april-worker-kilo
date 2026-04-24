#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-aprilhub-playwright}"
DOCS_HTTP_PORT="${DOCS_HTTP_PORT:-8080}"
PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://localhost:${DOCS_HTTP_PORT}}"
PLAYWRIGHT_USER="${PLAYWRIGHT_USER:-april-dev}"
PLAYWRIGHT_PASSWORD="${PLAYWRIGHT_PASSWORD:-april-dev-pass}"
PLAYWRIGHT_RESTRICTED_USER="${PLAYWRIGHT_RESTRICTED_USER:-april-user}"
PLAYWRIGHT_RESTRICTED_PASSWORD="${PLAYWRIGHT_RESTRICTED_PASSWORD:-april-user-pass}"
KC_HOSTNAME="${KC_HOSTNAME:-${PLAYWRIGHT_BASE_URL}/auth}"
KEYCLOAK_ISSUER="${KEYCLOAK_ISSUER:-${PLAYWRIGHT_BASE_URL}/auth/realms/april}"
LOCAL_UID="${LOCAL_UID:-$(id -u)}"
LOCAL_GID="${LOCAL_GID:-$(id -g)}"
VITE_PROFILE_DEFAULT_ENTITY_TYPE_ID="${VITE_PROFILE_DEFAULT_ENTITY_TYPE_ID:-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb}"
# Для smoke-теста важно начать с PUT к «несуществующей» сущности, чтобы сработал сценарий POST→retry PUT.
VITE_PROFILE_DEMO_ENTITY_ID="${VITE_PROFILE_DEMO_ENTITY_ID:-00000000-0000-0000-0000-000000000001}"
VITE_PROFILE_LIST_ENTITY_IDS="${VITE_PROFILE_LIST_ENTITY_IDS:-00000000-0000-0000-0000-000000000001}"
VITE_PROFILE_INSTANCE_IDS="${VITE_PROFILE_INSTANCE_IDS:-demo-instance}"

# Если локальный node_modules принадлежит root (после прошлых docker/npm запусков),
# npm ci внутри контейнера под обычным uid падает с EACCES. В этом случае
# переключаем user контейнеров на root для стабилизации smoke.
if [ -d "$ROOT_DIR/hub-shell/node_modules" ] && {
  [ ! -w "$ROOT_DIR/hub-shell/node_modules" ] || [ -d "$ROOT_DIR/hub-shell/node_modules/.bin" ] && [ ! -w "$ROOT_DIR/hub-shell/node_modules/.bin" ];
}; then
  echo "[playwright] hub-shell/node_modules is not writable; fallback to root user in containers"
  LOCAL_UID=0
  LOCAL_GID=0
fi

export PLAYWRIGHT_BASE_URL PLAYWRIGHT_USER PLAYWRIGHT_PASSWORD
export PLAYWRIGHT_RESTRICTED_USER PLAYWRIGHT_RESTRICTED_PASSWORD
export LOCAL_UID LOCAL_GID
export VITE_PROFILE_DEFAULT_ENTITY_TYPE_ID VITE_PROFILE_DEMO_ENTITY_ID VITE_PROFILE_LIST_ENTITY_IDS VITE_PROFILE_INSTANCE_IDS
export KC_HOSTNAME KEYCLOAK_ISSUER

compose() {
  docker compose -p "$COMPOSE_PROJECT_NAME" "$@"
}

wait_for_url() {
  local url="$1"
  local attempts="${2:-180}"
  local sleep_sec="${3:-2}"
  for _ in $(seq 1 "$attempts"); do
    if curl -fsS "$url" >/dev/null; then
      return 0
    fi
    sleep "$sleep_sec"
  done
  return 1
}

wait_keycloak_jwks() {
  local jwks_url="http://keycloak:8080/auth/realms/april/protocol/openid-connect/certs"
  local i
  for i in $(seq 1 360); do
    if docker run --rm --network "${COMPOSE_PROJECT_NAME}_default" busybox:1.36 wget -qO- "$jwks_url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  return 1
}

cleanup() {
  compose --profile aprilhub down -v >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "[playwright] starting keycloak (DB + Keycloak)"
compose --profile aprilhub up -d keycloak-db keycloak

echo "[playwright] waiting for Keycloak JWKS (hub-bff auth init depends on it)"
# Образ Keycloak без wget/curl в PATH; проверяем JWKS из ephemeral busybox в сети compose.
if ! wait_keycloak_jwks; then
  echo "[playwright] keycloak did not expose JWKS in time"
  exit 1
fi

echo "[playwright] starting hub-bff, hub-shell, nginx-docs"
compose --profile aprilhub up -d hub-bff hub-shell nginx-docs

echo "[playwright] waiting for hub-bff health (direct container check)"
# После JWKS Keycloak обычно достаточно 1–2 минут; оставляем запас на холодный go mod + compile.
if ! compose exec -T hub-bff sh -lc "for i in \$(seq 1 450); do wget -qO- http://127.0.0.1:8081/healthz >/dev/null 2>&1 && exit 0; sleep 2; done; exit 1"; then
  echo "[playwright] hub-bff did not become healthy in time"
  exit 1
fi

echo "[playwright] waiting for ingress health endpoint"
wait_for_url "${PLAYWRIGHT_BASE_URL}/healthz" 180 2
curl -fsS "${PLAYWRIGHT_BASE_URL}/healthz" >/dev/null

echo "[playwright] waiting for shell entrypoint"
wait_for_url "${PLAYWRIGHT_BASE_URL}/" 180 2
curl -fsS "${PLAYWRIGHT_BASE_URL}/" >/dev/null

echo "[playwright] running smoke suite"
(
  cd hub-shell
  npm run e2e
)
