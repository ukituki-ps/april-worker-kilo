# План: AprilHub Documentation Refactoring (этап 021)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-17
- **Статус плана:** согласован

## Исходные допущения
- Этап `021` выполняется как documentation-first задача без изменения runtime-кода сервисов.
- Source of truth по стеку и границам сохраняется в `docs/AGENT_ARCHITECTURE_CONTEXT.md`.
- Для разделов deploy/testing используются ссылки на `docs/DEPLOYMENT_STRATEGY.md` и `docs/TESTING_STRATEGY.md` без дублирования больших фрагментов.

## Порядок работ (шаги)
1. Подготовить детальный navigation baseline: entrypoints для human-first и agent-first аудиторий.
2. Создать/обновить AprilHub-ориентированные guide-документы: "что это", "как работает", "как работать с проектом", "как разрабатывать в экосистеме April".
3. Синхронизировать `docs-site` (главный `intro`) с новыми entrypoints и убрать устаревшие/неполные переходы.
4. Обновить task-артефакты этапа: `REPORT.md`, статусы в `task_list.md`.
5. Проверить сборку документации в `docs-site`.

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | Без изменений |
| Frontend | Без изменений |
| БД / Atlas | Без изменений |
| Инфра / Compose | Без изменений |
| Документация / OpenAPI | Новые docs entrypoints и AprilHub narrative в `docs/guides/`, обновление `docs-site/docs/intro.md`, task docs (`PLAN.md`, `REPORT.md`) |

## Риски и откат
- **Риск:** рассинхронизация формулировок между документами -> **Митигация:** ссылки на source-of-truth документы вместо копирования.
- **Риск:** битые ссылки в Docusaurus после рефакторинга -> **Митигация:** выполнить `npm run build` в `docs-site`.
- При необходимости отката: удалить/скорректировать новые guide-файлы и вернуть прошлую версию `intro.md`.

## Проверка после выполнения
- Команды (как в `TASK.md`):
  - `git diff -- docs docs-site tasks/021-aprilhub-documentation-refactoring`
  - `cd docs-site && npm run build`
  - `rg "021" task_list.md`
- Ручная проверка / smoke:
  - Проверить, что в `docs-site/docs/intro.md` есть явные entrypoints для human-first и agent-first.
  - Проверить, что новые guide-документы связаны между собой перекрестными ссылками.

## Примечания
- Связанные материалы: `tasks/018-aprilhub-multi-service-documentation-foundation/TASK.md`, `tasks/018-aprilhub-multi-service-documentation-foundation/REPORT.md`.
- Обновления плана:
  - 2026-04-17 — создан стартовый план для выполнения этапа 021.
