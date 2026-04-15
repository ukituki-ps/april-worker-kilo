#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${DEPLOY_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$ROOT_DIR"

log() { echo "[pg-restore-validate] $*" >&2; }

backup_file="${DB_BACKUP_FILE:-}"
backup_dir="${DB_BACKUP_DIR:-$ROOT_DIR/.deploy-artifacts/db-backups}"
restore_db_name="${RESTORE_DB_NAME:-${KEYCLOAK_DB_NAME:-keycloak}}"
restore_db_user="${RESTORE_DB_USER:-${KEYCLOAK_DB_USER:-keycloak}}"
restore_db_password="${RESTORE_DB_PASSWORD:-${KEYCLOAK_DB_PASSWORD:-keycloak}}"
container_name="pg-restore-validate-$(date -u +"%Y%m%d%H%M%S")"
restore_port="${RESTORE_DB_PORT:-55432}"

if ! command -v docker >/dev/null 2>&1; then
  log "docker is required"
  exit 1
fi

if [[ -z "$backup_file" ]]; then
  latest_file="$(ls -1t "$backup_dir"/*.sql 2>/dev/null | head -n 1 || true)"
  backup_file="$latest_file"
fi

if [[ -z "$backup_file" || ! -f "$backup_file" ]]; then
  log "backup file not found; set DB_BACKUP_FILE or run scripts/db-backup.sh first"
  exit 1
fi

cleanup() {
  docker rm -f "$container_name" >/dev/null 2>&1 || true
}
trap cleanup EXIT

log "starting temporary postgres container: $container_name"
docker run -d --rm \
  --name "$container_name" \
  -e POSTGRES_DB="$restore_db_name" \
  -e POSTGRES_USER="$restore_db_user" \
  -e POSTGRES_PASSWORD="$restore_db_password" \
  -p "${restore_port}:5432" \
  postgres:17-alpine >/dev/null

log "waiting for postgres readiness"
for _ in $(seq 1 30); do
  if docker exec "$container_name" pg_isready -U "$restore_db_user" -d "$restore_db_name" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! docker exec "$container_name" pg_isready -U "$restore_db_user" -d "$restore_db_name" >/dev/null 2>&1; then
  log "postgres did not become ready in time"
  exit 1
fi

db_exists="$(docker exec "$container_name" psql -U "$restore_db_user" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${restore_db_name}';" | tr -d '\r' | tr -d '[:space:]')"
if [[ "$db_exists" != "1" ]]; then
  log "creating database '${restore_db_name}' for restore"
  docker exec "$container_name" psql -U "$restore_db_user" -d postgres -c "CREATE DATABASE \"${restore_db_name}\";" >/dev/null
fi

log "restoring dump: $backup_file"
docker exec -i "$container_name" psql -U "$restore_db_user" -d "$restore_db_name" <"$backup_file" >/dev/null

log "running validation query"
validation_result="$(docker exec "$container_name" psql -U "$restore_db_user" -d "$restore_db_name" -tAc "SELECT 1;" | tr -d '\r' | tr -d '[:space:]')"
if [[ "$validation_result" != "1" ]]; then
  log "validation query failed, expected '1', got '$validation_result'"
  exit 1
fi

log "restore validation succeeded"
