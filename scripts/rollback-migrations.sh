#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${DEPLOY_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$ROOT_DIR"

log() { echo "[migrations-rollback] $*" >&2; }

migrations_dir="${ATLAS_MIGRATIONS_DIR:-}"
db_url="${ATLAS_DATABASE_URL:-}"
steps="${ATLAS_ROLLBACK_STEPS:-1}"

if [[ "${SKIP_MIGRATION_ROLLBACK:-}" == "1" ]]; then
  log "skip requested via SKIP_MIGRATION_ROLLBACK=1"
  exit 0
fi

if [[ -z "$migrations_dir" || -z "$db_url" ]]; then
  log "atlas rollback env is not fully configured, running no-op"
  exit 0
fi

if ! command -v atlas >/dev/null 2>&1; then
  log "atlas cli is required when rollback env is configured"
  exit 1
fi

if [[ ! -d "$migrations_dir" ]]; then
  log "migration directory not found: $migrations_dir"
  exit 1
fi

log "atlas migrate down --dir file://${migrations_dir} --steps ${steps}"
atlas migrate down --dir "file://${migrations_dir}" --url "$db_url" --steps "$steps"
log "migration rollback completed"
