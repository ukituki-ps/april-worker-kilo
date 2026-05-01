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

# После `--force-recreate` контейнер «running», но HTTP на 8080 может появиться лишь через десятки секунд.
max_attempts="${KEYCLOAK_THEME_ENSURE_KCADM_RETRIES:-45}"
sleep_s="${KEYCLOAK_THEME_ENSURE_KCADM_SLEEP_SEC:-3}"
attempt=1
cred_out=""
cred_code=1
while [[ "$attempt" -le "$max_attempts" ]]; do
  set +e
  cred_out="$("${compose_cmd[@]}" exec -T keycloak /opt/keycloak/bin/kcadm.sh config credentials \
    --server http://127.0.0.1:8080/auth \
    --realm master \
    --user "${ADMIN_USER}" \
    --password "${ADMIN_PASSWORD}" 2>&1)"
  cred_code=$?
  set -e
  if [[ "$cred_code" -eq 0 ]]; then
    break
  fi
  # Неверные учётные данные — не ждём, сразу падаем кроме временных сетевых ошибок запуска
  if printf '%s' "$cred_out" | grep -qiE 'Unauthorized|invalid user credentials|invalid_password|Forbidden'; then
    echo "[keycloak-theme-ensure] kcadm credentials failed (auth): ${cred_out}" >&2
    exit 1
  fi
  if printf '%s' "$cred_out" | grep -qiE 'Connection refused|ConnectException|ECONNREFUSED|failed to connect|Unable to execute HTTP'; then
    echo "[keycloak-theme-ensure] waiting for Keycloak HTTP (attempt ${attempt}/${max_attempts}, ${sleep_s}s)"
    sleep "$sleep_s"
    attempt=$((attempt + 1))
    continue
  fi
  echo "[keycloak-theme-ensure] kcadm credentials failed: ${cred_out}" >&2
  exit 1
done

if [[ "$cred_code" -ne 0 ]]; then
  echo "[keycloak-theme-ensure] kcadm never became reachable after ${max_attempts} attempts (${cred_out})" >&2
  exit 1
fi

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
