# Security Audit Report — April Worker Hub BFF

> Подготовлено для penetration test (задача 059)
> Дата: 2026-05-13
> Диапазон: `hub-bff/`, `infra/nginx/`, `docker-compose*.yml`

---

## 1. Auth Middleware — JWT Validation

**Файл:** `hub-bff/internal/auth/middleware.go`

### ✅ Что реализовано правильно

| Контроль | Статус | Строки |
|------ |------ |------ |
| Bearer token parsing | ✅ | L112-L120 |
| JWKS fetching с retry (60 попыток × 2s) | ✅ | L44-L53 |
| Issuer validation (`jwt.WithIssuer`) | ✅ | L124 |
| Expiration required (`jwt.WithExpirationRequired`) | ✅ | L126 |
| Signature methods restricted (RS256/384/512) | ✅ | L125 |
| Audience validation (aud + azp fallback) | ✅ | L133-L136 |
| Role-based access control (RealmAccess.Roles) | ✅ | L143-L161 |
| NBF (not-before) проверяется jwt lib-кой | ✅ (автоматически) | — |
| Expired token → 401 Unauthorized | ✅ | L128-L131 |
| Invalid signature → 401 Unauthorized | ✅ | L128-L131 |
| Claims помещаются в context | ✅ | L138 |
| Observability для auth errors | ✅ | L78-L80 |

### ⚠️ Gaps

#### GAP-1: Нет rate limiting на auth endpoint'ы в самом middleware
**Severity:** MEDIUM
**Где:** `middleware.go`, L109-L141
**Проблема:** При ошибке аутентификации возвращается 401 без throttle. Атакующий может массово перебирать токены.
**Статус:** Rate limiter применяется на внешнем уровне (main.go L103), но если tier не matched — auth-запрос всё равно проходит. Это частично закрыто rate limiter'ом tier `/api/v1/me` (10 req/min), но не для всех путей.

#### GAP-2: `writeError` discloses `requestId` и `correlationId` из headers атакующего
**Severity:** LOW
**Где:** `middleware.go`, L75-L77
**Проблема:** Если атакующий передаёт произвольные значения в `X-Correlation-Id`/`X-Request-Id`, они отражаются в ответе и логах. Это не data leak как таковой, но позволяет коррелировать атаки в log-агрегаторе.
**Рекомендация:** Использовать server-generated ID, если client-headers пустые или содержат подозрительные паттерны.

#### GAP-3: Нет validation `iat` (issued at) claims
**Severity:** LOW
**Где:** `middleware.go`, L123-L127
**Проблема:** `jwt.ParseWithClaims` проверяет exp и nbf, но не `iat`. Теоретически можно подставить токен с аномальный iat. Это маловероятно при RS256 подписи, но для defense-in-depth стоит добавить `jwt.WithIssuedAt()`.

---

## 2. Rate Limiting

**Файл:** `hub-bff/internal/middleware/ratelimiter.go`

### ✅ Что реализовано правильно

| Контроль | Статус | Строки |
|------ |------ |------ |
| Redis-backed distributed sliding window | ✅ | L43-L60, L114-L138 |
| Per-path longest-prefix matching | ✅ | L152-L165 |
| User-aware identity для sensitive paths | ✅ | L80-L84 |
| Fail-open при Redis fail | ⚠️ (см ниже) | L116-L123 |
| Rate limit headers (X-RateLimit-*) | ✅ | L173-L176 |
| Retry-After header при 429 | ✅ | L178-L188 |
| Observability (Prometheus counters) | ✅ | L103 |
| Lua script atomic operations | ✅ | L43-L60 |

### ⚠️ Gaps

#### GAP-4: Fail-open при недоступности Redis
**Severity:** HIGH
**Где:** `ratelimiter.go`, L116-L123
```go
// Fail-open: if Redis is unavailable, allow the request.
return true, limit, limit, 0
```
**Проблема:** Если Redis падает (или атакующий его перегружает DoS), rate limiting полностью отключается и все запросы проходят без ограничений.
**Рекомендация:** Реализовать in-memory fallback counter (например, `sync.Map` с TTL) вместо полного bypass. Даже грубый счётчик на уровне процесса лучше, чем ничего.

