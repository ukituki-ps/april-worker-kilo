# ОТЧЁТ — 061-perf-bff-response-caching

**Статус:** ✅ Выполнено
**Дата завершения:** 13.05.2026

## Что реализовано

### 1. Redis Cache Middleware

**Файл:** `hub-bff/internal/middleware/cache.go`

- **Redis-backed response caching** для GET запросов на read-only endpoints
- **Cache key:** `aprilhub:bff:cache:{endpoint}:{user-id}:{query-hash}` — user-isolated, tenant-aware
- **TTL по endpoint:**
  - `/api/v1/aggregation/dashboard`: 60s
  - `/api/v1/aggregation/summary`: 60s
  - `/api/v1/aggregation/home`: 30s
  - `/api/v1/overview`: 30s
  - `/api/v1/me`: 10s
- **Response headers:** `X-Cache: HIT/MISS`, `Cache-Control: public, max-age=`
- **InvalidateEndpoint:** ручная инвалидация по паттерну через KEYS command в Lua
- **Enabled flag:** кэш можно отключить для тестирования

### 2. Observability

Обновлён `hub-bff/internal/observability/metrics.go`:
- `hub_bff_cache_hit_total{path}` — счёчик cache hits
- `hub_bff_cache_miss_total{path}` — счёчик cache misses
- `ObserveCacheHit/ObserveCacheMiss` в Recorder interface и PrometheusRecorder

### 3. Подключение в main.go

Cache middleware добавлен ПОСЛЕ rate limiter, ДО CORS:
```
RateLimiter → Cache → CORS → Metadata → AccessLog → auth.Validate → handler
```

### 4. Тесты

**Файл:** `hub-bff/internal/middleware/cache_test.go`
- `TestResolveTTL` — проверка TTL resolution по паттерну пути
- `TestTimeToSec` — конвертация duration в сек
- `TestBuildCacheKey` — генерация user-isolated cache key

## Изменённые файлы

| Файл | Действие |
|---|---|
| `hub-bff/internal/middleware/cache.go` | Новый (cache middleware) |
| `hub-bff/internal/middleware/cache_test.go` | Новый (тесты) |
| `hub-bff/internal/observability/metrics.go` | Добавлены cache метрики |
| `hub-bff/cmd/hub-bff/main.go` | Подключён cache middleware |

## Результаты проверки

```bash
cd hub-bff && go build ./...  # ✅ Компилируется
cd hub-bff && go test ./...   # ✅ Все тесты проходят
```

## Риски

- KEYS command в Redis может быть медленной при большом количестве ключей — для production заменить на SCAN
- Cache middleware работает на уровне response capture — не все headers корректно переписываются (нужно тестировать с ETag)

## Дальнейшее

- k6 сравнение с кэшем vs без кэша (требует работающего dev stack)
- Добавить admin endpoint для инвалидации кэша
