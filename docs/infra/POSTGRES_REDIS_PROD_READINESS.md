# PostgreSQL/Redis Production Readiness Baseline (Stage 011)

## 1. Scope and intent

This document fixes the platform baseline for PostgreSQL and Redis in April infrastructure track (`011`) and does not introduce application-level feature changes.

## 2. Target state

### 2.1 PostgreSQL baseline

- Engine: PostgreSQL 17.
- Deployment mode: stateful service on dedicated Docker volume (`keycloak_pgdata` in current repo runtime profile).
- Backup policy:
  - logical backup by `pg_dump` before deploy-impacting changes;
  - encrypted or access-restricted storage on host;
  - retention policy agreed by platform team (minimum 7 daily restore points for dev/pre-prod baseline).
- Restore policy:
  - restore verification drill is mandatory and reproducible;
  - validation includes: instance starts, schema is readable, baseline SQL query passes.
- Security baseline:
  - no public DB port exposure unless explicitly required;
  - credentials only via env/secrets;
  - least-privileged DB users per service.

### 2.2 Redis baseline

- Engine: Redis 7 (alpine image line in compose baseline).
- Deployment mode: single-node baseline with persistence (`appendonly yes`) and password auth.
- Persistence and recovery:
  - AOF enabled to reduce data-loss window;
  - dedicated docker volume for persistent data;
  - restart/recovery drill verifies key persistence after service restart.
- Security baseline:
  - protected by `requirepass`;
  - internal network access only by default;
  - secrets are not committed.

### 2.3 HA level and roadmap note

- Current agreed level for `011`: **operational baseline**, not full multi-node HA.
- Sentinel/replication cluster for Redis and PostgreSQL replication/failover orchestration are follow-up initiatives after baseline stabilization and capacity validation.

## 3. Responsibility split

- **Platform team**
  - infra topology, backup/restore process, Redis persistence mode, security hardening, runbooks, monitoring and alerts;
  - periodic disaster-recovery drills and update of operational docs.
- **Application team**
  - connection settings, retry/timeouts at app boundary, idempotency and graceful degradation;
  - no bypass of platform security policy and no secrets in repo.

## 4. Operational artifacts in repo

- PostgreSQL backup script: `scripts/db-backup.sh`.
- PostgreSQL restore validation: `scripts/validate-postgres-restore.sh`.
- Redis resilience validation: `scripts/redis-resilience-check.sh`.
- Runbooks:
  - `docs/runbooks/POSTGRES_BACKUP_RESTORE.md`
  - `docs/runbooks/REDIS_FAILURE_RECOVERY.md`

## 5. Monitoring baseline (minimum)

- PostgreSQL:
  - availability (`pg_isready`/connection health),
  - storage pressure (volume usage),
  - backup success/failure indicator,
  - restore drill status.
- Redis:
  - availability (`PING`),
  - memory pressure (`used_memory`, `maxmemory` trends),
  - persistence health (`aof_last_write_status`),
  - restart recovery drill status.

## 6. Acceptance mapping for stage 011

- Target state fixed in this document and linked in deployment strategy.
- Backup/restore and recovery procedures are documented and executable by scripts/runbooks.
- Compatibility with current deployment flow is preserved: no business logic extension, only infra baseline hardening.
