# План: задача 025 — исполнение внешней задачи 035 (shell IA AprilHub)

- **Задача:** [`TASK.md`](./TASK.md)
- **Внешняя постановка:** `april-profile-1/tasks/035-phase-4a-hub-ui-shell-information-architecture/TASK.md`
- **Дата плана:** 2026-04-24
- **Статус плана:** согласован по факту выполнения

## Исходные допущения

- Hash-маршрутизация (`#/app/...`) достаточна для deep-link без изменения nginx и без новой npm-зависимости (ограничение окружения: `node_modules` с правами root).
- Виджет профиля остаётся локальным в `hub-shell`; меняется только способ встраивания (слот маршрута + контекст).

## Порядок работ (факт)

1. Реализовать разбор маршрутов и IA (`shell-paths`, навигация, breadcrumbs).
2. Ввести `HubHostContextProvider`, `ShellToastProvider`, `AuthorizedShellGate`, `AuthorizedHubContent`, `ProfileEntityFrame`.
3. Обновить `ProfileWidget` (маршрутный `entityId`, toasts), e2e и unit-тесты.
4. Обновить `docs/WIDGET_CONTRACTS.md`, `docs/FRONTEND_STRATEGY.md`, docs-site story; оформить отчёты в обоих репозиториях.

## Затрагиваемые области

| Область | Изменения |
|--------|-----------|
| Frontend (`hub-shell`) | Shell IA, hash routes, host context, smoke e2e |
| Документация | `docs/`, `docs-site/docs/` |
| Backend / БД | не затрагивались |

## Риски и откат

- **Риск:** hash вместо History API path — якоря могут отличаться от будущего единого path-SPA. **Митигация:** зафиксировано в документации; миграция на `BrowserRouter` возможна без смены сегментов пути.
- **Откат:** revert коммита(ов) по `hub-shell` и документации.

## Проверка

- `cd hub-shell && npm run lint && npm run test`
- `./scripts/run-playwright-aprilhub.sh` (при доступном compose / Keycloak)
