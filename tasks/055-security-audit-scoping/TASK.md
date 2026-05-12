# Задача 055: Security Audit Scoping

## Мета
- **ID / ветка:** `055-security-audit-scoping`
- **Приоритет:** высокий (Phase 9 — Security трек, задача-зависимость для 056, 057, 059)
- **ADR:** [`docs/architecture/ADR-april-phase-9-security-and-performance.md`](../../docs/architecture/ADR-april-phase-9-security-and-performance.md)
- **Связанные документы:** `docs/auth-jwt-keycloak-adapted.md`, `openapi/aprilhub-bff.yaml`, `docs/AGENT_ARCHITECTURE_CONTEXT.md`

## Цель
Провести аудит текущей security surface платформы AprilHub и зафиксировать карту уязвимостей, которая определит scope задач 056–059.

## Контекст для агента
- AprilHub: Hub Shell (React/TS/Vite) + Hub BFF (Go/Gin) + Keycloak OIDC auth
- Nginx reverse proxy для всех зон (guest/Keycloak/authorized)
- JWT validation в BFF через JWKS
- SSE streaming endpoint `/sse` для асинхронных нотификаций
- Нет security headers, нет rate limiting, нет CSP — всё это в scope

## Входит в объём
- [ ] Аудит auth flows: OIDC flow в Shell, JWT validation в BFF, refresh token handling
- [ ] OWASP Top-10 mapping для текущей кодовой базы:
  - A01: Broken Access Control
  - A02: Cryptographic Failures
  - A03: Injection (SQL, template, command)
  - A07: Authentication Failures
  - A08: Software and Data Integrity Failures
  - A09: Security Logging and Monitoring Failures
- [ ] CSRF analysis: Keycloak logout redirect BFF endpoints
- [ ] XSS analysis: Hub Shell input handling, widget iframe sandboxes
- [ ] RBAC gaps: проверка что role guards в BFF покрывают все endpoints
- [ ] SSE endpoint security: authentication, data leakage risk
- [ ] Output: документированный `REPORT.md` с priority-ranked findings

## Не входит в объём
- Фикс уязвимостей (это задачи 056–059)
- Penetration testing (задача 059)
- Автоматизация сканеров (задача 058)

## Технические ограничения
- Не создавать новых endpoint-ов, только анализ
- Язык отчёта: руский
- Формат findings: таблица с severity (Critical/High/Medium/Low), описание, файлы, рекомендуемая задача для фикса

## Критерии готовности (acceptance)
- [ ] `REPORT.md` с полным OWASP Top-10 mapping для AprilHub
- [ ] Таблица findings с severity classification
- [ ] Каждая finding ссылается на конкретный файл и строку
- [ ] Рекомендации по fix-задачам соответствуют нумерации 056–059

## Проверка
- Ручное review кодовой базы
- Проверка каждого BFF endpoint на наличие auth guard
- Проверка Nginx config на наличие/отсутствие security headers
- Проверка Hub Shell на XSS/CSRF surface

## Результат в отчёте
Таблица findings + рекомендации + связь с задачами 056–059.
