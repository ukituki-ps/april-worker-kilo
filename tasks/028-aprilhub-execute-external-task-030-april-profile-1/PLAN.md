# План: исполнение внешней задачи 030 из april-profile-1

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-24
- **Статус плана:** согласован

## Исходные допущения
- В `april-profile-1/tasks/030-phase-4a-hub-instance-history-host-e2e/TASK.md` требуется реализация в `april-worker` (Hub host + e2e + docs-site история).
- Контракт API истории read-only: загрузка текущей версии и чтение конкретных версий, restore endpoint в текущем контракте не обязателен.
- Базовый route для экземпляров (`/app/profile/instances/:instanceId`) и BFF-префикс `/api/v1/admin/profile/api` уже реализованы в `hub-shell`.

## Порядок работ (шаги)
1. Добавить host-виджет истории экземпляра в `hub-shell` (таймлайн версий, выбор версии, snapshot, diff).
2. Расширить hash-роутинг/навигацию/хлебные крошки для отдельного пути истории экземпляра.
3. Обновить Playwright smoke сценарий под путь "изменение данных -> новая версия -> просмотр истории".
4. Синхронизировать документацию по виджет-контрактам и docs-site stories.
5. Зафиксировать отчёт выполнения в `april-worker` и продублировать в `april-profile-1`.

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | Нет изменений |
| Frontend | `hub-shell`: новый host-экран истории, роутинг, nav, breadcrumbs, smoke e2e |
| БД / Atlas | Нет изменений |
| Инфра / Compose | Нет изменений |
| Документация / OpenAPI | `docs/WIDGET_CONTRACTS.md`, docs-site story + overview, task reports |

## Риски и откат
- **Риск:** неочевидный контракт endpoints для истории версий -> **Митигация:** использовать проверенный паттерн из `@april/profile-ui` (`GET current` + `GET version by number`).
- **Риск:** flaky e2e из-за зависимости от стенда -> **Митигация:** Playwright route stubs для доменных API истории.
- При необходимости отката: реверт изменений в `hub-shell`, `docs/`, `docs-site/` и `tasks/`.

## Проверка после выполнения
- Команды: `cd hub-shell && npm run lint && npm run test`
- Smoke: `DOCS_HTTP_PORT=18080 ./scripts/run-playwright-aprilhub.sh`

## Примечания
- Связанная внешняя постановка: `april-profile-1/tasks/030-phase-4a-hub-instance-history-host-e2e/TASK.md`.
- Обновления плана: нет.
