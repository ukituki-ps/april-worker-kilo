# Runbook: Redis failure and recovery baseline

## Purpose

Validate Redis baseline resilience in stage `011`: persistence, restart recovery, and access control.

## Preconditions

- Docker is available.
- `REDIS_PASSWORD` is set (default fallback exists in script for local check, but production must provide strong secret).

## Recovery drill

```bash
./scripts/redis-resilience-check.sh
```

What drill does:

1. Starts temporary Redis container with AOF and password auth.
2. Writes test key.
3. Restarts container (simulated node restart/failure).
4. Verifies that key remains available after restart.

## Success criteria

- Redis responds to authenticated `PING`.
- Test key value is recovered after restart.
- Script exits with code `0`.

## Failure handling

1. Capture script output and `docker logs` for temporary container.
2. Verify Redis startup args (`appendonly yes`, `requirepass`).
3. Check volume mount and host disk availability.
4. Re-run drill; if reproducible failure remains, block release gate and escalate to platform team.

## Operational notes

- Current level is single-node operational baseline; it is not equivalent to Sentinel-managed automatic failover.
- Follow-up enhancement (outside current stage): add replica + sentinel topology and failover probes.
