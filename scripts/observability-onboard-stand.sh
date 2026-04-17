#!/usr/bin/env bash
set -euo pipefail

log() { echo "[observability-onboard] $*" >&2; }

if [[ "${OBS_AUTO_ONBOARD:-0}" != "1" ]]; then
  log "skip: OBS_AUTO_ONBOARD!=1"
  exit 0
fi

ROOT="${DEPLOY_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
OBS_PATH="${OBS_PATH:-${ROOT}/infra/observability}"
REGISTER_SCRIPT="${OBS_PATH}/scripts/register-stand-target.sh"

if [[ ! -x "${REGISTER_SCRIPT}" ]]; then
  log "skip: register script not found or not executable: ${REGISTER_SCRIPT}"
  exit 0
fi

central_host="${OBS_CENTRAL_HOST:-}"
central_user="${OBS_CENTRAL_USER:-${USER}}"
central_obs_path="${OBS_CENTRAL_OBS_PATH:-/opt/april/infra/observability}"

if [[ -z "${central_host}" ]]; then
  log "skip: OBS_CENTRAL_HOST is empty"
  exit 0
fi

stand_host_default="$(hostname -I 2>/dev/null | awk '{print $1}')"
stand_host="${OBS_STAND_HOST:-${stand_host_default:-127.0.0.1}}"
stand_name="${OBS_STAND_NAME:-stand-${stand_host//./-}}"
service_name="${OBS_SERVICE_NAME:-hub-bff}"
metrics_port="${OBS_METRICS_PORT:-${HUB_BFF_PORT:-8081}}"
env_name="${OBS_ENV_NAME:-dev}"
loki_push_url="${OBS_LOKI_PUSH_URL:-http://${central_host}:3100/loki/api/v1/push}"

local_hostnames="127.0.0.1 localhost $(hostname -s) $(hostname -f 2>/dev/null || true)"

is_central_local=0
for item in ${local_hostnames}; do
  if [[ "${central_host}" == "${item}" ]]; then
    is_central_local=1
    break
  fi
done

register_target() {
  if [[ "${is_central_local}" == "1" ]]; then
    log "register target locally in ${OBS_PATH}"
    (
      cd "${OBS_PATH}"
      ./scripts/register-stand-target.sh "${stand_name}" "${stand_host}" "${service_name}" "${metrics_port}" "${env_name}"
      docker compose --env-file env/.env up -d prometheus
    )
    return 0
  fi

  log "register target on central host ${central_user}@${central_host}:${central_obs_path}"
  ssh -o BatchMode=yes "${central_user}@${central_host}" \
    "cd '${central_obs_path}' && ./scripts/register-stand-target.sh '${stand_name}' '${stand_host}' '${service_name}' '${metrics_port}' '${env_name}' && docker compose --env-file env/.env up -d prometheus"
}

setup_local_promtail_agent() {
  if [[ "${OBS_SETUP_LOCAL_PROMTAIL_AGENT:-1}" != "1" ]]; then
    log "skip local promtail agent setup (OBS_SETUP_LOCAL_PROMTAIL_AGENT!=1)"
    return 0
  fi

  local agent_path="${OBS_PATH}/agents/promtail"
  if [[ ! -f "${agent_path}/docker-compose.yml" ]]; then
    log "skip: promtail agent compose not found in ${agent_path}"
    return 0
  fi

  log "configure local promtail agent in ${agent_path}"
  mkdir -p "${agent_path}"
  cat > "${agent_path}/.env" <<EOF
HOST_ALIAS=${stand_host}
STAND_NAME=${stand_name}
LOKI_PUSH_URL=${loki_push_url}
EOF

  (
    cd "${agent_path}"
    docker compose --env-file .env up -d
  )
}

register_target
setup_local_promtail_agent

log "done: stand=${stand_name} host=${stand_host} service=${service_name} metrics_port=${metrics_port}"
