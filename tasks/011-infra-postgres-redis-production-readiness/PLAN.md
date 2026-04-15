# План: Infra PostgreSQL/Redis Production Readiness (Этап 011)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-15
- **Статус плана:** согласован

## Исходные допущения
- Этапы `007-010` завершили application-level readiness; этап `011` закрывает инфраструктурный operational контур PostgreSQL/Redis без расширения product scope.
- В репозитории уже есть deploy safety baseline (`deploy.sh`, `scripts/db-backup.sh`), но нет формализованного target-state и runbooks именно для PostgreSQL/Redis production readiness.
- Для Redis в текущем `docker-compose.yml` отсутствует выделенный сервис и проверяемый recovery baseline; это будет добавлено в рамках infra-конфигурации.

## Порядок работ (шаги)
1. Зафиксировать target-state инфраструктуры PostgreSQL/Redis и границы ответственности platform vs application в отдельном infra-документе.
2. Добавить runbooks и валидационные скрипты для PostgreSQL backup/restore и Redis recovery/failover-baseline.
3. Обновить deployment flow (`docs/DEPLOYMENT_STRATEGY.md`) ссылками на новые operational процедуры и обязательные шаги проверки.
4. Обновить `docker-compose.yml` для baseline Redis persistence/security профиля без изменения application business-логики.
5. Прогнать релевантные проверки (smoke + infra validation scripts), оформить `REPORT.md`, синхронизировать статусы в `task_list.md`.

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | Без изменений runtime-кода |
| Frontend | Без изменений |
| БД / Atlas | Без новых миграций, добавление restore validation процесса |
| Инфра / Compose | Добавление Redis baseline-сервиса и recovery validation scripts |
| Документация / OpenAPI | Добавление infra target-state, runbooks и обновление deployment strategy |

## Риски и откат
- **Риск:** избыточно жёсткие скрипты infra-проверок для разных окружений → **Митигация:** сделать проверки параметризуемыми через env и безопасными по умолчанию.
- **Риск:** Redis baseline без Sentinel может восприниматься как полноценный HA → **Митигация:** явно зафиксировать уровень отказоустойчивости как baseline single-node + persistence + recovery drill и вынести Sentinel в follow-up.
- При необходимости отката: удалить/отключить новые infra-скрипты из pipeline, вернуть предыдущую compose-конфигурацию и использовать существующий rollback flow (`deploy.sh` + `images.env.last-good`).

## Проверка после выполнения
- Команды: `./scripts/smoke-aprilhub.sh`, `./scripts/validate-postgres-restore.sh`, `./scripts/redis-resilience-check.sh`.
- Ручная проверка / smoke: проверка появления артефактов backup/restore и подтверждение перезапуска Redis с сохранением данных AOF.

## Примечания
- Связанные документы: `docs/DEPLOYMENT_STRATEGY.md`, `docs/TESTING_STRATEGY.md`, `docs/AGENT_ARCHITECTURE_CONTEXT.md`, `docs/architecture/INTERSERVICE_LINKS.md`.
- Обновления плана: 2026-04-15 — первичная фиксация и согласование порядка работ для этапа `011`.
