#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${DEPLOY_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$ROOT_DIR"

log() { echo "[db-backup] $*" >&2; }

timestamp="$(date -u +"%Y%m%dT%H%M%SZ")"
backup_dir="${DB_BACKUP_DIR:-$ROOT_DIR/.deploy-artifacts/db-backups}"
mkdir -p "$backup_dir"
backup_file="${DB_BACKUP_FILE:-$backup_dir/keycloak-${timestamp}.sql}"

pg_db="${KEYCLOAK_DB_NAME:-keycloak}"
pg_user="${KEYCLOAK_DB_USER:-keycloak}"

if [[ "${SKIP_DB_BACKUP:-}" == "1" ]]; then
  log "skip requested via SKIP_DB_BACKUP=1"
  exit 0
fi

if [[ "${DB_BACKUP_MODE:-compose}" == "compose" ]]; then
  if ! docker compose ps --services --status running | awk '{print $1}' | grep -qx "keycloak-db"; then
    log "service keycloak-db is not running, backup hook skipped"
    exit 0
  fi
  log "creating backup from docker compose service keycloak-db"
  docker compose exec -T keycloak-db pg_dump -U "$pg_user" -d "$pg_db" >"$backup_file"
elif [[ "${DB_BACKUP_MODE}" == "url" ]]; then
  if [[ -z "${ATLAS_DATABASE_URL:-}" ]]; then
    log "ATLAS_DATABASE_URL is required for DB_BACKUP_MODE=url"
    exit 1
  fi
  if ! command -v pg_dump >/dev/null 2>&1; then
    log "pg_dump is required for DB_BACKUP_MODE=url"
    exit 1
  fi
  log "creating backup using pg_dump and ATLAS_DATABASE_URL"
  pg_dump "$ATLAS_DATABASE_URL" >"$backup_file"
else
  log "unsupported DB_BACKUP_MODE=${DB_BACKUP_MODE}"
  exit 1
fi

log "backup saved: $backup_file"
echo "$backup_file"
