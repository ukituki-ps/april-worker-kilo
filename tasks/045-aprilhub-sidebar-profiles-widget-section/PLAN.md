# План: раздел `Профили` в сайдбаре AprilHub + интеграция `profiles-widget`

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-29
- **Статус плана:** согласован

## Исходные допущения
- Базовый auth-flow (`check-sso`, `login/logout`, `GET /api/v1/me`) остаётся без изменений и не регрессирует.
- После `044` в shell сейчас auth-only режим с пустым сайдбаром; нужно вернуть только раздел `Профили`.
- `profiles-widget` интегрируется через публичный host-контракт, без внедрения backend/IAM-логики в UI.
- Минимальный тестовый контур задачи: `hub-shell` lint + unit + e2e smoke.

## Порядок работ (шаги)
1. Обновить маршрутизацию shell: добавить маршрут раздела `Профили`, настроить redirect и fallback.
2. Вернуть пункт `Профили` в primary sidebar и связать active-state с новым маршрутом.
3. Подключить `ProfilesListHostWidget` в `AuthorizedHubContent` через `CompositionErrorBoundary`, сохранив host context и toast/error handling.
4. Синхронизировать вспомогательные shell-компоненты (breadcrumb, host navigation API) под новый маршрут.
5. Обновить unit/e2e smoke тесты под новый UX-контракт (sidebar + рендер виджета + unknown route).
6. Прогнать проверки, оформить `REPORT.md` по шаблону.

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | Не меняется |
| Frontend | `hub-shell`: маршруты, sidebar nav, authorized content, host-context navigation, тесты |
| БД / Atlas | Не меняется |
| Инфра / Compose | Не меняется |
| Документация / OpenAPI | Артефакты задачи (`PLAN.md`, `REPORT.md`) |

## Риски и откат
- **Риск:** несовместимость callback-контракта внешнего `profiles-widget` в текущей версии пакета. → **Митигация:** опираться на текущие типы `@april/profile-ui`, не добавлять неподдерживаемые callbacks.
- **Риск:** регрессия fallback/redirect при hash-маршрутизации. → **Митигация:** покрыть unit + e2e сценарий неизвестного маршрута.
- **Риск:** runtime-ошибка виджета блокирует экран. → **Митигация:** рендер через `CompositionErrorBoundary`.
- Откат: revert изменений в `hub-shell/src/shell/*`, `hub-shell/src/App.test.tsx`, `hub-shell/tests/e2e/*`.

## Проверка после выполнения
- Команды: `npm --prefix hub-shell run lint`, `npm --prefix hub-shell run test`, `npm --prefix hub-shell run e2e:smoke`.
- Ручная проверка: логин -> sidebar содержит `Профили` -> экран виджета рендерится; unknown route -> fallback без crash.

## Примечания
- Связанные задачи: `042`, `043`, `044`, `045` в `task_list.md`.
- Обновления плана: первичная версия от 2026-04-29.
