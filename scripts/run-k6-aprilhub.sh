#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-aprilhub-k6}"
HUB_BFF_HOST_PORT="${HUB_BFF_HOST_PORT:-18081}"
KEYCLOAK_HTTP_PORT="${KEYCLOAK_HTTP_PORT:-18082}"
K6_VUS="${K6_VUS:-4}"
K6_DURATION="${K6_DURATION:-20s}"
KEYCLOAK_ISSUER="${KEYCLOAK_ISSUER:-http://localhost:${KEYCLOAK_HTTP_PORT}/realms/april}"
export HUB_BFF_HOST_PORT KEYCLOAK_HTTP_PORT KEYCLOAK_ISSUER K6_VUS K6_DURATION

compose() {
  docker compose -p "$COMPOSE_PROJECT_NAME" "$@"
}

cleanup() {
  compose --profile aprilhub down -v >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "[k6] starting aprilhub profile"
compose --profile aprilhub up -d keycloak-db keycloak hub-bff

echo "[k6] waiting for hub-bff health"
for _ in {1..60}; do
  if curl -fsS "http://localhost:${HUB_BFF_HOST_PORT}/healthz" >/dev/null; then
    break
  fi
  sleep 2
done
curl -fsS "http://localhost:${HUB_BFF_HOST_PORT}/healthz" >/dev/null

echo "[k6] waiting for keycloak openid config"
for _ in {1..60}; do
  if curl -fsS "http://localhost:${KEYCLOAK_HTTP_PORT}/realms/april/.well-known/openid-configuration" >/dev/null; then
    break
  fi
  sleep 2
done
curl -fsS "http://localhost:${KEYCLOAK_HTTP_PORT}/realms/april/.well-known/openid-configuration" >/dev/null

echo "[k6] obtaining Keycloak dev token"
TOKEN="$(
  curl -sS -X POST "http://localhost:${KEYCLOAK_HTTP_PORT}/realms/april/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=password" \
    -d "client_id=aprilhub-shell" \
    -d "username=april-dev" \
    -d "password=april-dev-pass" \
  | python3 -c 'import json,sys; print(json.load(sys.stdin).get("access_token",""))'
)"

if [[ -z "$TOKEN" ]]; then
  echo "[k6] token is empty"
  exit 1
fi

echo "[k6] waiting for authenticated endpoint warm-up"
for _ in {1..30}; do
  code="$(curl -sS -o /tmp/k6-warmup.out -w "%{http_code}" \
    "http://localhost:${HUB_BFF_HOST_PORT}/api/v1/me" \
    -H "Authorization: Bearer $TOKEN" \
    -H "X-Correlation-Id: k6-warmup" \
    -H "X-Request-Id: k6-warmup")"
  if [[ "$code" == "200" ]]; then
    break
  fi
  sleep 1
done

echo "[k6] running baseline load test"
docker run --rm --network "${COMPOSE_PROJECT_NAME}_default" \
  -e BASE_URL="http://hub-bff:${HUB_BFF_PORT:-8081}" \
  -e AUTH_TOKEN="$TOKEN" \
  -e K6_VUS="$K6_VUS" \
  -e K6_DURATION="$K6_DURATION" \
  -v "$ROOT_DIR/k6:/scripts:ro" \
  grafana/k6:0.53.0 run /scripts/aprilhub-baseline.js

echo "[k6] baseline completed"
