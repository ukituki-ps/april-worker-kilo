# План: Hub Architecture/Docs Final Sync and Release Readiness (Этап 010)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-15
- **Статус плана:** согласован

## Исходные допущения
- Этапы `001-009` завершены, ключевые runtime/deploy артефакты уже зафиксированы в `REPORT.md` соответствующих задач.
- Фактический flow dev deploy задаётся `deploy.sh`, `docker-compose.yml`, `.github/workflows/dev-deploy.yml` и `docs/DEPLOYMENT_STRATEGY.md`.
- Архитектурный baseline и границы роли `AprilHub` задаются `structurizr/workspace.dsl` и `docs/architecture/*`.
- Scope этапа `010` ограничен синхронизацией документации и release-gate; новые runtime-фичи не добавляются.

## Порядок работ (шаги)
1. Провести ревизию текущих артефактов: `structurizr/workspace.dsl`, `docs/architecture/*`, deploy docs, OpenAPI, roadmap/task документы.
2. Зафиксировать release-gate checklist v1 как отдельный документ в Docusaurus-структуре и привязать его к Definition of Done roadmap `000`.
3. Оформить ADR по policy публикации и lifecycle SHA-образов `hub-bff`/`hub-shell`, обновить индекс ADR.
4. Синхронизировать связанные документы и формулировки (deploy strategy, master prompt, task artifacts `010`/`task_list`).
5. Выполнить проверки из постановки (`make openapi-lint`, `make docs-build`, `docker compose config`) и зафиксировать результат в `REPORT.md`.

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | Без изменений runtime-кода |
| Frontend | Без изменений runtime-кода |
| БД / Atlas | Без изменений миграций и данных |
| Инфра / Compose | Только документная синхронизация с фактическим deploy flow |
| Документация / OpenAPI | Release checklist v1, ADR, выравнивание roadmap/task/deploy-docs |

## Риски и откат
- **Риск:** часть документов останется рассинхронизированной с `deploy.sh`/OpenAPI. → **Митигация:** сверка с фактическими файлами и явные перекрёстные ссылки.
- **Риск:** checklist будет слишком общим и непригодным для gate. → **Митигация:** добавить проверяемые пункты с конкретными командами/артефактами.
- При необходимости отката: удалить/скорректировать добавленные документные изменения в отдельных коммитах; runtime не затрагивается.

## Проверка после выполнения
- Команды (как в `TASK.md`): `make openapi-lint`, `make docs-build`, `docker compose config`.
- Ручная проверка: Docusaurus-сборка включает новые/обновлённые документы без broken links.

## Примечания
- Связанные документы: `tasks/000-aprilhub-full-service-roadmap/TASK.md`, `docs/DEPLOYMENT_STRATEGY.md`, `docs/architecture/README.md`, `docs/adr/README.md`.
- Обновления плана: 2026-04-15 — первичная фиксация плана перед реализацией.