#### GAP-5: IP-based rate limiting для nonsensitive tiers легко обойти через прокси
**Severity:** MEDIUM
**Где:** `ratelimiter.go`, L79: `identifier := r.RemoteAddr`
**Проблема:** Для nonsensitive tiers rate limit привязан к `r.RemoteAddr`. В production за Nginx этот адрес — IP внутреннего Docker-контейнера Nginx, а не реальный клиент. Для корректной работы нужен `X-Forwarded-For`, который Nginx поставляет (`proxy_set_header X-Real-IP $remote_addr`).
**Реальность:** Nginx proxy'ит `X-Real-IP`, но hub-bff читает `r.RemoteAddr` — это IP upstream'а (Nginx контейнер), т.к. Go stdlib net/http не парсит X-Forwarded-For автоматически. **Все запросы от всех клиентов имеют одинаковый RemoteAddr в production (один IP Nginx-контейнера).**
**Impact:** Rate limit на aggregation endpoints (100 req/60s) делится между всеми пользователями. Это снижает эффект rate limiting.

#### GAP-6: Нет rate limiting для unauthenticated endpoints
**Severity:** MEDIUM
**Где:** `ratelimiter.go`, L141-L147 (DefaultTiers)
```go
{Matches: "/api/v1/me", Sensitive: true, Limit: 10, WindowSeconds: 60},
{Matches: "/api/v1/admin", Sensitive: true, Limit: 10, WindowSeconds: 60},
{Matches: "/api/v1/aggregation", Sensitive: false, Limit: 100, WindowSeconds: 60},
{Matches: "/api/v1/overview", Sensitive: false, Limit: 100, WindowSeconds: 60},
```
**Проблема:**
- `/healthz` и `/readyz` без limit → можно перегружать health check endpoint
- `/metrics` без limit → экспозиция метрик без ограничения
- `/api/v1/csp-report` без limit → атакующий может спамить этой точкой записи в Loki
**Рекомендация:** Добавить tier для `/csp-report` с низким лимитом.

#### GAP-7: Non-sensitive tiers используют IP, но Sensitive flag опирается на JWT Subject
**Severity:** LOW
**Где:** `ratelimiter.go`, L80-L84
```go
if tier.Sensitive {
    if claims, ok := auth.ClaimsFromContext(r.Context()); ok {
        identifier = claims.Subject
    }
}
```
**Проблема:** Если claims missing (что невозможно по архитектуре, т.к. auth middleware всегда ставит claims), fallback к `r.RemoteAddr` происходит молча. Лучше логировать этот edge case.

---

## 3. CORS Configuration

**Файл:** `hub-bff/internal/http/cors.go`

### ✅ Что реализовано правильно

| Контроль | Статус | Строки |
|------ |------ |------ |
| Whitelist-based origin validation | ✅ | L11 |
| `Vary: Origin` header | ✅ | L13 |
| Allow-Headers limited to Authorization + Content-Type | ✅ | L14 |
| Pre-flight OPTIONS handling | ✅ | L18-L21 |
| Configured via env var | ✅ | config.go L40 |

### ⚠️ Gaps

#### GAP-8: Default CORS origins включают localhost для dev, но нет env validation
**Severity:** LOW
**Где:** `config.go`, L40: `"http://localhost:4173,http://127.0.0.1:4173"`
**Проблема:** Если в production забыть переопределить `HUB_BFF_CORS_ORIGINS`, то localhost будет разрешён. В production это не критично, т.к. localhost недоступен извне, но лучше добавить assert на production env.

#### GAP-9: CORS middleware не обрабатывает `Access-Control-Request-Headers`
**Severity:** LOW
**Где:** `cors.go`, L14
**Проблема:** Hardcoded `Access-Control-Allow-Headers: Authorization, Content-Type`. Если downstream endpoints потребуют дополнительные custom headers, preflight запросы будут отклонены. Это не уязвимость, а ограничение функциональности.

#### GAP-10: Нет `Access-Control-Allow-Credentials`
**Severity:** LOW
**Где:** `cors.go`
**Проблема:** BFF не отправляет `Access-Control-Allow-Credentials: true`. Если клиент пошлёт credentialed запросы с cookies, browser заблокирует. Это корректно для BFF-паттерна (auth через Bearer token), но стоит задокументировать это решение.

