#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-aprilhub-smoke}"
INGRESS_HTTP_PORT="${INGRESS_HTTP_PORT:-18080}"
DOCS_HTTP_PORT="${DOCS_HTTP_PORT:-${INGRESS_HTTP_PORT}}"
KEYCLOAK_BASE_URL="${KEYCLOAK_BASE_URL:-http://localhost:${DOCS_HTTP_PORT}/auth}"
KC_HOSTNAME="${KC_HOSTNAME:-${KEYCLOAK_BASE_URL}}"
KEYCLOAK_ISSUER="${KEYCLOAK_ISSUER:-${KEYCLOAK_BASE_URL}/realms/april}"
export DOCS_HTTP_PORT KC_HOSTNAME KEYCLOAK_ISSUER

ingress_base="http://localhost:${DOCS_HTTP_PORT}"

compose() {
  docker compose -p "$COMPOSE_PROJECT_NAME" "$@"
}

cleanup() {
  compose --profile aprilhub down -v >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "[smoke] starting aprilhub profile"
compose --profile aprilhub up -d keycloak-db keycloak hub-bff hub-shell april-showcase nginx-docs

echo "[smoke] waiting for ingress health endpoint"
for _ in {1..60}; do
  if curl -fsS "${ingress_base}/healthz" >/dev/null; then
    break
  fi
  sleep 2
done
curl -fsS "${ingress_base}/healthz" >/dev/null

echo "[smoke] waiting for keycloak token endpoint"
for _ in {1..60}; do
  if curl -fsS "${ingress_base}/auth/realms/april/.well-known/openid-configuration" >/dev/null; then
    break
  fi
  sleep 2
done
curl -fsS "${ingress_base}/auth/realms/april/.well-known/openid-configuration" >/dev/null

expect_http_code() {
  local expected="$1"
  local url="$2"
  shift 2
  local code
  code="$(curl -sS -o /tmp/smoke.out -w "%{http_code}" "$@" "$url")"
  if [[ "$code" != "$expected" ]]; then
    echo "[smoke] expected HTTP $expected, got $code for $url"
    cat /tmp/smoke.out
    exit 1
  fi
}

echo "[smoke] checking shell entrypoint"
for _ in {1..90}; do
  if curl -fsS "${ingress_base}/" >/dev/null; then
    break
  fi
  sleep 2
done
expect_http_code "200" "${ingress_base}/"

echo "[smoke] checking design-system showcase entrypoint"
for _ in {1..90}; do
  if curl -fsS "${ingress_base}/showcase/" >/dev/null; then
    break
  fi
  sleep 2
done
expect_http_code "200" "${ingress_base}/showcase/"

echo "[smoke] checking unauthenticated path"
expect_http_code "401" "${ingress_base}/api/v1/aggregation/dashboard"

echo "[smoke] obtaining Keycloak dev token"
TOKEN="$(
  curl -sS -X POST "${ingress_base}/auth/realms/april/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=password" \
    -d "client_id=aprilhub-shell" \
    -d "username=april-dev" \
    -d "password=april-dev-pass" \
  | python3 -c 'import json,sys; print(json.load(sys.stdin).get("access_token",""))'
)"
if [[ -z "$TOKEN" ]]; then
  echo "[smoke] token is empty"
  exit 1
fi

echo "[smoke] checking authorized and role-guard paths"
expect_http_code "200" "${ingress_base}/api/v1/me" -H "Authorization: Bearer $TOKEN"
expect_http_code "403" "${ingress_base}/api/v1/admin/ping" -H "Authorization: Bearer $TOKEN"
expect_http_code "200" "${ingress_base}/api/v1/aggregation/dashboard" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Correlation-Id: corr-smoke-ci" \
  -H "X-Request-Id: req-smoke-ci"

python3 - <<'PY'
import json
from pathlib import Path

payload = json.loads(Path("/tmp/smoke.out").read_text())
assert payload["status"] in {"ok", "degraded"}, "unexpected status"
assert "metadata" in payload, "missing metadata"
assert payload["metadata"]["correlationId"] == "corr-smoke-ci", "correlation id mismatch"
assert payload["metadata"]["requestId"] == "req-smoke-ci", "request id mismatch"
assert payload["metadata"]["sourceService"] == "hub-bff", "source service mismatch"
PY

echo "[smoke] aprilhub smoke checks passed"
