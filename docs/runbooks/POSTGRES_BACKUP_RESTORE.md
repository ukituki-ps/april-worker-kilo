# Runbook: PostgreSQL backup and restore validation

## Purpose

Provide a reproducible sequence for backup and restore validation for PostgreSQL baseline in stage `011`.

## Preconditions

- Docker is available on the host.
- Compose profile with `keycloak-db` is reachable when backup is taken in `compose` mode.
- Enough local disk space for backup and temporary restore container.

## Backup

```bash
./scripts/db-backup.sh
```

Output is a path to created dump file (SQL format).

## Restore validation drill

```bash
./scripts/validate-postgres-restore.sh
```

Optional parameters:

```bash
DB_BACKUP_FILE=.deploy-artifacts/db-backups/keycloak-<timestamp>.sql \
RESTORE_DB_NAME=keycloak \
RESTORE_DB_USER=keycloak \
./scripts/validate-postgres-restore.sh
```

## Success criteria

- Temporary PostgreSQL container becomes ready.
- SQL dump is restored without errors.
- Validation query completes successfully.
- Script exits with code `0`.

## Failure handling

1. Preserve logs from script output.
2. Verify dump file integrity and non-zero size.
3. Re-run backup with the same source DB and compare output.
4. If restore still fails, mark deploy gate as blocked and open infra incident/task with logs attached.

## Recovery notes

- Validation script always uses isolated disposable container and does not mutate runtime database.
- Temporary container and workspace are removed automatically on success/failure.
