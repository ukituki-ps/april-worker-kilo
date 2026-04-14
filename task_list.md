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
- [ ] `003`: Hub Shell composition (registry/loader/layout/error boundaries/degraded UX)
- [ ] `004`: Hub BFF aggregation MVP (fan-out adapters, partial response, timeout/retry policy)
- [ ] `005`: Integration contracts finalization (sync/async contract hardening, OpenAPI alignment)
- [ ] `006`: Observability + trace propagation (`correlationId/requestId`, metrics/logging)
- [ ] `007`: Data/runtime dependencies and migrations readiness (если требуется persistence в Hub BFF)
- [ ] `008`: Testing completion (unit/integration/smoke E2E + k6 baseline)
- [ ] `009`: Deployment hardening for dev (images.env flow, backups, rollback, smoke-after-deploy)
- [ ] `010`: Docs/ADR/C4 final sync and release readiness

## Текущий фокус

- [x] `001-aprilhub-bootstrap`: каркас `hub-bff`/`hub-shell` + dev Keycloak + health/readiness + env templates
- [x] `002-aprilhub-auth-rbac`: OIDC flow в `hub-shell`, `/me` + role guards в `hub-bff`

## План реализации AprilHub: статусы

| Этап | Задача | Статус | Результат / артефакт |
|------|--------|--------|-----------------------|
| `001` | Bootstrap platform baseline (`hub-bff`, `hub-shell`, compose, CI) | ✅ Выполнено | [`tasks/001-aprilhub-bootstrap/REPORT.md`](./tasks/001-aprilhub-bootstrap/REPORT.md) |
| `002` | Auth + RBAC через Keycloak (OIDC flow, JWT validation, `/me`, role gates) | ✅ Выполнено | [`tasks/002-aprilhub-auth-rbac/REPORT.md`](./tasks/002-aprilhub-auth-rbac/REPORT.md) |
| `003` | Hub Shell composition (registry/loader/layout/error boundaries/degraded UX) | ⏳ Не начато | — |
| `004` | Hub BFF aggregation MVP (fan-out adapters, partial response, timeout/retry policy) | ⏳ Не начато | — |
| `005` | Integration contracts finalization (sync/async contract hardening, OpenAPI alignment) | ⏳ Не начато | — |
| `006` | Observability + trace propagation (`correlationId/requestId`, metrics/logging) | ⏳ Не начато | — |
| `007` | Data/runtime dependencies and migrations readiness (если требуется persistence в Hub BFF) | ⏳ Не начато | — |
| `008` | Testing completion (unit/integration/smoke E2E + k6 baseline) | ⏳ Не начато | — |
| `009` | Deployment hardening for dev (images.env flow, backups, rollback, smoke-after-deploy) | ⏳ Не начато | — |
| `010` | Docs/ADR/C4 final sync and release readiness | ⏳ Не начато | — |
