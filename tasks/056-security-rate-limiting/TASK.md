# Задача 056: Rate Limiting на BFF Endpoints

## Мета
- **ID / ветка:** `056-security-rate-limiting`
- **Приоритет:** высокий (Phase 9 — Security трек)
- **Зависит от:** 055 (Security Audit Scoping)
- **ADR:** [`docs/architecture/ADR-april-phase-9-security-and-performance.md`](../../docs/architecture/ADR-april-phase-9-security-and-performance.md)

## Цель
Реализовать rate limiting middleware для Hub BFF endpoints, защищающий от brute-force атак, DoS и abuse API. Rate limiter должен быть configurable и integrated с текущим observability контуром.

## Контекст для агента
- Hub BFF: Go + Gin framework
- Redis: уже используется в инфраструктуре (см. infra Redis setup)
- Текущие BFF endpoints из OpenAPI: `openapi/aprilhub-bff.yaml`
- Auth middleware уже есть, rate limiter добавляется поверх
- Keycloak OIDC flow — auth endpoints не rate-лиммитимы (Keycloak делает это сам)

## Входит в объём
- [ ] Rate limiting middleware в Gin: per-endpoint конфигурация
- [ ] Storage backend: Redis (distributed, works across replicas)
- [ ] Tiered rate limits по типу endpoint:
  - Auth-related endpoints: 10 req/min per IP (Keycloak делает свой limit, но BFF тоже)
  - Read endpoints (`/profiles/*`, `/entity-types/*`): 100 req/min per user
  - SSE endpoint: 5 concurrent connections per user
  - Write endpoints (если появятся): 30 req/min per user
- [ ] Rate limit headers в response: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- [ ] 429 Too Many Requests response с retry-after header
- [ ] Metrics integration: Prometheus counter для rate-limited requests
- [ ] Log rate-limited requests в Loki (с correlationId)
- [ ] Unit tests для middleware logic
- [ ] Integration tests: тест что 429 возвращается при превышении лимита
- [ ] Документация: описание rate limits в `docs/` и OpenAPI spec

## Не входит в объём
- API key rate limiting (мы используем JWT auth)
- WAF configuration (это upstream infrastructure)
- Динамическое изменение лимитов через admin UI

## Технические ограничения
- Stack: Go + Gin + Redis
- Rate limiting: sliding window counter в Redis (не fixed window — более точный)
- Redis client: использовать существующий из infra config
- Не ломать существующие endpoints или auth flows

## Критерии готовности (acceptance)
- [ ] Rate limiting middleware запущен на всех BFF endpoints
- [ ] 429 response с корректными headers при превышении лимита
- [ ] Redis storage работает для distributed rate limiting
- [ ] Prometheus metrics для rate-limited requests
- [ ] Unit tests + integration tests зелёные
- [ ] OpenAPI spec обновлён с x-rate-limit extensions
- [ ] Documentation обновлена

## Проверка
```bash
cd hub-bff && go test ./...
# Тест rate limiting: отправить >100 requests за минуту, проверить 429
curl -i -H "Authorization: Bearer <token>" http://localhost:8080/v1/profiles/list
# Проверить headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
# Проверить Prometheus metrics
curl http://localhost:9090/metrics | grep rate_limit
```

## Результат в отчёте
Изменённые Go файлы, тесты, метрики, OpenAPI diff.
