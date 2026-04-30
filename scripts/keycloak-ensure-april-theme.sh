#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

REALM="${KEYCLOAK_REALM:-april}"
LOGIN_THEME="${KEYCLOAK_LOGIN_THEME:-aprilhub}"
ACCOUNT_THEME="${KEYCLOAK_ACCOUNT_THEME:-aprilhub}"
ADMIN_USER="${KEYCLOAK_ADMIN:-admin}"
ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:-admin}"

compose_cmd=(docker compose)
if [[ -f .env ]]; then
  compose_cmd+=(--env-file .env)
fi
if [[ -f images.env ]]; then
  compose_cmd+=(--env-file images.env)
fi

if ! "${compose_cmd[@]}" ps --services --status running | awk '$1=="keycloak"{found=1} END{exit(found?0:1)}'; then
  echo "[keycloak-theme-ensure] keycloak service is not running; skip"
  exit 0
fi

"${compose_cmd[@]}" exec -T keycloak /opt/keycloak/bin/kcadm.sh config credentials \
  --server http://127.0.0.1:8080/auth \
  --realm master \
  --user "${ADMIN_USER}" \
  --password "${ADMIN_PASSWORD}" >/dev/null

"${compose_cmd[@]}" exec -T keycloak /opt/keycloak/bin/kcadm.sh update "realms/${REALM}" \
  -s "loginTheme=${LOGIN_THEME}" \
  -s "accountTheme=${ACCOUNT_THEME}" >/dev/null

current_themes="$(
  "${compose_cmd[@]}" exec -T keycloak /opt/keycloak/bin/kcadm.sh get "realms/${REALM}" |
    python3 -c 'import json,sys; d=json.load(sys.stdin); print("{},{}".format(d.get("loginTheme","-"), d.get("accountTheme","-")))'
)"

if [[ "${current_themes}" != "${LOGIN_THEME},${ACCOUNT_THEME}" ]]; then
  echo "[keycloak-theme-ensure] expected ${LOGIN_THEME}/${ACCOUNT_THEME}, got ${current_themes}" >&2
  exit 1
fi

echo "[keycloak-theme-ensure] realm=${REALM} loginTheme=${LOGIN_THEME} accountTheme=${ACCOUNT_THEME}"
