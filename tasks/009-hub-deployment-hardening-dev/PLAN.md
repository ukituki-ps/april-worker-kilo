# План: Hub Deployment Hardening for Dev (Этап 009)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-15
- **Статус плана:** согласован

## Исходные допущения
- Текущий dev deploy запускается через `.github/workflows/dev-deploy.yml` и `deploy.sh`, но отсутствуют обязательные скрипты backup/migrations/smoke-after-deploy и автоматический rollback на `last-good`.
- Для `hub-bff` persistence в рамках этапа `007` не введён, поэтому миграции в этапе `009` реализуются как Atlas-ready hook с безопасным no-op режимом по умолчанию.
- Деплой остаётся в границах `develop` + self-hosted runner, без изменения CI/CD стека.

## Порядок работ (шаги)
1. Подготовить и подключить скрипты deploy safety: `scripts/db-backup.sh`, `scripts/run-migrations.sh`, `scripts/rollback-migrations.sh`, `scripts/smoke-after-deploy.sh`.
2. Усилить `deploy.sh`: preflight checks, жёсткий порядок шагов, сбор артефактов, health/readiness + smoke, фиксация last-good, auto-rollback на previous image set.
3. Синхронизировать `dev-deploy` workflow для обязательного smoke/checkpoint после `deploy.sh` и выгрузки deploy-артефактов.
4. Актуализировать `images.env.example` и `docs/DEPLOYMENT_STRATEGY.md` под фактический pipeline этапа `009`.
5. Прогнать релевантные проверки (`make openapi-lint`, `go test`, smoke), обновить task-артефакты (`TASK.md`, `task_list.md`, `REPORT.md`).

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | Без функциональных изменений runtime |
| Frontend | Без функциональных изменений runtime |
| БД / Atlas | Добавление скриптов-обвязок для backup и Atlas apply/rollback |
| Инфра / Compose | Усиление deploy entrypoint и workflow, rollback/last-good state |
| Документация / OpenAPI | Синхронизация `DEPLOYMENT_STRATEGY` и task-артефактов этапа `009` |

## Риски и откат
- **Риск:** слишком жёсткие preflight проверки могут блокировать ручной dev deploy → **Митигация:** управляемые `SKIP_*` и `REQUIRE_*` env-флаги.
- **Риск:** отсутствие Atlas-настроек в текущем окружении → **Митигация:** безопасный no-op, обязательный fail-fast только при явном включении Atlas-переменных.
- При необходимости отката: восстановить `images.env` из `.deploy-state/images.env.last-good`, выполнить `scripts/rollback-migrations.sh` (если применялось), затем `docker compose pull && docker compose up -d` и повторить health/smoke.

## Проверка после выполнения
- Команды: `make openapi-lint`, `cd hub-bff && go test ./...`, `./scripts/smoke-aprilhub.sh`.
- Ручная проверка / smoke: `./deploy.sh` в dry/no-op условиях и `./scripts/smoke-after-deploy.sh` на поднятом `aprilhub` профиле.

## Примечания
- Связанные артефакты: `docs/DEPLOYMENT_STRATEGY.md`, `.github/workflows/dev-deploy.yml`, `tasks/009-hub-deployment-hardening-dev/REPORT.md`.
- Обновления плана: 2026-04-15 — первичная фиксация перед реализацией.
