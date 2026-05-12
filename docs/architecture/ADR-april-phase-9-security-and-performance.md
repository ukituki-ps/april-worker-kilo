# ADR: Phase 9 — Security Audit + Performance Optimization

- **Статус:** принято
- **Дата:** 2026-05-12
- **Связанные эпики:** Phase 9 (задачи 055–063)
- **Предыдущие ADR:** `ADR-april-design-system-npm-distribution.md` (DS дистрибуция)
- **Предшествующий контекст:** эпики 001–054 закрыты, платформа AprilHub operational — CI зелёный, Sentry/observability deployed, GPR работает, widgets от AprilProfile встроены.

## Контекст

Все задачи Phase 1–8 (001–054) завершены. AprilHub имеет:

- Working CI pipeline (ci.yml + bootstrap-ci.yml)
- Keycloak OIDC auth с JWT validation
- Hub Shell + Hub BFF operational на dev-стенде
- Observability: Sentry + Loki/Prometheus + Grafana
- k6 baseline сценарии (`scripts/run-k6-aprilhub.sh`, `run-k6-aprilhub-extended.sh`)
- GPR публикация DS 0.1.13
- Widget integration через vendor/april-profile

Платформа ready для подготовки к production. Два критических пробела:

1. **Нет security surface audit** — platform работает с внешним auth (Keycloak), BFF endpoints без rate limiting, Nginx без security headers, frontend без CSP.
2. **Нет production performance thresholds** — k6 baseline существуют, но production SLA не определены, alert пороги не настроены, BFF caching отсуствует.

## Варианты

### Вариант A: Security Audit первым, Performance вторым

- Security фундаментальнее performance — если найдутся уязвимости, perf-оптимизации могут быть бесполезны.
- Security findings обычно влияют на архитектуру, performance tweaks — на tuning.
- **Недостаток:** занимает больше времени (2–3 недели), блокирует feature velocity.

### Вариант B: Performance Audit первым, Security вторым

- Быстрый win — perf metrics можно собрать за 1–2 недели.
- Позволяет продолжить feature development параллельно.
- **Недостаток:** security gap остаётся открытой, risk критичный для B2B платформу.

### Вариант C: Parallell — Security + Performance одновременно (выбран)

- Задачи не пересекаются: security (055–059) затрагивает BFF middleware, Nginx, frontend headers; perf (060–063) — k6 thresholds, BFF caching, bundle optimization, DB indexing.
- Security audit не блокирует perf-оптимизацию и наоборот.
- Оба направления нужны для production readiness.

## Решение

**Phase 9 разбита на два независимых трека:**

### Трек 1: Security Audit (055–059)

| Задача | Описание | Зависимости |
|---|---|---|
| 055 | Security audit scoping — аудит auth/RBAC gaps, XSS/CSRF surface, OWASP top-10 mapping | Нет |
| 056 | Rate limiting на BFF endpoints — защита от brute-force, DoS mitigation | 055 |
| 057 | Security headers (CSP, X-Frame-Options, HSTS) — Nginx + BFF middleware | 055 |
| 058 | Dependency vulnerability scan — npm audit + Go CVE, CI automation | Нет |
| 059 | Penetration testing — ручное тестирование key flows (auth, data leak, CSRF) | 055, 056, 057 |

### Трек 2: Performance Optimization (060–063)

| Задача | Описание | Зависимости |
|---|---|---|
| 060 | k6 production thresholds — определение SLA из baseline data, alert пороги | Нет |
| 061 | BFF response caching — Redis cache для read-only endpoints | Нет |
| 062 | Shell bundle analysis — bundle size audit, code splitting, lazy loading widgets | Нет |
| 063 | DB query optimization — pg_stat_statements, missing indexes, slow query audit | Нет (Profile side) |

## Tradeoff

- **Feature velocity vs. production readiness:** Phase 9 откладывает новые фичи, но закрывает mandatory gaps для production. Без security audit и perf thresholds платформа не может перейти к multi-tenant hardening или B2B onboarding.
- **Scope control:** задачи разбиты на независимые блоки, каждая с чётким acceptance criteria. Если team capacity ограничен, можно запустить только 055 + 058 + 060 (minimum viable Phase 9).

## Риски

- Security findings могут потребовать архитектурных изменений (ADR-3) — это нормально, лучше найти до production.
- k6 thresholds dependent от dev-стенда vs production data — 060 фиксирует это как follow-up.
- Dependency scan (058) может найти критические CVE — подготовка mitigation plan включена в scope.

## Следующие фазы (после Phase 9)

1. **Phase 10: Multi-tenant hardening** — изоляция данных по tenant, cross-tenant leak prevention, tenant-scoped caching
2. **Phase 11: AprilHub v2 planning** — API gateway, service mesh, new service integration
3. **Phase 12: B2B onboarding toolkit** — tenant self-service, SSO provisioning, usage analytics
