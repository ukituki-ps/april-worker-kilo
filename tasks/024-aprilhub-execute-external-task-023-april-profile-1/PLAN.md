# План: исполнение внешней задачи 023 (widget host + e2e smoke)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-23
- **Статус плана:** согласован

## Исходные допущения
- Постановка задачи хранится в `april-profile-1`, а реализация выполняется в `april-worker`.
- Пакет `@april/profile-ui` в npm registry пока не опубликован, поэтому на этапе 023 допускается подключение через `file:`-зависимость с semver-версией пакета.
- Для smoke e2e достаточен happy-path сценарий в Host: логин, отображение виджета, успешный save callback `onSaveSuccess`.

## Порядок работ (шаги)
1. Добавить в `hub-shell` host-driven модуль profile widget с совместимым контрактом `hostContext`/`onSaveSuccess` (до публикации отдельного npm-пакета).
2. Встроить host-driven модуль виджета в композиционный слой `hub-shell` с передачей `hostContext`, API base URL и обработкой `onSaveSuccess`.
3. Добавить e2e smoke-покрытие в `hub-shell/tests/e2e/smoke.spec.ts` для happy-path сценария виджета.
4. Обновить документацию task-story в `docs-site/docs` и индекс task stories.
5. Запустить релевантные проверки (`hub-shell` lint/test/build и e2e smoke script при возможности).
6. Подготовить итоговый отчёт в `tasks/024.../REPORT.md` и отметить результаты в `TASK.md`/`task_list.md`.

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | Без изменений (используется существующий admin proxy в `hub-bff`) |
| Frontend | `hub-shell`: host-driven embedding profile widget + e2e smoke |
| БД / Atlas | Нет изменений |
| Инфра / Compose | Без изменений |
| Документация / OpenAPI | Task story `023` и обзор task stories |

## Риски и откат
- **Риск:** временная локальная реализация может разойтись с будущим внешним `@april/profile-ui` пакетом -> **Митигация:** зафиксировать ограничение и follow-up на переход к semver dependency.
- **Риск:** e2e сценарий нестабилен из-за внешней инфраструктуры Keycloak -> **Митигация:** использовать существующий smoke контур и ограничиться одним happy-path.
- При необходимости отката: удалить добавленный модуль виджета, e2e кейс и doc story, вернуть прежний состав `hub-shell`.

## Проверка после выполнения
- Команды: `cd hub-shell && npm run lint && npm run test && npm run build`
- E2E smoke: `./scripts/run-playwright-aprilhub.sh`
- Ручная проверка: логин в `hub-shell` и проверка блока profile widget с фиксацией `onSaveSuccess`.

## Примечания
- Связанные документы: `april-profile-1/tasks/023-phase-4-aprilhub-widget-host-e2e-smoke/TASK.md`, `april-profile-1/tasks/022-phase-4-profile-ui-package-openapi-embed/REPORT.md`.
- Обновления плана: 2026-04-23 — первичная версия.
