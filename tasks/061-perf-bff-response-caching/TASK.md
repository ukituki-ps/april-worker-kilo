# Задача 061: BFF Response Caching

## Мета
- **ID / ветка:** `061-perf-bff-response-caching`
- **Приоритет:** высокий (Phase 9 — Performance трек, нет зависимостей)
- **ADR:** [`docs/architecture/ADR-april-phase-9-security-and-performance.md`](../../docs/architecture/ADR-april-phase-9-security-and-performance.md)

## Цель
Реализовать response caching для read-only BFF endpoints, используя Redis. Cache должен быть configurable, tenant-aware, и integrated с observability стек.

## Контекст для агента
- Hub BFF: Go/Gin
- Redis: уже используется в infra (observability, rate limiting из 056)
- Read-only endpoints: `/v1/profiles/list`, `/v1/profiles/:id`, `/v1/entity-types/list`, `/v1/entity-types/:id`
- BFF не пишет данные — только читает из downstream сервисов

## Входит в объём

### Cache Middleware
- [ ] Redis cache middleware для Gin: response cache для GET requests
- [ ] Cache key: `aprilhub:bff:cache:{endpoint}:{user-tenant-id}:{query-params-hash}`
- [ ] Cache TTL:
  - `/v1/profiles/list`: 60s (профили меняются редко)
  - `/v1/profiles/:id`: 120s (конкретный профиль — стабильнее)
  - `/v1/entity-types/list`: 300s (entity types — очень редкие changes)
  - `/v1/entity-types/:id`: 300s
- [ ] Cache invalidation:
  - TTL-based expiration (primary)
  - Manual invalidation через admin HTTP endpoint (POST /cache/invalidate?pattern=...)
  - User event-driven invalidation (если downstream публикует event — future)
- [ ] Cache miss: pass through к upstream, store response в Redis

### Cache Headers
- [ ] `X-Cache: HIT` или `MISS` в response header
- [ ] `Cache-Control: public, max-age=<TTL>` для cached responses
- [ ] `ETag` header: hash response body — для conditional requests

### Per-Tenant Cache Isolation
- [ ] Cache key включает tenant ID из JWT claims
- [ ] Данные одного tenant не попадут в cache другого tenant
- [ ] Cache key hash: sha256(endpoint + tenant + query_params + sort)

### Observability
- [ ] Prometheus metrics:
  - `cache_hit_total`, `cache_miss_total`
  - `cache_size_bytes`, `cache_keys_total`
  - `cache_ttl_remaining_seconds` (histogram)
- [ ] Loki logs: cache miss events (debug level), cache invalidation events (info level)
- [ ] Grafana dashboard panel: cache hit rate, cache size, TTL distribution

### Testing
- [ ] Unit tests: cache middleware logic, key generation, TTL handling
- [ ] Integration tests: cache HIT/MISS behavior, per-tenant isolation
- [ ] Load test: k6 с cache включён vs выключён — сравнить response times

## Не входит в объём
- Cache для SSE endpoint (SSE — streaming, не cachable)
- Cache для write endpoints (если добавим)
- Cache warming (future optimization)
- Multi-level cache (CDN) — это upstream infrastructure

## Технические ограничения
- Redis: existing из infra setup, использовать тот же client
- Не менять API responses — cache transparent для upstream consumers
- Rate limiting middleware (056) должен работать поверх cache (не bypass)

## Критерии готовности (acceptance)
- [ ] Cache middleware запущен на всех read-only endpoints
- [ ] Cache HIT rate > 70% при повторных requests
- [ ] Per-tenant isolation работает (no cross-tenant data)
- [ ] Prometheus metrics для cache работают
- [ ] Unit + integration tests зелёные
- [ ] k6 сравнение: cache vs no-cache — response time улучшение ≥30%
- [ ] OpenAPI spec updated с cache-extensions

## Проверка
```bash
# Test cache behavior
curl -H "Authorization: Bearer <token>" http://localhost:8080/v1/profiles/list -I
# Check X-Cache: MISS первый раз, HIT второй

# Check Prometheus metrics
curl http://localhost:9090/metrics | grep cache_hit

# k6 comparison
# Run k6 twice: once with cache, once without
# Compare response times in k6 reports
```

## Результат в отчёте
Go middleware файлы, Redis config, Prometheus metrics, perf comparison data.
