#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 5 ]; then
  echo "Usage: $0 <stand_name> <host_ip_or_dns> <service_name> <metrics_port> <env>"
  echo "Example: $0 stand-192-168-1-42 192.168.1.42 hub-bff 8081 dev"
  exit 1
fi

stand_name="$1"
host="$2"
service="$3"
metrics_port="$4"
env_name="$5"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
obs_dir="$(cd "${script_dir}/.." && pwd)"
targets_dir="${obs_dir}/overlays/targets"
target_file="${targets_dir}/${stand_name}-${service}.yml"

mkdir -p "${targets_dir}"

cat > "${target_file}" <<EOF
- labels:
    env: ${env_name}
    host: ${host}
    stand: ${stand_name}
    service: ${service}
  targets:
    - "${host}:${metrics_port}"
EOF

echo "Created target file: ${target_file}"
echo "Apply with:"
echo "  cd ${obs_dir}"
echo "  docker compose --env-file env/.env up -d prometheus"
