# Задача 057: Security Headers (CSP, HSTS, X-Frame)

## Мета
- **ID / ветка:** `057-security-csp-headers`
- **Приоритет:** высокий (Phase 9 — Security трек)
- **Зависит от:** 055 (Security Audit Scoping)
- **ADR:** [`docs/architecture/ADR-april-phase-9-security-and-performance.md`](../../docs/architecture/ADR-april-phase-9-security-and-performance.md)

## Цель
Добавить security headers в Nginx конфигурацию и BFF middleware для защиты от XSS, clickjacking, protocol downgrade и других attacks.

## Контекст для агента
- Nginx конфигурация: `infra/nginx/` — reverse proxy для всех зон
- Hub BFF: Go/Gin — backend API endpoints
- Hub Shell: React SPA — frontend application
- Keycloak: OIDC provider — auth pages

## Входит в объём

### Nginx security headers (все зоны)
- [ ] `Strict-Transport-Security: max-age=31536000; includeSubDomains` (HSTS)
- [ ] `X-Frame-Options: DENY` (clickjacking protection)
- [ ] `X-Content-Type-Options: nosniff` (MIME sniffing protection)
- [ ] `X-XSS-Protection: 0` — disabled, CSP делает это правильно (OWASP recommendation)
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy: geolocation=(), microphone=(), camera=()`

### Content Security Policy (CSP)
- [ ] Для Hub Shell zone: whitelist self + Keycloak domain + Sentry CDN
- [ ] `default-src 'self'`
- [ ] `script-src 'self' https://<sentry-dsn>`
- [ ] `style-src 'self' 'unsafe-inline'` — Mantine CSS-in-JS требует unsafe-inline
- [ ] `frame-src 'self' https://<keycloak-domain>` — iframe для Keycloak login (если используется)
- [ ] `connect-src 'self' https://<keycloak-domain> https://<sentry-dsn>`
- [ ] Report URI: `/csp-report` endpoint в BFF для CSP violation logging

### BFF security headers (API responses)
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Cache-Control: no-store` для auth-sensitive responses
- [ ] CSP заголовок на BFF endpoint ответы
- [ ] CORS headers review: whitelist только Known origins

### CSP violation reporting
- [ ] BFF endpoint `/csp-report` — POST endpoint для CSP violation reports
- [ ] CSP violations логируются в Loki
- [ ] Prometheus counter для CSP violations
- [ ] Sentry integration для CSP violations (если есть violations — это ошибка)

## Не входит в объём
- Изменение Keycloak security headers (это realm config)
- WAF rules (upstream infrastructure)
- CSP-Report-Only mode (на dev можно, но production — enforce mode)

## Технические ограничения
- Nginx config файлы в `infra/nginx/`
- BFF middleware: добавить Gin handler для headers
- CSP whitelist должен включать ключевые домены (Keycloak, Sentry) — зафиксировать в env vars
- Не ломать существующий CORS для widget loading

## Критерии готовности (acceptance)
- [ ] Все security headers present в Nginx responses (проверить curl -I)
- [ ] CSP header корректный для Hub Shell zone
- [ ] CSP report endpoint рабочий (`/csp-report` в BFF)
- [ ] CSP violations логируются в Loki
- [ ] Prometheus metrics для CSP violations
- [ ] Unit tests для CSP parsing и violation handling
- [ ] Документация `docs/security/headers.md`

## Проверка
```bash
# Проверка Nginx headers
curl -I https://dev.april.../ | grep -E "Strict-Transport|X-Frame|X-Content-Type|Content-Security"
# Проверка CSP report endpoint
curl -X POST http://localhost:8080/csp-report -d '{"csp-report":{}}' -H "Content-Type: application/json"
# Проверка Prometheus metrics
curl http://localhost:9090/metrics | grep csp_violation
```

## Результат в отчёте
Изменённые Nginx конфиги, BFF middleware, CSP report endpoint, тесты.