---

## 4. Nginx Security Headers

**Файл:** `infra/nginx/aprilhub.conf` (production)

### ✅ Что реализовано правильно

| Контроль | Статус | Строки |
|------ |------ |------ |
| Strict-Transport-Security (HSTS) — 1 год, includeSubDomains | ✅ | L12 |
| X-Content-Type-Options: nosniff | ✅ | L13 |
| X-XSS-Protection: 0 (делегирование CSP) | ✅ | L14 |
| Referrer-Policy: strict-origin-when-cross-origin | ✅ | L15 |
| Permissions-Policy (geolocation, microphone, camera) | ✅ | L16 |
| X-Frame-Options: DENY для API и Keycloak | ✅ | L21, L40 |
| X-Frame-Options: SAMEORIGIN для hub-shell | ✅ | L69 |
| CSP: API = `default-src 'none'` | ✅ | L42 |
| CSP: Shell = whitelist self + Keycloak + Sentry | ✅ | L71 |
| CSP report-uri endpoint | ✅ | L71 |
| Headers повторяются в nested location | ✅ | — |

### ⚠️ Gaps

#### GAP-11: CSP для hub-shell содержит `'unsafe-inline'` и `'unsafe-eval'`
**Severity:** MEDIUM
**Где:** `aprilhub.conf`, L71
```
script-src 'self' 'unsafe-inline' 'unsafe-eval'
style-src 'self' 'unsafe-inline'
```
**Проблема:** `'unsafe-inline'` в `script-src` ослабляет защиту от XSS. `'unsafe-eval'` позволяет динамическую компиляцию JS. Это необходимо для Vite dev server и некоторых библиотек (React devtools, Sentry bundled code), но в production это риск.
**Рекомендация:** Для prod сборки заменить nonce-based CSP. Vite/React можно настроить на использование `nonce-` directive.

#### GAP-12: `connect-src` включает `https://sentry.io` — потенциальный data leak
**Severity:** LOW
**Где:** `aprilhub.conf`, L71
```
connect-src 'self' https://dev.april.ukituki.tech https://sentry.io
```
**Проблема:** Это корректная настройка для Sentry reporting, но стоит убедиться, что Sentry DSN не экспонируется через response headers.

#### GAP-13: HSTS без `preload`
**Severity:** LOW
**Где:** `aprilhub.conf`, L12
```
Strict-Transport-Security "max-age=31536000; includeSubDomains"
```
**Рекомендация:** Добавить `; preload` для усиленной HSTS защиты и регистрации в HSTS Preload List.

#### GAP-14: Nginx default.conf (dev) — нет security headers
**Severity:** MEDIUM
**Где:** `infra/nginx/default.conf`
**Проблема:** Dev config не имеет security headers. Если dev сервер случайно экспонируется в сеть, нет защиты.
**Рекомендация:** Добавить `add_header` директивы или `include` shared security headers file.

#### GAP-15: /metrics endpoint без auth в Nginx
**Severity:** MEDIUM
**Где:** `aprilhub.conf` + `main.go`, L61
**Проблема:** `/metrics` accessible без auth. Prometheus metrics содержат:
- Path-based data access patterns (какие эндпоинты вызывались)
- Downstream service status
- Rate limit и auth error statistics
**Рекомендация:** Добавить IP-based restriction на `/metrics` в Nginx (только monitoring pod IP) или аутентификацию.

---

## 5. API Endpoints Exposure

**Файл:** `hub-bff/cmd/hub-bff/main.go`

### Endpoint Inventory

