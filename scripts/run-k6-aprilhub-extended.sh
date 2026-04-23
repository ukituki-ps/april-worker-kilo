#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-aprilhub-k6-extended}"
HUB_BFF_PORT="${HUB_BFF_PORT:-8081}"
KEYCLOAK_HTTP_PORT="${KEYCLOAK_HTTP_PORT:-8080}"
K6_EXTENDED_VUS="${K6_EXTENDED_VUS:-12}"
K6_EXTENDED_DURATION="${K6_EXTENDED_DURATION:-2m}"
K6_SUMMARY_EXPORT="${K6_SUMMARY_EXPORT:-}"
LOCAL_UID="${LOCAL_UID:-$(id -u)}"
LOCAL_GID="${LOCAL_GID:-$(id -g)}"
export HUB_BFF_PORT KEYCLOAK_HTTP_PORT K6_EXTENDED_VUS K6_EXTENDED_DURATION LOCAL_UID LOCAL_GID

compose() {
  docker compose -p "$COMPOSE_PROJECT_NAME" "$@"
}

net_curl() {
  docker run --rm --network "${COMPOSE_PROJECT_NAME}_default" curlimages/curl:8.12.1 "$@"
}

cleanup() {
  compose --profile aprilhub down -v >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "[k6-extended] starting aprilhub profile"
compose --profile aprilhub up -d keycloak-db keycloak hub-bff

echo "[k6-extended] waiting for hub-bff health"
for _ in {1..60}; do
  if net_curl -fsS "http://hub-bff:${HUB_BFF_PORT}/healthz" >/dev/null; then
    break
  fi
  sleep 2
done
net_curl -fsS "http://hub-bff:${HUB_BFF_PORT}/healthz" >/dev/null

echo "[k6-extended] waiting for keycloak openid config"
for _ in {1..60}; do
  if net_curl -fsS "http://keycloak:${KEYCLOAK_HTTP_PORT}/auth/realms/april/.well-known/openid-configuration" >/dev/null; then
    break
  fi
  sleep 2
done
net_curl -fsS "http://keycloak:${KEYCLOAK_HTTP_PORT}/auth/realms/april/.well-known/openid-configuration" >/dev/null

echo "[k6-extended] obtaining Keycloak dev token"
TOKEN="$(
  net_curl -sS -X POST "http://keycloak:${KEYCLOAK_HTTP_PORT}/auth/realms/april/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=password" \
    -d "client_id=aprilhub-shell" \
    -d "username=april-dev" \
    -d "password=april-dev-pass" \
  | python3 -c 'import json,sys; print(json.load(sys.stdin).get("access_token",""))'
)"

if [[ -z "$TOKEN" ]]; then
  echo "[k6-extended] token is empty"
  exit 1
fi

echo "[k6-extended] running extended load profile"
K6_ARGS=()
DOCKER_VOLUME_ARGS=()
if [[ -n "$K6_SUMMARY_EXPORT" ]]; then
  mkdir -p "$(dirname "$K6_SUMMARY_EXPORT")"
  K6_ARGS+=(--summary-export "/scripts-artifacts/summary.json")
  DOCKER_VOLUME_ARGS+=(-v "$(dirname "$K6_SUMMARY_EXPORT"):/scripts-artifacts")
fi

docker run --rm --network "${COMPOSE_PROJECT_NAME}_default" \
  -e BASE_URL="http://hub-bff:${HUB_BFF_PORT}" \
  -e AUTH_TOKEN="$TOKEN" \
  -e K6_EXTENDED_VUS="$K6_EXTENDED_VUS" \
  -e K6_EXTENDED_DURATION="$K6_EXTENDED_DURATION" \
  -v "$ROOT_DIR/k6:/scripts:ro" \
  "${DOCKER_VOLUME_ARGS[@]}" \
  grafana/k6:0.53.0 run "${K6_ARGS[@]}" /scripts/aprilhub-extended.js

echo "[k6-extended] extended profile completed"
