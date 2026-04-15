# AprilHub Release Checklist v1 (`001-010`)

Документ фиксирует release-gate для завершения roadmap AprilHub (`001-010`) без выхода за рамки dev deployment policy.

Связанные документы:
- `tasks/000-aprilhub-full-service-roadmap/TASK.md`
- `docs/DEPLOYMENT_STRATEGY.md`
- `docs/TESTING_STRATEGY.md`
- `docs/architecture/APRILHUB_C3_C4.md`
- `docs/architecture/C4_RUNTIME_SEQUENCES.md`
- `openapi/aprilhub-bff.yaml`

## 1. Архитектура и документация

- [ ] `structurizr/workspace.dsl` синхронизирован с фактическими контейнерами/связями AprilHub и AprilWorker.
- [ ] Обновлены `docs/architecture/APRILHUB_C3_C4.md` и `docs/architecture/C4_RUNTIME_SEQUENCES.md` (если менялись runtime-потоки).
- [ ] `docs/architecture/INTERSERVICE_LINKS.md` и `docs/architecture/INTEGRATION_CONTRACTS.md` не противоречат актуальному BFF runtime.
- [ ] Существенные развилки по архитектуре/deploy зафиксированы в ADR (`docs/adr/`), индекс ADR обновлён.

## 2. API и контракты

- [ ] OpenAPI `openapi/aprilhub-bff.yaml` соответствует реализации (`/healthz`, `/readyz`, `/api/v1/me`, aggregation endpoints).
- [ ] `make openapi-lint` проходит без ошибок.
- [ ] Для breaking-изменений зафиксирован migration path (новая версия API или совместимость через deprecated endpoint).

## 3. Тесты и качество

- [ ] Unit/integration/smoke baseline из `docs/TESTING_STRATEGY.md` подтверждён артефактами этапов `008-010`.
- [ ] `make docs-build` проходит без ошибок.
- [ ] Для релиз-кандидата зафиксированы результаты smoke (API + auth path) после deploy/rollback цикла.

## 4. Deploy и rollback readiness (dev)

- [ ] Deploy flow соответствует `docs/DEPLOYMENT_STRATEGY.md`: merge в `develop`, образы в ghcr по git SHA, server-local `images.env`.
- [ ] Для `hub-bff` и `hub-shell` используется policy SHA-only tags (без обязательного `latest`).
- [ ] `deploy.sh` выполняет preflight, `make openapi-lint`, backup, миграции (если настроены), `make docs-build`, compose-up, health/readiness и smoke.
- [ ] Авто-rollback на last-good подтверждён: `.deploy-state/images.env.last-good` + (опционально) `scripts/rollback-migrations.sh`.
- [ ] На dev доступны артефакты деплоя: `compose config`, `compose ps`, smoke/rollback logs, commit SHA.

## 5. Observability и эксплуатация

- [ ] Корреляция (`correlationId`/`requestId`/`sourceService`) проходит через Hub Shell -> Hub BFF -> downstream.
- [ ] Метрики и логи достаточны для диагностики degraded-mode и auth ошибок (`401/403`).
- [ ] Runbooks по deploy/rollback и ограничениям этапа `011` отражены в task-отчётах (`tasks/009.../REPORT.md`, `tasks/010.../REPORT.md`).

## 6. Final gate (Definition of Done `001-010`)

- [ ] Этапы `001-010` помечены как выполненные в `task_list.md`.
- [ ] Для этапа `010` заполнены `TASK.md`, `PLAN.md`, `REPORT.md` с фактическими командами проверки.
- [ ] Ограничения и follow-up на этап `011` зафиксированы явно (без смешения scope).

Если все пункты отмечены, roadmap `001-010` можно считать release-ready на уровне dev baseline.
