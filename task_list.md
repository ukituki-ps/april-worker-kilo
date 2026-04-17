# Список задач

Используйте чекбоксы по мере выполнения. Полный верхнеуровневый roadmap AprilHub: [`tasks/000-aprilhub-full-service-roadmap/TASK.md`](./tasks/000-aprilhub-full-service-roadmap/TASK.md).

## Ветвление для AprilHub

- [x] Создана рабочая ветка `feature/aprilhub-implementation` для реализации AprilHub
- [ ] До завершения эпиков `001-010` изменения по AprilHub вести в `feature/aprilhub-implementation`
- [ ] После закрытия эпиков `001-010` — подготовить финальный PR `feature/aprilhub-implementation` -> `develop`

## Инициализация

- [ ] Подставить значения в [`docs/guides/PROJECT_DEFAULTS.md`](./docs/guides/PROJECT_DEFAULTS.md) и связанных документах
- [ ] Настроить ветки, branch protection, GitHub Actions runner (labels в `.github/workflows/dev-deploy.yml`)
- [x] Зафиксировать первую прикладную задачу в `tasks/<NNN-slug>/` — `tasks/001-aprilhub-bootstrap/`

## Верхнеуровневые этапы AprilHub (до production-ready)

- [x] `001`: Bootstrap platform baseline (`hub-bff`, `hub-shell`, compose, CI)
- [x] `002`: Auth + RBAC через Keycloak (OIDC flow, JWT validation, `/me`, role gates)
- [x] `003`: Hub Shell composition + дизайн-системный UX (guest/Keycloak/authorized)
- [x] `004`: Hub BFF aggregation MVP (fan-out adapters, partial response, timeout/retry policy)
- [x] `005`: Integration contracts finalization (sync/async contract hardening, OpenAPI alignment)
- [x] `006`: Observability + trace propagation (`correlationId/requestId`, metrics/logging)
- [x] `007`: Data/runtime dependencies and migrations readiness (если требуется persistence в Hub BFF)
- [x] `008`: Testing completion (unit/integration/smoke E2E + k6 baseline)
- [x] `009`: Deployment hardening for dev (images.env flow, backups, rollback, smoke-after-deploy)
- [x] `010`: Docs/ADR/C4 final sync and release readiness
- [x] `011`: Infra PostgreSQL/Redis production readiness (HA/backup/restore/ops runbooks)
- [x] `012`: Unified ingress and auth UX hardening (single Nginx entrypoint for guest/Keycloak/authorized zones)
- [x] `013`: Design system integration + separate showcase deployment (`DisignApril`)
- [x] `014`: Keycloak UI/theming alignment with April design system
- [x] `015`: Authorized zone standard shell layout (header + sidebar + content frame, baseline template: `git@github.com:ukituki-ps/Corporate-Service-Dashboard---Fork.git` `src/pages/DashboardPage.tsx`)
- [x] `016`: Public guest landing and authorized entrypoint UX (design-system aligned)
- [x] `018`: Multi-service documentation foundation (human-first + agent-first, единый source of truth)

## Текущий фокус

- [x] `001-aprilhub-bootstrap`: каркас `hub-bff`/`hub-shell` + dev Keycloak + health/readiness + env templates
- [x] `002-aprilhub-auth-rbac`: OIDC flow в `hub-shell`, `/me` + role guards в `hub-bff`
- [x] `003-aprilhub-shell-design-system`: UX/layout для guest, Keycloak transitions и authorized shell по дизайн-системе
- [x] `004-hub-bff-aggregation-runtime`: aggregation runtime в `hub-bff` реализован и проверен
- [x] `005-hub-contracts-openapi-hardening`: контракты BFF/OpenAPI синхронизированы, отчёт оформлен
- [x] `006-hub-observability-operability`: baseline observability в `hub-bff` реализован, smoke/проверки пройдены, отчёт оформлен
- [x] `007-hub-data-runtime-readiness`: решение по stateless readiness зафиксировано, проверки пройдены, отчёт оформлен
- [x] `008-hub-testing-completion`: test contour закрыт (unit/smoke/k6 baseline), CI обновлён, отчёт оформлен
- [x] `009-hub-deployment-hardening-dev`: deploy hardening baseline реализован, `PLAN.md`/`REPORT.md` оформлены
- [x] `010-hub-architecture-docs-release-gate`: выполнена синхронизация docs/ADR/C4 и оформлен release checklist v1
- [x] `011-infra-postgres-redis-production-readiness`: production-readiness baseline PostgreSQL/Redis реализован, runbooks и проверки оформлены
- [x] `012-aprilhub-unified-ingress-auth-hardening`: единый Nginx ingress для `hub-shell`/`hub-bff`/Keycloak реализован, smoke-проверки через единый endpoint пройдены
- [x] `013-aprilhub-design-system-integration-showcase`: интегрировать `DisignApril` в проект и развернуть отдельную витрину
- [x] `014-aprilhub-keycloak-design-system-alignment`: привести login/account UX Keycloak к дизайн-системе AprilHub
- [x] `015-aprilhub-authorized-shell-standard-layout`: внедрить стандартный layout авторизованной зоны (header + sidebar + content), baseline template: `Corporate-Service-Dashboard---Fork/src/pages/DashboardPage.tsx`
- [x] `016-aprilhub-guest-landing-entrypoint`: подготовить лендинг неавторизованной зоны и единый UX-вход в авторизованную зону
- [x] `018-aprilhub-multi-service-documentation-foundation`: подготовить документационный baseline для масштабирования комплементарных сервисов (human-first + agent-first)

