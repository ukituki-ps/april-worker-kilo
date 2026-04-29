#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-aprilhub-k6}"
HUB_BFF_PORT="${HUB_BFF_PORT:-8081}"
KEYCLOAK_HTTP_PORT="${KEYCLOAK_HTTP_PORT:-8080}"
K6_VUS="${K6_VUS:-4}"
K6_DURATION="${K6_DURATION:-20s}"
K6_SUMMARY_EXPORT="${K6_SUMMARY_EXPORT:-}"
K6_STARTUP_TIMEOUT_SEC="${K6_STARTUP_TIMEOUT_SEC:-300}"
KC_HOSTNAME="${KC_HOSTNAME:-http://keycloak:${KEYCLOAK_HTTP_PORT}/auth}"
KEYCLOAK_ISSUER="${KEYCLOAK_ISSUER:-${KC_HOSTNAME}/realms/april}"
LOCAL_UID="${LOCAL_UID:-$(id -u)}"
LOCAL_GID="${LOCAL_GID:-$(id -g)}"
export HUB_BFF_PORT KEYCLOAK_HTTP_PORT KC_HOSTNAME KEYCLOAK_ISSUER K6_VUS K6_DURATION K6_STARTUP_TIMEOUT_SEC LOCAL_UID LOCAL_GID

compose() {
  docker compose -p "$COMPOSE_PROJECT_NAME" "$@"
}

net_curl() {
  docker run --rm --network "${COMPOSE_PROJECT_NAME}_default" curlimages/curl:8.12.1 "$@"
}

print_startup_diagnostics() {
  echo "[k6] startup diagnostics:"
  compose --profile aprilhub ps || true
  compose --profile aprilhub logs --no-color --tail 200 hub-bff keycloak keycloak-db || true
}

wait_for_http() {
  local name="$1"
  local url="$2"
  local attempts=$((K6_STARTUP_TIMEOUT_SEC / 2))
  if (( attempts < 1 )); then
    attempts=1
  fi

  echo "[k6] waiting for ${name}: ${url} (timeout ${K6_STARTUP_TIMEOUT_SEC}s)"
  for ((i = 1; i <= attempts; i++)); do
    if net_curl -fsS "$url" >/dev/null; then
      return 0
    fi
    sleep 2
  done

  echo "[k6] timeout while waiting for ${name}: ${url}"
  print_startup_diagnostics
  return 1
}

cleanup() {
  compose --profile aprilhub down -v >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "[k6] starting aprilhub profile"
compose --profile aprilhub up -d keycloak-db keycloak hub-bff

wait_for_http "hub-bff health" "http://hub-bff:${HUB_BFF_PORT}/healthz"
wait_for_http "keycloak openid config" "http://keycloak:${KEYCLOAK_HTTP_PORT}/auth/realms/april/.well-known/openid-configuration"

echo "[k6] obtaining Keycloak dev token"
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
  echo "[k6] token is empty"
  exit 1
fi

echo "[k6] waiting for authenticated endpoint warm-up"
for _ in {1..30}; do
  code="$(net_curl -sS -o /tmp/k6-warmup.out -w "%{http_code}" \
    "http://hub-bff:${HUB_BFF_PORT}/api/v1/me" \
    -H "Authorization: Bearer $TOKEN" \
    -H "X-Correlation-Id: k6-warmup" \
    -H "X-Request-Id: k6-warmup")"
  if [[ "$code" == "200" ]]; then
    break
  fi
  sleep 1
done

if [[ "$code" != "200" ]]; then
  echo "[k6] warm-up failed with status $code"
  cat /tmp/k6-warmup.out || true
  exit 1
fi

echo "[k6] running baseline load test"
K6_ARGS=()
DOCKER_VOLUME_ARGS=()
if [[ -n "$K6_SUMMARY_EXPORT" ]]; then
  summary_dir="$(dirname "$K6_SUMMARY_EXPORT")"
  mkdir -p "$summary_dir"
  summary_dir_abs="$(cd "$summary_dir" && pwd)"
  K6_ARGS+=(--summary-export "/scripts-artifacts/summary.json")
  DOCKER_VOLUME_ARGS+=(-v "${summary_dir_abs}:/scripts-artifacts")
fi

docker run --rm --network "${COMPOSE_PROJECT_NAME}_default" \
  --user "${LOCAL_UID}:${LOCAL_GID}" \
  -e BASE_URL="http://hub-bff:${HUB_BFF_PORT}" \
  -e AUTH_TOKEN="$TOKEN" \
  -e K6_VUS="$K6_VUS" \
  -e K6_DURATION="$K6_DURATION" \
  -v "$ROOT_DIR/k6:/scripts:ro" \
  "${DOCKER_VOLUME_ARGS[@]}" \
  grafana/k6:0.53.0 run "${K6_ARGS[@]}" /scripts/aprilhub-baseline.js

if [[ -n "$K6_SUMMARY_EXPORT" ]]; then
  if [[ ! -s "$K6_SUMMARY_EXPORT" ]]; then
    echo "[k6] summary export is missing or empty at $K6_SUMMARY_EXPORT"
    exit 1
  fi
fi

echo "[k6] baseline completed"
