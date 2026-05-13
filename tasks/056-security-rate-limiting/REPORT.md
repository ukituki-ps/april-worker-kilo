# ОТЧЁТ — 056-security-rate-limiting

**Статус:** ✅ Выполнено
**Дата завершения:** 13.05.2026

## Что реализовано

### 1. Redis клиент

Создана новая пакетка `hub-bff/internal/redis/`:
- `redis.go` — обёртка над `go-redis/go-redis/v9`
- `New(ctx, host, port)` — создание и проверка соединения через ping
- Функции: `Do`, `Eval` (Lua-скрипты), `Pipeline`, `Close`
- Подключается в `main.go` с конфигурацией из `cfg.RedisHost` / `cfg.RedisPort`

### 2. Rate Limiting middleware

**Файл:** `hub-bff/internal/middleware/ratelimiter.go`

- **Sliding window counter** через Lua-скрипт в Redis (атомарность на стороне сервера)
- **Tiered limits по паттерну пути:**
  - `/api/v1/me`, `/api/v1/admin/*`: 10 req/min per user (JWT subject)
  - `/api/v1/aggregation/*`, `/api/v1/overview`: 100 req/min per IP
  - `/healthz`, `/readyz`, `/metrics`: без ограничения
- **Response headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`
- **429 response:** JSON body с `code: rate_limit_exceeded`, header `Retry-After`
- **Fail-open:** при недоступности Redis запрос проходит (не создаёт SPOF)
- **Logging:** slog warn с correlationId/requestId при rate-limited запросах
- **Prometheus метрика:** `hub_bff_rate_limited_requests_total{endpoint, reason}`

### 3. Подключение в main.go

Rate limiter добавлен в middleware chain ДО auth:
```
RateLimiter → CORS → Metadata → AccessLog → auth.Validate → handler
```
Это экономит ресурсы auth при rate-limiting.

### 4. Обновлён OpenAPI spec

- Добавлена схема `RateLimitResponse` в `components/schemas`
- Добавлен response `429` со схемой и header `Retry-After` ко всем protected endpoint'ам:
  - `/api/v1/overview`
  - `/api/v1/aggregation/dashboard`
  - `/api/v1/aggregation/home`
  - `/api/v1/aggregation/summary`
  - `/api/v1/me`
  - `/api/v1/admin/ping`
  - `/api/v1/admin/profile/{proxyPath}`

### 5. Тесты

**Файл:** `hub-bff/internal/middleware/ratelimiter_test.go`

| Тест | Что проверяет |
|---|---|
| `TestResolveTier` | Tier resolution для всех паттернов путей |
| `TestPathMatches` | Prefix matching логика |
| `TestWriteTooManyRequests` | 429 response: код, body, header Retry-After |
| `TestRateLimitHeaders` | X-RateLimit-Limit / X-RateLimit-Remaining заголовки |
| `TestCountingRateLimiterAllow` | Лимит запросов, исчерпание, retryAfter |
| `TestCountingRateLimiterDifferentKeys` | Изоляция счётчиков по ключу |

## Изменённые файлы

| Файл | Действие |
|---|---|
| `hub-bff/internal/redis/redis.go` | Новый |
| `hub-bff/internal/middleware/limiter.go` | Переписан (исправлен интерфейс) |
| `hub-bff/internal/middleware/ratelimiter.go` | Новый |
| `hub-bff/internal/middleware/mock_ratelimiter.go` | Исправлен (сигнатура Allow) |
| `hub-bff/internal/middleware/ratelimiter_test.go` | Новый |
| `hub-bff/internal/config/config.go` | Добавлен RedisHost, RedisPort |
| `hub-bff/cmd/hub-bff/main.go` | Добавлен Redis init + RateLimiter middleware |
| `hub-bff/internal/observability/metrics.go` | Добавлена ObserveRateLimited |
| `hub-bff/go.mod` | Добавлена зависимость go-redis/v9 |
| `openapi/aprilhub-bff.yaml` | Новые: RateLimitResponse schema, 429 responses |

## Результаты проверки

```bash
cd hub-bff && go build ./...       # ✅ Компилируется
cd hub-bff && go test ./...        # ✅ Все тесты проходят
```

## Риски

- Redis соединение создаёт дополнительную зависимость — fail-open поведение должно быть задокументировано в runbook
- Rate limiter использует sliding window counter на секундной гранулярности — для микросекундной точности нужно переписать на log-based алгоритм

## Дальнейшее

- После 056 завершена, можно запускать 057 (CSP headers) и 061 (BFF caching)
- 059 (penetration testing) ждёт завершения 056 и 057
