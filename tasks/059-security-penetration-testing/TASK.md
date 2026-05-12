# Задача 059: Penetration Testing

## Мета
- **ID / ветка:** `059-security-penetration-testing`
- **Приоритет:** высокий (Phase 9 — Security трек, финальная задача)
- **Зависит от:** 055, 056, 057 (Security audit + fixes должны быть готовы)
- **ADR:** [`docs/architecture/ADR-april-phase-9-security-and-performance.md`](../../docs/architecture/ADR-april-phase-9-security-and-performance.md)

## Цель
Провести ручное penetration testing ключевых auth flows и data endpoints платформы AprilHub, чтобы подтвердить что security fixes (056, 057) работают и нет скрытых vulnerabilities.

## Контекст для агента
- AprilHub operational на dev-стенде (после CI fix, Блок A)
- Keycloak OIDC auth deployed
- Hub BFF endpoints: `/v1/profiles/*`, `/v1/entity-types/*`, `/v1/me`, `/sse`
- Hub Shell SPA с widget integration
- Rate limiting и security headers должны быть запущены (после 056, 057)

## Входит в объём

### Auth Flow Testing
- [ ] JWT token tampering: изменить aud, iss, exp — проверить что BFF rejects
- [ ] JWT replay attack: использовать expired token — 401 response
- [ ] Refresh token abuse: запросить >5 refresh tokens — rate limit 056
- [ ] OIDC redirect validation: изменить redirect_uri — Keycloak rejects
- [ ] Auth bypass: доступ к `/v1/me` без JWT — 401 response
- [ ] Role escalation: запросить endpoint с insufficient role — 403 response

### API Security Testing
- [ ] SQL injection: special chars в query params — BFF sanitizes
- [ ] CORS bypass: запрос с unauthorized origin — rejected
- [ ] Rate limit bypass: разные IP/User-Agent — rate limit всё равно работает
- [ ] SSE endpoint abuse: 10 concurrent connections — rejected (max 5)
- [ ] IDOR (Insecure Direct Object Reference): доступ к другому tenant data — rejected

### Frontend Security Testing
- [ ] XSS in search inputs: `<script>` tags — sanitized
- [ ] CSP violation: inline script execute — blocked by CSP
- [ ] CSRF: POST request без SameSite/CSRF token — rejected
- [ ] Open redirect: `/redirect?url=evil.com` — blocked

### Documentation
- [ ] Test script с воспроизводимыми шагами
- [ ] `REPORT.md` с результатами: passed/failed per test case
- [ ] Для каждого failed case: severity, reproduction steps, рекомендуемый фикс

## Не входит в объём
- Автоматизированное сканирование (задача 058)
- Фикс уязвимостей (отдельные задачи если найдены)
- Social engineering, physical security testing

## Технические ограничения
- Тестировать на dev-стенде (production testing запрещено без отдельной задачи)
- Использовать существующие test accounts (не создавать production data)
- Document все test accounts и data для cleanup

## Критерии готовности (acceptance)
- [ ] Все test cases выполнены и задокументированы
- [ ] `REPORT.md` с результатами: 0 Critical findings, ≤2 High findings
- [ ] Each finding имеет reproduction steps и severity
- [ ] Test scripts сохранены в `tests/penetration/`

## Проверка
- Ручное выполнение test cases по checklist
- Проверка responses: status codes, headers, body
- Loki logs проверка: auth failures, rate limit hits, CSP violations
- Prometheus metrics: auth failures, rate limits, CSP violations

## Результат в отчёте
Test results table (passed/failed), findings с severity, рекомендации.
