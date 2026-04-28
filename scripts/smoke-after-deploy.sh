#!/usr/bin/env bash
set -euo pipefail

log() { echo "[smoke-after-deploy] $*" >&2; }

ingress_base="${INGRESS_BASE_URL:-http://127.0.0.1:${DOCS_HTTP_PORT:-8080}}"
hub_bff_base="${HUB_BFF_BASE_URL:-${ingress_base}}"
keycloak_base="${KEYCLOAK_BASE_URL:-${ingress_base}/auth}"
keycloak_realm="${KEYCLOAK_REALM:-april}"
keycloak_client_id="${SMOKE_KEYCLOAK_CLIENT_ID:-aprilhub-shell}"
keycloak_user="${SMOKE_KEYCLOAK_USERNAME:-april-dev}"
keycloak_password="${SMOKE_KEYCLOAK_PASSWORD:-april-dev-pass}"

expect_http_code() {
  local expected="$1"
  local url="$2"
  shift 2
  local retries="${SMOKE_HTTP_RETRIES:-15}"
  local sleep_s="${SMOKE_HTTP_SLEEP_SEC:-2}"
  local code=""
  for _ in $(seq 1 "$retries"); do
    code="$(curl -sS -o /tmp/smoke-after-deploy.out -w "%{http_code}" "$@" "$url" || true)"
    if [[ "$code" == "$expected" ]]; then
      return 0
    fi
    sleep "$sleep_s"
  done
  log "expected HTTP $expected, got $code for $url (after ${retries} retries)"
  cat /tmp/smoke-after-deploy.out >&2
  exit 1
}

expect_http_codes() {
  local expected_csv="$1"
  local url="$2"
  shift 2
  local retries="${SMOKE_HTTP_RETRIES:-15}"
  local sleep_s="${SMOKE_HTTP_SLEEP_SEC:-2}"
  local code=""
  local expected_list=",${expected_csv},"
  for _ in $(seq 1 "$retries"); do
    code="$(curl -sS -o /tmp/smoke-after-deploy.out -w "%{http_code}" "$@" "$url" || true)"
    if [[ "${expected_list}" == *",${code},"* ]]; then
      return 0
    fi
    sleep "$sleep_s"
  done
  log "expected HTTP one of [${expected_csv}], got $code for $url (after ${retries} retries)"
  cat /tmp/smoke-after-deploy.out >&2
  exit 1
}

wait_for_ok() {
  local url="$1"
  local retries="${2:-60}"
  local sleep_s="${3:-2}"
  for _ in $(seq 1 "$retries"); do
    if curl -fsS "$url" >/dev/null; then
      return 0
    fi
    sleep "$sleep_s"
  done
  log "endpoint is not ready: $url"
  return 1
}

fetch_keycloak_token() {
  local retries="${SMOKE_TOKEN_RETRIES:-20}"
  local sleep_s="${SMOKE_TOKEN_SLEEP_SEC:-2}"
  local response_file="/tmp/smoke-after-deploy-token.json"
  local parsed=""
  for _ in $(seq 1 "$retries"); do
    curl -sS -X POST "${keycloak_base}/realms/${keycloak_realm}/protocol/openid-connect/token" \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "grant_type=password" \
      -d "client_id=${keycloak_client_id}" \
      -d "username=${keycloak_user}" \
      -d "password=${keycloak_password}" \
      >"${response_file}" || true
    parsed="$(python3 -c 'import json,sys; print(json.load(sys.stdin).get("access_token",""))' <"${response_file}" 2>/dev/null || true)"
    if [[ -n "${parsed}" ]]; then
      printf '%s\n' "${parsed}"
      return 0
    fi
    sleep "${sleep_s}"
  done
  log "empty token from Keycloak after ${retries} retries"
  [[ -f "${response_file}" ]] && cat "${response_file}" >&2 || true
  return 1
}

log "waiting for health/readiness endpoints"
wait_for_ok "${hub_bff_base}/healthz"
wait_for_ok "${hub_bff_base}/readyz"
wait_for_ok "${keycloak_base}/realms/${keycloak_realm}/.well-known/openid-configuration"
wait_for_ok "${ingress_base}/"

log "checking unauthenticated API path"
expect_http_codes "401,403" "${hub_bff_base}/api/v1/aggregation/dashboard"

log "obtaining Keycloak token for smoke user"
token="$(fetch_keycloak_token || true)"
if [[ -z "$token" ]]; then
  exit 1
fi

log "checking authenticated API and role guard"
expect_http_code "200" "${hub_bff_base}/api/v1/me" -H "Authorization: Bearer ${token}"
expect_http_code "403" "${hub_bff_base}/api/v1/admin/ping" -H "Authorization: Bearer ${token}"
expect_http_code "200" "${hub_bff_base}/api/v1/aggregation/dashboard" \
  -H "Authorization: Bearer ${token}" \
  -H "X-Correlation-Id: corr-smoke-deploy" \
  -H "X-Request-Id: req-smoke-deploy"

python3 - <<'PY'
import json
from pathlib import Path

payload = json.loads(Path("/tmp/smoke-after-deploy.out").read_text())
assert payload["status"] in {"ok", "degraded"}
assert payload["metadata"]["correlationId"] == "corr-smoke-deploy"
assert payload["metadata"]["requestId"] == "req-smoke-deploy"
assert payload["metadata"]["sourceService"] == "hub-bff"
PY

log "smoke checks passed"
