# ADR: Phase 10 — Security Remediation + Multi-tenant Foundation

- **Статус:** предложено
- **Дата:** 2026-05-13
- **Связанные эпики:** Phase 10 (задачи 064–073)
- **Предыдущие ADR:** `ADR-april-phase-9-security-and-performance.md` (Phase 9)
- **Предшествующий контекст:** Phase 9 (Security Audit + Performance) завершена (055–063). Penetration testing (059) выявил 3 активных security gap'а HIGH/MEDIUM. April Profile завершил Phase 8 (074–080).

## Контекст

Phase 9 зафиксировала security baseline и performance thresholds. Однако penetration testing (059-REPORT) обнаружил 3 gap'а, которые блокируют production readiness:

| Gap | Severity | Статус | Описание |
|-----|---|---|---|
| GAP-17 | HIGH | 🔴 OPEN | `/metrics` endpoint полностью открыт без IP whitelist |
| GAP-23 | HIGH | 🔴 OPEN | Redis password = `""` hardcoded в `hub-bff/internal/redis/redis.go` |
| GAP-20 | MEDIUM | 🔴 OPEN | HTTP method restriction отсутствует (POST/DELETE на GET-only endpoint возвращает 200) |
| JWT Issuer | CRITICAL | ✅ CLOSED | `KEYCLOAK_ISSUER` исправлен в docker-compose.yml (строка 53) |

Параллельно с remediation, экосистема готова к Multi-tenant Foundation:
- April Worker: Hub BFF + Hub Shell operational, Phase 9 security/perf закрыты
- April Profile: Multi-tenant data model готов (ADR 0002, Phase 1-8)
- DisignApril: DS GPR работает, 0.1.13+

## Варианты

### Вариант A: Security Remediation первым

- Сначала закрыть 3 gap'а из pen-test, только потом начинать Multi-tenant.
- **Плюс:** production security baseline гарантирован.
- **Минус:** Multi-tenant блокирован на 1–2 недели.
- **Не выбран:** слишком поочерёдно, задачи не пересекаются.

### Вариант B: Multi-tenant первым

- Начать multi-tenant work паралллельно или раньше security fixes.
- **Плюс:** feature velocity.
- **Минус:** security gap'ы остаются открытыми в многопользовательской среде — risk критический.
- **Не выбран:** нарушение security-first принципа.

### Вариант C: Двухтрековая фаза (выбран)

- Трек 1 (064–067): Security Remediation — закрытие pen-test findings, ре-тест.
- Трек 2 (068–073): Multi-tenant Foundation — tenant isolation, cross-tenant audit, observability.
- Треки независимы: remediation затрагивает Nginx + Redis + middleware, multi-tenant затрагивает BFF aggregation + cache + observability.
- Трек 1 блокирует release Phase 10, Трек 2 может быть частичным.

## Решение

**Phase 10 разделена на два параллельных трека:**

### Трек 1: Security Remediation (064–067)

| Задача | Описание | Зависимости | Трек 1 |
|---|---|---|---|
| 064 | Redis password env var — `REDIS_PASSWORD` в BFF config + redis client | Нет | Security |
| 056 | Rate Limiting — Redis middleware для BFF endpoints (задача уже есть, требует 064) | 064 | Security |
| 066 | Nginx /metrics IP whitelist — allow только localhost + monitoring | Нет | Security |
| 067 | HTTP method restriction middleware — GET-only endpoints reject POST/DELETE/PUT | Нет | Security |
| 059-retest | Penetration test re-run — verification исправленных gap'ов | 064, 066, 067 | Security |

> Примечание: 056 (rate limiting) требует исправленного Redis password (064), поэтому пере-деплой rate limiter привязан к 064.

### Трек 2: Multi-tenant Foundation (068–073)

| Задача | Описание | Зависимости | Трек 2 |
|---|---|---|------|
| 068 | Tenant isolation audit — cross-tenant data leak prevention, код-аудит BFF | Нет | Multi-tenant |
| 069 | Tenant-scoped Redis cache — tenant-aware cache key prefix, invalidation | 064 | Multi-tenant |
| 070 | Tenant-aware rate limiting — per-tenant rate limit buckets | 064 + 056 | Multi-tenant |
| 071 | Tenant visibility in observability — correlationId + tenant_id в metrics/logs | Нет | Multi-tenant |
| 072 | Multi-tenant Playwright E2E — two-tenant test matrix | 068–071 | Multi-tenant |
| 073 | Multi-tenant stress test k6 — tenant isolation under load | 068–071 | Multi-tenant |

## Tradeoff

- **Security first внутри Phase 10:** Трек 1 выполняется приоритетно, Трек 2 параллельно. Без закрытия Трека 1 Phase 10 не считается завершённой.
- **April Profile зависимость:** multi-tenant work не требует изменений в Profile (его data model уже tenant-aware).
- **Scope control:** если capacity ограничен, можно закрыть Трек 1 + 068 + 071 (minimum viable Phase 10).

## Риски

- Redis password change (064) временно обрывает BFF-Redis связь при пере-деплой. Нужен graceful restart.
- Tenant isolation audit (068) может выявить архитектурные проблемы, требующие ADR-4.
- `/metrics` IP whitelist (066) requires Nginx config — не затрагивает BFF код.

## Следующие фазы

1. **Phase 11: B2B onboarding toolkit** — tenant self-service, SSO provisioning, usage analytics
2. **Phase 12: API Gateway + Service Mesh** — Kong/Traefik для inbound routing, mTLS between services
3. **Phase 13: AprilHub v2.0** — new service integration (Workflow, Reporting, Notification)
