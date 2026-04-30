# Задача 051: сайдбар «Шаблоны» + интеграция `entity-types-widget` (по образцу «Профили»)

## Мета

- **ID / ветка:** `051-aprilhub-sidebar-entity-types-widget` (рабочая ветка: `feature/051-aprilhub-sidebar-entity-types-widget` или согласованное имя)
- **Приоритет:** обычный
- **Связанные документы:**
  - [`task_list.md`](../../task_list.md)
  - [`docs/AGENT_MASTER_PROMPT.md`](../../docs/AGENT_MASTER_PROMPT.md)
  - [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](../../docs/AGENT_ARCHITECTURE_CONTEXT.md)
  - [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md)
  - [`docs/AGENT_TASK_TEMPLATE.md`](../../docs/AGENT_TASK_TEMPLATE.md)
  - Эталон интеграции профилей: [`tasks/045-aprilhub-sidebar-profiles-widget-section/TASK.md`](../045-aprilhub-sidebar-profiles-widget-section/TASK.md)

## Цель

В авторизованном **AprilHub** (`hub-shell`) добавить пункт сайдбара **«Шаблоны»** и на отдельном hash-маршруте встроить внешний виджет **`entity-types-widget`** из пакета **AprilProfile** (`profile-ui`, импорт через `@april/profile-ui-external` / алиас Vite), с той же host-обвязкой, что у экрана **«Профили»**: контекст tenant/auth/telemetry, BFF `apiBaseUrl`, токен Keycloak, `CompositionErrorBoundary`, lazy-load, крошки, тесты маршрута и e2e smoke.

## Входит в объём

### AprilProfile (`frontend/packages/profile-ui`)

- Виджет доступен как **именованный публичный экспорт** из [`vendor/april-profile/.../profile-ui/src/index.ts`](../../vendor/april-profile/frontend/packages/profile-ui/src/index.ts) (как `ProfilesWidget`), с типами пропсов.
- Пропсы согласованы с принятой схемой host ↔ widget: `hostContext`, `apiBaseUrl`, `accessToken`, при необходимости `onObservability` / `onError` — **по аналогии с `ProfilesWidget`** (см. [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md)).

### hub-shell

- Новый путь в [`hub-shell/src/shell/shell-paths.ts`](../../hub-shell/src/shell/shell-paths.ts): константа (предлагаемый префикс рядом с профилями: `#/app/profile/entity-types`; финальный путь согласовать с BFF/API «шаблонов»).
- Расширить `ShellRouteMatch` и `matchShellRoute`: отдельный `kind` для экрана шаблонов (не объединять с `profiles-list`).
- [`hub-shell/src/shell/shell-nav-config.ts`](../../hub-shell/src/shell/shell-nav-config.ts): пункт **«Шаблоны»**, корректные `href` / `activePrefix`.
- [`hub-shell/src/shell/AuthorizedHubContent.tsx`](../../hub-shell/src/shell/AuthorizedHubContent.tsx): ветка маршрута рендерит новый host-компонент (аналог `ProfilesListHostWidget`).
- [`hub-shell/src/shell/ShellBreadcrumbs.tsx`](../../hub-shell/src/shell/ShellBreadcrumbs.tsx): для нового `kind` — текст **«Шаблоны»**.
- [`hub-shell/src/widgets.tsx`](../../hub-shell/src/widgets.tsx): lazy host, те же паттерны, что у `ProfilesListHostWidget` (`apiBaseUrl`, `keycloak.token`, observability при необходимости).
- [`hub-shell/src/integrations/april-profile-ui.ts`](../../hub-shell/src/integrations/april-profile-ui.ts) и/или отдельный модуль: типизированная обёртка над экспортом из `@april/profile-ui-external` (фактическое имя компонента — из реализации в AprilProfile).
- [`hub-shell/src/types/april-profile-ui-external.d.ts`](../../hub-shell/src/types/april-profile-ui-external.d.ts): декларация нового экспорта.
- [`hub-shell/src/app-shell.tsx`](../../hub-shell/src/app-shell.tsx): не подставлять одну иконку на все пункты; для **«Шаблоны»** — своя иконка или маппинг `nav id` → иконка (сейчас для всех используется `ProfilesSidebarIcon`).
- При необходимости [`hub-shell/src/shell/hub-host-context.tsx`](../../hub-shell/src/shell/hub-host-context.tsx): метод навигации на экран шаблонов (аналог `goToProfilesList`).
- **Редирект** с `#/app` на дефолтный раздел: **не менять** (как сейчас — на профили), если отдельно не оговорено.

### Тесты

- [`hub-shell/src/shell/shell-paths.test.ts`](../../hub-shell/src/shell/shell-paths.test.ts): матчинг нового пути.
- Расширить или добавить Playwright: логин → клик **«Шаблоны»** → ожидаемый hash → видимость маркера UI виджета (по аналогии с `profile-widgets-smoke.spec.ts`).

## Не входит в объём

- Смена landing по умолчанию после входа.
- RBAC на пункт меню (без явного ТЗ и ролей).
- Изменения nginx/BFF, если виджет использует тот же базовый URL, что и профили: `…/api/v1/admin/profile/api`.

## Технические ограничения

- Стек и границы из [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](../../docs/AGENT_ARCHITECTURE_CONTEXT.md).
- Пользовательские подписи UI — **русский**.
- Виджет не управляет глобальным URL напрямую — только через контракт с host ([`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md)).
- Без destructive git; без прямого push в `main`/`develop` (работа через `feature/*` / PR).

## Критерии готовности (acceptance)

- [ ] В сайдбаре видны **«Профили»** и **«Шаблоны»**; активное состояние корректно при переключении.
- [ ] По **«Шаблоны»** открывается согласованный hash-маршрут и рендерится виджет с тем же классом host-контекста, что у профилей.
- [ ] Крошки показывают **«Шаблоны»** на соответствующем экране.
- [ ] `npm --prefix hub-shell run lint`, `test`, `build` проходят; e2e сценарий для шаблонов зелёный (или в [`REPORT.md`](./REPORT.md) явно указана причина пропуска).
- [ ] В [`REPORT.md`](./REPORT.md): изменённые файлы, команды проверки, риски/follow-up.

## Проверка (команды)

```bash
npm --prefix hub-shell run lint
npm --prefix hub-shell run test
npm --prefix hub-shell run build
npm --prefix hub-shell run e2e:smoke
```

## Зависимости

- В `vendor/april-profile` (или linked) должна быть версия `profile-ui` с экспортом виджета; до обновления сабмодуля задачу нельзя считать выполненной end-to-end в `april-worker`.

## Что зафиксировать в отчёте

- Версия/ревизия `vendor/april-profile`, имя экспорта виджета и публичный контракт пропсов.
- Список изменённых файлов `hub-shell` и итог проверок.
