#!/usr/bin/env bash
set -euo pipefail

log() { echo "[redis-resilience] $*" >&2; }

if ! command -v docker >/dev/null 2>&1; then
  log "docker is required"
  exit 1
fi

redis_password="${REDIS_PASSWORD:-redis-dev-change-me}"
redis_image="${REDIS_IMAGE:-redis:7-alpine}"
container_name="redis-resilience-$(date -u +"%Y%m%d%H%M%S")"
volume_name="redis-resilience-vol-$(date -u +"%Y%m%d%H%M%S")"
probe_key="${REDIS_PROBE_KEY:-stage011:probe}"
probe_value="${REDIS_PROBE_VALUE:-ok-$(date -u +"%Y%m%dT%H%M%SZ")}"

cleanup() {
  docker rm -f "$container_name" >/dev/null 2>&1 || true
  docker volume rm "$volume_name" >/dev/null 2>&1 || true
}
trap cleanup EXIT

log "creating isolated redis volume: $volume_name"
docker volume create "$volume_name" >/dev/null

log "starting redis with AOF and password auth"
docker run -d --rm \
  --name "$container_name" \
  -v "${volume_name}:/data" \
  "$redis_image" \
  redis-server \
  --appendonly yes \
  --save "60 1" \
  --requirepass "$redis_password" >/dev/null

for _ in $(seq 1 30); do
  if docker exec "$container_name" redis-cli -a "$redis_password" PING >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

ping_result="$(docker exec "$container_name" redis-cli -a "$redis_password" PING | tr -d '\r' | tr -d '[:space:]')"
if [[ "$ping_result" != "PONG" ]]; then
  log "redis ping failed"
  exit 1
fi

log "writing probe key"
docker exec "$container_name" redis-cli -a "$redis_password" SET "$probe_key" "$probe_value" >/dev/null

log "simulating failure via container restart"
docker restart "$container_name" >/dev/null

for _ in $(seq 1 30); do
  if docker exec "$container_name" redis-cli -a "$redis_password" PING >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

restored_value="$(docker exec "$container_name" redis-cli -a "$redis_password" GET "$probe_key" | tr -d '\r')"
if [[ "$restored_value" != "$probe_value" ]]; then
  log "persistence check failed: expected '$probe_value', got '$restored_value'"
  exit 1
fi

log "redis resilience baseline check succeeded"
