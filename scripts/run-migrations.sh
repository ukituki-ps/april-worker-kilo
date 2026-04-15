#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${DEPLOY_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$ROOT_DIR"

log() { echo "[migrations] $*" >&2; }

migrations_dir="${ATLAS_MIGRATIONS_DIR:-}"
db_url="${ATLAS_DATABASE_URL:-}"

if [[ "${SKIP_MIGRATIONS:-}" == "1" ]]; then
  log "skip requested via SKIP_MIGRATIONS=1"
  exit 0
fi

if [[ -z "$migrations_dir" || -z "$db_url" ]]; then
  log "atlas migration env is not fully configured (ATLAS_MIGRATIONS_DIR, ATLAS_DATABASE_URL), running no-op"
  exit 0
fi

if ! command -v atlas >/dev/null 2>&1; then
  log "atlas cli is required when migration env is configured"
  exit 1
fi

if [[ ! -d "$migrations_dir" ]]; then
  log "migration directory not found: $migrations_dir"
  exit 1
fi

log "atlas migrate apply --dir file://${migrations_dir}"
atlas migrate apply --dir "file://${migrations_dir}" --url "$db_url"
log "migrations applied"