| Endpoint | Auth Required | RBAC | Rate Limited | Cache |
|------ |------ |------ |------ |------ |
| `GET /healthz` | ❌ | — | ❌ | ❌ |
| `GET /readyz` | ❌ | — | ❌ | ❌ |
| `GET /metrics` | ❌ | ❌ | ❌ | ❌ |
| `GET /api/v1/overview` | ✅ | user/admin ✅ | ✅ 100/60s | ✅ 30s |
| `GET /api/v1/aggregation/dashboard` | ✅ | user/admin ✅ | ✅ 100/60s | ✅ 60s |
| `GET /api/v1/aggregation/home` | ✅ | user/admin ✅ | ✅ 100/60s | ✅ 30s |
| `GET /api/v1/aggregation/summary` | ✅ | user/admin ✅ | ✅ 100/60s | ✅ 60s |
| `GET /api/v1/me` | ✅ | user/admin ✅ | ✅ 10/60s | ✅ 10s |
| `GET /api/v1/admin/ping` | ✅ | admin ✅ | ✅ 10/60s | ❌ |
| `GET /api/v1/admin/profile/` | ✅ | admin ✅ | ✅ 10/60s | ❌ |
| `POST /api/v1/csp-report` | ❌ | — | ❌ | ❌ |

### ⚠️ Gaps

#### GAP-17: `/metrics` полностью open
**Severity:** HIGH
**Где:** `main.go`, L61
**Проблема:** Prometheus metrics endpoint без какой-либо защиты. Любой может получить:
- Количество request'ов по path-ам (activity profiling)
- Downstream service health status
- Rate limit statistics (для reconnaissance)
- Auth error counts
**Рекомендация:** IP whitelist в Nginx: `allow 10.0.0.0/8; allow 172.16.0.0/12; deny all;`

#### GAP-18: CSP report endpoint без rate limiting
**Severity:** MEDIUM
**Где:** `main.go`, L91
**Проблема:** `/api/v1/csp-report` без auth и без rate limit. Атакующий может:
1. Заспамить Loki логи (DoS на observability)
2. Overflow Prometheus counters

#### GAP-19: Health/Readiness endpoints без rate limiting
**Severity:** LOW
**Где:** `main.go`, L59-L60
**Проблема:** `/healthz` и `/readyz` доступны без ограничений. Хотя это low-overhead endpoints, массовые запросы создают нагрузку на logging.

#### GAP-20: Нет method restriction на read-only endpoints
**Severity:** MEDIUM
**Где:** `main.go`, L63-L89
**Проблема:** Все `/api/v1/*` endpoints accept ANY HTTP method. Хотя Go handler'ы обрабатывают только GET, OPTIONS запросы обрабатываются CORS middleware'ом, а другие методы доходят до handler'ов и возвращают 200 (не 405).
**Тест:** `POST /api/v1/me` с valid token returns 200 (handler просто читает GET).
**Рекомендация:** Добавить method whitelist в middleware chain.

---

## 6. SQL Injection

### ✅ Нет прямого SQL доступа в BFF

**Файл:** `hub-bff/internal/aggregation/adapter.go`, runtime.go

BFF не использует SQL database напрямую. Все downstream-запросы — HTTP GET с hardcoded path'ами:

```go
// adapter.go L45
req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
```

```go
// runtime.go L62-L63
{name: "workflow", adapter: r.workflow, path: "/api/v1/ui/dashboard/workflow"},
```

**Нет string concatenation URL из user input.** All paths are compile-time constants.

### ⚠️ Gaps

#### GAP-21: Redis Lua script injection потенциала нет, но `KEYS` command в production — риск
**Severity:** MEDIUM
**Где:** `cache.go`, L177-L182
```lua
for i, key in ipairs(redis.call('KEYS', ARGV[1])) do
    redis.call('DEL', key)
end
```
**Проблема:** `redis.call('KEYS', ARGV[1])` использует `KEYS` command, которая блокирует Redis на время сканирования всего key space. В production при большом количестве ключей это может вызвать latency spike или timeout.
**Рекомендация:** Заменить на `SCAN`-based iteration в Lua:
```lua
local cursor = "0"
repeat
    local result = redis.call('SCAN', cursor, 'MATCH', ARGV[1], 'COUNT', 100)
    cursor = result[1]
    for _, key in ipairs(result[2]) do
        redis.call('DEL', key)
    end
until cursor == "0"
```

#### GAP-22: Cache invalidation pattern `prefix+"*"` user-controlled?
**Severity:** LOW
**Где:** `cache.go`, L171-L188
**Проблема:** `InvalidateEndpoint` принимает pattern string. Если этот метод вызывается с user-controlled input, атакующий может удалить чужие cache entries. Проверить, кто вызывает `InvalidateEndpoint` — если только internal admin, риск низкий.

