# Задача 061: Кеширование ответов BFF

## Мета
- **ID / ветка:** `061-perf-bff-response-caching`
- **Приоритет:** высокий (Фаза 9 — Performance трек, нет зависимостей)
- **ADR:** [`docs/architecture/ADR-april-phase-9-security-and-performance.md`](../../docs/architecture/ADR-april-phase-9-security-and-performance.md)

## Цель
Реализовать кеширование ответов для read-only BFF endpoints, используя Redis. Кэш должен быть настраиваемым, учитывающим tenant, и интегрированным с observability стеком.

## Контекст для агента
- **Хаб BFF:** Go + stdlib http.ServeMux
- **Redis:** уже используется после задачи 056 (`hub-bff/internal/redis/`)
- **Read-only endpoints:** `/api/v1/overview`, `/api/v1/aggregation/dashboard`, `/api/v1/aggregation/home`, `/api/v1/aggregation/summary`, `/api/v1/me`
- **BFF не пишет данные** — только считывает из downstream сервисов
- **Middleware chain в main.go:** `CORS → RateLimiter → Metadata → AccessLog → auth.Validate → handler`

## Входит в объём

### Кеширующий Middleware
- [X] Redis cache middleware для http.ServeMux: кеширование ответов GET запросов
- [ ] Ключ кэша: `aprilhub:bff:cache:{endpoint}:{user-id}:{query-params-hash}`
- [ ] TTL кэширования:
  - `/api/v1/aggregation/dashboard`: 60s (данные дашборда меняются редко)
  - `/api/v1/aggregation/summary`: 60s
  - `/api/v1/aggregation/home`: 30s
  - `/api/v1/overview`: 30s
  - `/api/v1/me`: 10s (данные пользователя могут меняться чаще)
- [ ] Очистка кэша:
  - TTL-based expiration (основной механизм)
  - Ручная инвалидация через admin HTTP endpoint (POST /api/v1/admin/cache/invalidate)
- [ ] Пропуск кэша при cache miss: передавать запрос upstream, сохранить ответ в Redis

### Заголовки кэша
- [ ] `X-Cache: HIT` или `MISS` в заголовке ответа
- [ ] `Cache-Control: public, max-age=<TTL>` для закэшированных ответов

### Изоляция кэша по Tenant
- [ ] Ключ кэша включает user ID из JWT claims
- [ ] Данные одного tenant не попадают в кэш другого tenant
- [ ] Hash ключа: sha256(endpoint + user_id + query_params)

### Observability
- [ ] Prometheus метрики:
  - `cache_hit_total`, `cache_miss_total`
  - `cache_size_bytes`, `cache_keys_total`
  - `cache_ttl_seconds (histogram)
- [ ] Loki логи: события cache miss (debug level), события инвалидации кэша (info level)

### Тестирование
- [ ] Unit-тесты: логика cache middleware, генерация ключей, обработка TTL
- [ ] Integration-тесты: поведение cache HIT/MISS, изоляция по tenant

## Не входит в объём
- Кеширование SSE endpoint (SSE — streaming, не кешируется)
- Кеширование для write endpoints (если добавятся)
- Cache warming (оптимизация будущего)
- Multi-level cache (CDN) — это upstream инфраструктура

## Технические ограничения
- Redis: уже настроен из задачи 056, использовать тот же клиент
- Не менять API-ответы — кэш прозрачен для upstream consumers
- Rate limiting middleware (056) работает поверх кэша (не bypass)

## Критерии готовности (acceptance)
- [ ] Cache middleware подключён ко всем read-only endpoints
- [ ] Cache HIT rate > 70% при повторных requests
- [ ] Изоляция по tenant работает (нет cross-tenant данных)
- [ ] Prometheus метрики для кэша работают
- [ ] Unit + integration тесты зелёные
- [ ] k6 сравнение: с кэшем vs без кэша — улучшение response time ≥30%
- [ ] OpenAPI spec обновлён с cache-extensions

## Проверка
```bash
# Проверка поведения кэша
curl -H "Authorization: Bearer <token>" http://localhost:8080/api/v1/overview -I
# Проверить X-Cache: MISS первый раз, HIT второй

# Проверка Prometheus метрик
curl http://localhost:9090/metrics | grep cache_hit

# k6 сравнение
# Запуск k6 два раза: с кэшем и без
