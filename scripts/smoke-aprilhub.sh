#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-aprilhub-smoke}"
INGRESS_HTTP_PORT="${INGRESS_HTTP_PORT:-8080}"
DOCS_HTTP_PORT="${DOCS_HTTP_PORT:-${INGRESS_HTTP_PORT}}"
KEYCLOAK_BASE_URL="${KEYCLOAK_BASE_URL:-http://localhost:${DOCS_HTTP_PORT}/auth}"
KC_HOSTNAME="${KC_HOSTNAME:-${KEYCLOAK_BASE_URL}}"
KEYCLOAK_ISSUER="${KEYCLOAK_ISSUER:-${KEYCLOAK_BASE_URL}/realms/april}"
export DOCS_HTTP_PORT KC_HOSTNAME KEYCLOAK_ISSUER

ingress_base="http://localhost:${DOCS_HTTP_PORT}"
started_compose=0

compose() {
  docker compose -p "$COMPOSE_PROJECT_NAME" "$@"
}

cleanup() {
  if [[ "$started_compose" -eq 1 ]]; then
    compose --profile aprilhub down -v >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

if curl -fsS "${ingress_base}/healthz" >/dev/null && curl -fsS "${ingress_base}/auth/realms/april/.well-known/openid-configuration" >/dev/null; then
  echo "[smoke] detected existing ingress on ${ingress_base}, using current environment"
else
  echo "[smoke] starting aprilhub profile"
  compose --profile aprilhub up -d keycloak-db keycloak hub-bff hub-shell april-showcase nginx-docs
  started_compose=1
fi

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

echo "[smoke] checking keycloak login page theme (ru + aprilhub css)"
CODE_VERIFIER="$(
  python3 - <<'PY'
import os, base64
print(base64.urlsafe_b64encode(os.urandom(32)).decode("utf-8").rstrip("="))
PY
)"
CODE_CHALLENGE="$(
  python3 - <<'PY' "$CODE_VERIFIER"
import hashlib, base64, sys
ver = sys.argv[1].encode("utf-8")
print(base64.urlsafe_b64encode(hashlib.sha256(ver).digest()).decode("utf-8").rstrip("="))
PY
)"

# For PKCE-based authorization code flow we need a code_challenge.
AUTH_URL="${ingress_base}/auth/realms/april/protocol/openid-connect/auth?client_id=aprilhub-shell&redirect_uri=${ingress_base}/&response_type=code&scope=openid&state=smoke-ci&nonce=smoke-ci&code_challenge=${CODE_CHALLENGE}&code_challenge_method=S256"

login_body_file="/tmp/keycloak-login.html"
login_http_code="$(
  curl -sS -L -o "${login_body_file}" -w "%{http_code}" "${AUTH_URL}"
)"
if [[ "${login_http_code}" != "200" ]]; then
  echo "[smoke] unexpected Keycloak login page HTTP ${login_http_code}"
  python3 - <<'PY'
from pathlib import Path
print(Path("/tmp/keycloak-login.html").read_text(errors="ignore")[:2000])
PY
  exit 1
fi

python3 - <<'PY'
import re
from pathlib import Path
html = Path("/tmp/keycloak-login.html").read_text(errors="ignore")

# Keycloak may rewrite stylesheet URLs, so check both exact file and themed resource pattern.
has_exact_css = "aprilhub-login.css" in html
has_theme_css_pattern = bool(
    re.search(r"/auth/resources/[^\"']+/login/aprilhub/[^\"']+\.css", html)
)
assert has_exact_css or has_theme_css_pattern, "expected aprilhub login theme css reference in Keycloak login page HTML"

# Keep this check tolerant to Keycloak wording changes: we need at least one Russian UI fragment.
ru_candidates = ["Войти", "Вход", "Пароль", "Имя пользователя"]
assert any(s in html for s in ru_candidates), "expected Russian login UI strings not found"
PY

expect_http_code() {
  local expected="$1"
  local url="$2"
  shift 2
  local code
  code="$(curl -sS --max-time 15 -o /tmp/smoke.out -w "%{http_code}" "$@" "$url")"
  if [[ "$code" != "$expected" ]]; then
    echo "[smoke] expected HTTP $expected, got $code for $url"
    cat /tmp/smoke.out
    exit 1
  fi
}

echo "[smoke] checking shell entrypoint"
for _ in {1..180}; do
  if curl -fsS "${ingress_base}/" >/dev/null; then
    break
  fi
  sleep 2
done
expect_http_code "200" "${ingress_base}/"
curl -fsS "${ingress_base}/" -o /tmp/shell-entrypoint.html
python3 - <<'PY'
from pathlib import Path
html = Path("/tmp/shell-entrypoint.html").read_text(errors="ignore")
assert "<title>April — платформа для операций, ИТ и комплаенса</title>" in html, "expected AprilHub shell title marker not found on entrypoint"
PY

echo "[smoke] checking design-system showcase entrypoint"
for _ in {1..180}; do
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
