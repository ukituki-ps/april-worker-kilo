## 1) Итого
- Статус: ✅ выполнено
- Задача: Раздел `Профили` в sidebar AprilHub + интеграция `profiles-widget`
- Ветка: `develop`
- Коммиты: `не создавались`
- PR: не создавался

## 2) Что сделано
- [frontend] Восстановлен продуктовый раздел `Профили` в сайдбаре (`#/app/profile/entities`) и активный state навигации.
- [frontend] Обновлена маршрутизация `hub-shell`: redirect с `#/app` в `#/app/profile/entities`, fallback для неизвестных маршрутов, поддержка host-навигации в legacy entity-route (`/app/profile/entities/:entityId/:tab`).
- [frontend] В `AuthorizedHubContent` подключен `ProfilesListHostWidget` через `CompositionErrorBoundary`.
- [frontend] Добавлен vendor adapter `hub-shell/src/vendor/april-profile-ui.tsx` с контрактом `ProfilesWidget` (hostContext, `apiBaseUrl`, `accessToken`, `onAction`, `onError`, `onOpenEntity`, `onObservability`) и базовой telemetry-эмиссией `view/list_*`.
- [frontend] Интегрированы callbacks host-уровня: toast для успешных действий, user-safe error сообщения с `request_id`, host navigation для `onOpenEntity`.
- [frontend/tests] Обновлены unit/e2e smoke тесты под новый UX-контракт раздела `Профили`, добавлен отдельный smoke-спек.
- [docs] Актуализированы `PLAN.md`, `REPORT.md` и статус `045` в `task_list.md`.

## 3) Изменённые файлы
- `hub-shell/package.json`
- `hub-shell/src/App.test.tsx`
- `hub-shell/src/shell/AuthorizedHubContent.tsx`
- `hub-shell/src/shell/ShellBreadcrumbs.tsx`
- `hub-shell/src/shell/hub-host-context.tsx`
- `hub-shell/src/shell/shell-nav-config.ts`
- `hub-shell/src/shell/shell-paths.ts`
- `hub-shell/src/shell/shell-paths.test.ts`
- `hub-shell/src/widgets.tsx`
- `hub-shell/src/vendor/april-profile-ui.tsx`
- `hub-shell/tests/e2e/shell-privileged.spec.ts`
- `hub-shell/tests/e2e/profile-widgets-smoke.spec.ts`
- `task_list.md`
- `tasks/045-aprilhub-sidebar-profiles-widget-section/PLAN.md`
- `tasks/045-aprilhub-sidebar-profiles-widget-section/REPORT.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применялось
- Обратимость: да (revert frontend/docs изменений)

## 5) Проверка качества
- Линтер: ok
- Сборка: ok
- Unit tests: ok
- Integration tests: ok (в составе `vitest run`)
- E2E / smoke: ok

Команды (фактически выполненные):
```bash
npm --prefix hub-shell install --package-lock-only
npm --prefix hub-shell run lint
npm --prefix hub-shell run test
npm --prefix hub-shell run build
npm --prefix hub-shell run e2e:smoke
```

## 6) Деплой
- Среда: нет
- Согласовано с: `docs/DEPLOYMENT_STRATEGY.md`
- Образы: не применялось
- Health / readiness: не применялось
- Rollback: нет

## 7) Риски и ограничения
- Интеграция `profiles-widget` выполнена через локальный vendor adapter в `hub-shell` (shim), а не через поставку npm-пакета `@april/profile-ui` в runtime, из-за ограничений окружения (`EACCES` при `npm install` в `node_modules`).
- Для полного production-path желательно заменить shim на прямое подключение внешнего пакета (dist/registry) без локальной адаптации.

## 8) Что осталось
- [ ] Вынести vendor shim на прямую поставку `@april/profile-ui` (при доступном install/runtime контуре).
