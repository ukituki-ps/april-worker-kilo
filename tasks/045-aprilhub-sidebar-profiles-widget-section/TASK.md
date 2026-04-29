# Задача 045: раздел `Профили` в сайдбаре AprilHub + интеграция `profiles-widget`

## Мета
- **ID / ветка:** `045-aprilhub-sidebar-profiles-widget-section`
- **Приоритет:** высокий
- **Тип:** [sidebar IA restoration + host integration hardening]
- **Связанные документы:**
  - [`task_list.md`](../../task_list.md)
  - [`tasks/044-aprilhub-auth-only-empty-sidebar/TASK.md`](../044-aprilhub-auth-only-empty-sidebar/TASK.md)
  - [`tasks/042-aprilhub-profiles-widget-sidebar-integration/TASK.md`](../042-aprilhub-profiles-widget-sidebar-integration/TASK.md)
  - [`hub-shell/src/shell/shell-nav-config.ts`](../../hub-shell/src/shell/shell-nav-config.ts)
  - [`hub-shell/src/shell/shell-paths.ts`](../../hub-shell/src/shell/shell-paths.ts)
  - [`hub-shell/src/shell/AuthorizedHubContent.tsx`](../../hub-shell/src/shell/AuthorizedHubContent.tsx)
  - [`hub-shell/src/widgets.tsx`](../../hub-shell/src/widgets.tsx)
  - [`hub-shell/src/vendor/april-profile-ui.tsx`](../../hub-shell/src/vendor/april-profile-ui.tsx)

## Цель
Встроить `profiles-widget` в AprilHub как production-ready модуль и вернуть в авторизованный shell рабочий раздел `Профили` в сайдбаре. Пользователь после логина должен видеть пункт `Профили`, открывать целевой экран и проходить end-to-end сценарии с корректным auth/tenant/telemetry-контекстом без деградации UX.

## Контекст для агента
- После задачи `044` авторизованная зона сведена к auth-only каркасу с пустым сайдбаром.
- `ProfilesWidget` стабилизирован как внешний пакет и готов к host-встраиванию в AprilHub.
- Критично не ломать публичный контракт виджета и не дублировать backend/IAM-логику на стороне UI.
- Интеграция должна быть воспроизводимой: с явными проверками, smoke-критериями и release-gate.

## Входит в объём
- IA и навигация в `hub-shell`:
  - добавить в сайдбар раздел `Профили`;
  - настроить целевой маршрут раздела (основной путь для списка профилей);
  - обеспечить корректный fallback для неизвестных/невалидных маршрутов.
- Host wiring для `ProfilesWidget`:
  - рендер виджета в целевом разделе;
  - передача обязательных пропсов (`hostContext`, `apiBaseUrl`/adapter, auth context);
  - интеграция callbacks: `onAction`, `onError`, `onOpenEntity` с host-навигацией.
- Интеграционный runtime-контур:
  - передача `tenantId`, `accessToken`, `requestId/correlationId`;
  - проверка и UX-обработка `401/403/409` (без silent-fail, с безопасными сообщениями).
- Совместимость и контракт:
  - проверка используемой версии `@april/profile-ui` и контракта `v1`;
  - фиксация ограничений и ожиданий по API (`/v1/entities`, CRUD в рамках публичного контракта виджета).
- Observability и эксплуатация:
  - проверка эмиссии событий (`view_loaded`, `list_*`, `save_*`, `details_*`);
  - документирование минимального smoke-сценария для QA/on-call.
- Документация и release-gate:
  - обновление task-артефактов (`PLAN.md` при необходимости, `REPORT.md` по факту выполнения);
  - фиксация критериев блокировки релиза до включения фичи по умолчанию.

## Не входит в объём
- Перепроектирование UI/UX `ProfilesWidget` и разработка новых бизнес-фич внутри виджета.
- Изменение backend API-контрактов AprilHub/AprilProfile (если потребуется, оформить отдельную follow-up задачу).
- Полный observability-rollout за пределами интеграционного минимума этой задачи.
- Масштабный рефактор shell-архитектуры вне точки встраивания раздела `Профили`.

## Технические ограничения
- Публичный контракт `ProfilesWidget` — source of truth; transport/backend-логика не переносится в `Core` виджета.
- IAM/tenant-авторизация остаются в доверенном контуре host + backend без дублирования RBAC в UI.
- В UI показываются только user-safe ошибки; технические поля (`requestId`, `code`) направляются в обработчики/логи.
- Интеграция должна быть abort/race-safe и не создавать UX-регрессии при быстрых переходах/повторных запросах.
- Нельзя считать задачу готовой без воспроизводимого smoke и evidence в `REPORT.md`.

## Требования к дизайн-системе (frontend)
- [ ] Использован существующий DS-каркас AprilHub; визуальная интеграция не ломает UX-консистентность shell.
- [ ] Состояния `loading/empty/error/busy` отображаются в принятых DS-паттернах host-приложения.
- [ ] Тексты ошибок и CTA согласованы с текущими формулировками AprilHub.
- [ ] Документация и smoke-сценарии отражают фактическое DS-поведение экрана `Профили`.

## Критерии готовности (acceptance)
- [ ] В сайдбаре AprilHub доступен раздел `Профили`.
- [ ] Раздел `Профили` открывает целевой маршрут и рендерит `profiles-widget` end-to-end.
- [ ] Host корректно передаёт `hostContext`/auth/tenant/telemetry context во все релевантные сценарии.
- [ ] `onAction`/`onError`/`onOpenEntity` интегрированы и подтверждены тестами/smoke.
- [ ] Сценарии `401/403/409` дают ожидаемый UX и не приводят к silent-fail.
- [ ] Telemetry-события и корреляция запросов наблюдаемы в логах/мониторинге.
- [ ] Release-gate задокументирован, выполнен, и evidence приложены в `REPORT.md`.

## Проверка (команды)
```bash
# Hub shell: статика, тесты, сборка
npm --prefix hub-shell run lint
npm --prefix hub-shell run test
npm --prefix hub-shell run build

# E2E smoke для раздела "Профили" (актуальный скрипт проекта)
npm --prefix hub-shell run e2e:smoke
```

## Результат в отчёте
- Какие файлы/контракты host-обвязки изменены для раздела `Профили`.
- Какие сценарии auth/tenant/error/telemetry проверены и с каким результатом.
- Какие ограничения, риски и release-blockers остаются (если есть).
- Какие follow-up шаги требуются после интеграции.