---

## 7. Дополнительные Security Issues

#### GAP-23: Redis без аутентификации в Go-коде
**Severity:** HIGH
**Где:** `redis/redis.go`, L19-L26
```go
rc := redis.NewClient(&redis.Options{
    Addr:         addr,
    Password:     "",  // HARDCODED empty password
    ...
})
```
**Проблема:** Redis password hard-coded как пустая строка. Хотя docker-compose.yml имеет `--requirepass`, Go-код его не использует. Redis connection из hub-bff не аутентифицируется.
**Реальность:** В production Redis имеет password (из docker-compose), но BFF пытается подключиться без него → **connection fail в production если Redis password не пустой**.
**Рекомендация:** Добавить `REDIS_PASSWORD` env var и передать его в `redis.Options.Password`.

#### GAP-24: Reverse Proxy без Host header validation (SSRF)
**Severity:** MEDIUM
**Где:** `profile_proxy.go`, L38-L41
```go
req.URL.Scheme = upstreamURL.Scheme
req.URL.Host = upstreamURL.Host
req.URL.Path = singleSlashPath(upstreamURL.Path, remainder)
```
**Проблема:** `httputil.NewSingleHostReverseProxy` использует upstream URL из config. Config приходит из env var `APRIL_PROFILE_ADMIN_URL`. Если attacker получит контроль над env var (через misconfigured deployment), может перенаправить proxy на internal network service.
**Рекомендация:** Добавить URL validation: разрешить только known hosts, блокировать localhost/private IP ranges.

#### GAP-25: `lib/pq` в dependencies без использования
**Severity:** INFORMATIONAL
**Где:** `go.mod`, L10
**Проблема:** `github.com/lib/pq v1.12.3` есть в go.mod, но BFF не подключается к PostgreSQL напрямую. Это увеличенная surface атаки — если postgresql driver импортируется, он добавляет code paths.
**Рекомендация:** Убрать из go.mod если не используется, или задокументировать WHY.

#### GAP-26: Server header disclosure
**Severity:** LOW
**Где:** `main.go`, L111
```go
http.ListenAndServe(addr, handler)
```
**Проблема:** Go stdlib http отправляет `Server: Go-http-server/` по умолчанию. Nginx по умолчанию добавляет `Server: nginx/version`.
**Рекомендация:** Добавить `server_tokens off;` в Nginx config. Go: добавить header removal middleware.

#### GAP-27: Error messages могут disclosure internal info
**Severity:** LOW
**Где:** `auth/middleware.go`, L129
```go
writeError(w, r, http.StatusUnauthorized, "unauthorized", "invalid token")
```
**Хорошая новость:** Все auth-ошибки возвращают generic `"invalid token"` — нет differentiation между expired, wrong signature, wrong issuer. Это правильно.
**Плохая новость:** Downstream errors в `adapter.go` L117 disclosure service name и status code:
```go
errors.New(errorMessageFromStatus(res.StatusCode, a.name))
```
Этот текст попадает в `Degraded.Message` → JSON response → клиент может узнать internal service names.
**Рекомендация:** Абстрактить service names в degraded messages.

#### GAP-28: Нет request body size limit
**Severity:** MEDIUM
**Где:** `main.go`, `cors.go`
**Проблема:** Ни Nginx, ни Go server не имеют `client_max_body_size`. Теоретически атакующий может послать огромный body (хотя единственная endpoint, которая читает body — `/csp-report` — и она читает весь body через `json.NewDecoder`).
**Рекомендация:** Nginx: `client_max_body_size 10k;` для API. Go: `http.MaxBytesReader` для csp-report handler.

#### GAP-29: TLS termination gap
**Severity:** MEDIUM
**Где:** `docker-compose.prod.yml`, `aprilhub.conf`
**Проблема:** Nginx слушает на порту 80 (HTTP). HSTS header set, но TLS происходит upstream от Nginx (external LB/TLS terminator). Внутри Docker network всё — HTTP. Это OK для production, но:
1. Если external LB down, Nginx падает без graceful degradation
2. Nginx полагается на `X-Forwarded-Proto` для HSTS — если upstream неправильно set этот header, HSTS не работает
**Рекомендация:** Убедиться что external TLS terminator всегда set `X-Forwarded-Proto: https`.