## План реализации AprilHub: статусы

| Этап | Задача | Статус | Результат / артефакт |
|------|--------|--------|-----------------------|
| `001` | Bootstrap platform baseline (`hub-bff`, `hub-shell`, compose, CI) | ✅ Выполнено | [`tasks/001-aprilhub-bootstrap/REPORT.md`](./tasks/001-aprilhub-bootstrap/REPORT.md) |
| `002` | Auth + RBAC через Keycloak (OIDC flow, JWT validation, `/me`, role gates) | ✅ Выполнено | [`tasks/002-aprilhub-auth-rbac/REPORT.md`](./tasks/002-aprilhub-auth-rbac/REPORT.md) |
| `003` | Hub Shell composition + дизайн-системный UX (guest/Keycloak/authorized) | ✅ Выполнено | [`tasks/003-aprilhub-shell-design-system/REPORT.md`](./tasks/003-aprilhub-shell-design-system/REPORT.md) |
| `004` | Hub BFF aggregation MVP (fan-out adapters, partial response, timeout/retry policy) | ✅ Выполнено | [`tasks/004-hub-bff-aggregation-runtime/REPORT.md`](./tasks/004-hub-bff-aggregation-runtime/REPORT.md) |
| `005` | Integration contracts finalization (sync/async contract hardening, OpenAPI alignment) | ✅ Выполнено | [`tasks/005-hub-contracts-openapi-hardening/REPORT.md`](./tasks/005-hub-contracts-openapi-hardening/REPORT.md) |
| `006` | Observability + trace propagation (`correlationId/requestId`, metrics/logging) | ✅ Выполнено | [`tasks/006-hub-observability-operability/REPORT.md`](./tasks/006-hub-observability-operability/REPORT.md) |
| `007` | Data/runtime dependencies and migrations readiness (если требуется persistence в Hub BFF) | ✅ Выполнено | [`tasks/007-hub-data-runtime-readiness/REPORT.md`](./tasks/007-hub-data-runtime-readiness/REPORT.md) |
| `008` | Testing completion (unit/integration/smoke E2E + k6 baseline) | ✅ Выполнено | [`tasks/008-hub-testing-completion/REPORT.md`](./tasks/008-hub-testing-completion/REPORT.md) |
| `009` | Deployment hardening for dev (images.env flow, backups, rollback, smoke-after-deploy) | ✅ Выполнено | [`tasks/009-hub-deployment-hardening-dev/REPORT.md`](./tasks/009-hub-deployment-hardening-dev/REPORT.md) |
| `010` | Docs/ADR/C4 final sync and release readiness | ✅ Выполнено | [`tasks/010-hub-architecture-docs-release-gate/REPORT.md`](./tasks/010-hub-architecture-docs-release-gate/REPORT.md) |
| `011` | Infra PostgreSQL/Redis production readiness (HA/backup/restore/ops runbooks) | ✅ Выполнено | [`tasks/011-infra-postgres-redis-production-readiness/REPORT.md`](./tasks/011-infra-postgres-redis-production-readiness/REPORT.md) |
| `012` | Unified ingress and auth UX hardening (single Nginx entrypoint for guest/Keycloak/authorized zones) | ✅ Выполнено | [`tasks/012-aprilhub-unified-ingress-auth-hardening/REPORT.md`](./tasks/012-aprilhub-unified-ingress-auth-hardening/REPORT.md) |
| `013` | Design system integration + separate showcase deployment (`DisignApril`) | ✅ Выполнено | [`tasks/013-aprilhub-design-system-integration-showcase/REPORT.md`](./tasks/013-aprilhub-design-system-integration-showcase/REPORT.md) |
| `014` | Keycloak UI/theming alignment with April design system | ✅ Выполнено | [`tasks/014-aprilhub-keycloak-design-system-alignment/TASK.md`](./tasks/014-aprilhub-keycloak-design-system-alignment/TASK.md) |
| `015` | Authorized zone standard shell layout (header + sidebar + content frame) | ✅ Выполнено | [`tasks/015-aprilhub-authorized-shell-standard-layout/TASK.md`](./tasks/015-aprilhub-authorized-shell-standard-layout/TASK.md), [`tasks/015-aprilhub-authorized-shell-standard-layout/REPORT.md`](./tasks/015-aprilhub-authorized-shell-standard-layout/REPORT.md), baseline template: `Corporate-Service-Dashboard---Fork/src/pages/DashboardPage.tsx` |
| `016` | Public guest landing and authorized entrypoint UX (design-system aligned) | ✅ Выполнено | [`tasks/016-aprilhub-guest-landing-entrypoint/REPORT.md`](./tasks/016-aprilhub-guest-landing-entrypoint/REPORT.md) |
| `018` | Multi-service documentation foundation (human-first + agent-first) | ✅ Выполнено | [`tasks/018-aprilhub-multi-service-documentation-foundation/REPORT.md`](./tasks/018-aprilhub-multi-service-documentation-foundation/REPORT.md) |