---

## Summary Table

| # | Gap | Severity | Компонент | Фикс-усилие |
|--- |--- |--- |---- |--- |
| GAP-4 | Fail-open rate limit при Redis down | 🔴 HIGH | RateLimiter | Medium |
| GAP-17 | `/metrics` без защиты | 🔴 HIGH | Endpoint exposure | Low |
| GAP-23 | Redis empty password hardcoded | 🔴 HIGH | Redis client | Low |
| GAP-5 | Rate limit по upstream IP, не client IP | 🟡 MEDIUM | RateLimiter | Medium |
| GAP-6 | Нет rate limit для unauth endpoints | 🟡 MEDIUM | RateLimiter config | Low |
| GAP-11 | CSP `'unsafe-inline'` + `'unsafe-eval'` | 🟡 MEDIUM | Nginx CSP | High |
| GAP-14 | Default nginx dev — нет security headers | 🟡 MEDIUM | Nginx dev | Low |
| GAP-15 | `/metrics` без Nginx IP restriction | 🟡 MEDIUM | Nginx | Low |
| GAP-18 | CSP report без rate limit | 🟡 MEDIUM | Endpoint exposure | Low |
| GAP-20 | Нет HTTP method restriction | 🟡 MEDIUM | Middleware | Low |
| GAP-21 | Redis `KEYS` command в production | 🟡 MEDIUM | Cache invalidation | Low |
| GAP-24 | Reverse proxy URL из env без validation | 🟡 MEDIUM | Profile proxy | Low |
| GAP-28 | Нет request body size limit | 🟡 MEDIUM | Nginx/Go | Low |
| GAP-29 | TLS termination gap | 🟡 MEDIUM | Infra | Medium |
| GAP-1 | Нет auth retry tracking | 🟢 LOW | Auth middleware | Low |
| GAP-2 | Correlation ID reflection | 🟢 LOW | Auth middleware | Low |
| GAP-3 | Нет iat validation | 🟢 LOW | JWT claims | Low |
| GAP-7 | Silent claims fallback в rate limit | 🟢 LOW | RateLimiter | Low |
| GAP-8 | Default CORS для localhost | 🟢 LOW | Config | Low |
| GAP-9 | Hardcoded allowed headers | 🟢 LOW | CORS | Low |
| GAP-10 | Нет Allow-Credentials | 🟢 LOW | CORS | None (by design) |
| GAP-12 | Sentry data leak потенциала | 🟢 LOW | CSP | None (by design) |
| GAP-13 | HSTS без preload | 🟢 LOW | Nginx | Low |
| GAP-19 | Health/ready без rate limit | 🟢 LOW | Endpoint exposure | Low |
| GAP-22 | Cache invalidation user input | 🟢 LOW | Cache | Low |
| GAP-26 | Server header disclosure | 🟢 LOW | Nginx/Go | Low |
| GAP-27 | Service name disclosure в error | 🟢 LOW | Adapter | Low |
| GAP-25 | lib/pq unused dependency | ℹ INFO | go.mod | Low |

---

## Рекомендации для Penetration Test (задача 059)

Приоритетные векторы атаки:

1. **Rate limit bypass** — проверь, что при Redis down запросы действительно не ограничены (GAP-4). В dev это легко симулировать `docker stop redis`.
2. **Metrics endpoint** — `/metrics` должен быть закреплён IP whitelist в production (GAP-17).
3. **Redis auth** — проверь, что hub-bff подключается к Redis с паролем в production (GAP-23). Сейчас password hard-coded пустой.
4. **Rate limit identity** — проверь, что rate limit в production считает реальных клиентов, а не upstream IP (GAP-5).
5. **HTTP method test** — отправь POST/PUT/DELETE на GET-only endpoints с valid token — подтверди, что возвращается 405, не 200 с данными (GAP-20).
6. **CSP report abuse** — спам `/api/v1/csp-report` и убедись, что это не ломает Loki/Prometheus (GAP-18).
7. **Redis KEYS command** — при большом key space, вызов invalidation должен не дёргать Redis timeout (GAP-21).
