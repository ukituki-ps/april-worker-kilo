# Задача 042: интеграция внешнего `profiles-widget` в сайдбар AprilHub

## Мета
- **ID / ветка:** `042-aprilhub-profiles-widget-sidebar-integration`
- **Приоритет:** высокий
- **Тип:** [внешний репозиторий + интеграция в Hub]
- **Связанные документы:**
  - [`task_list.md`](../../task_list.md)
  - [`tasks/026-aprilhub-align-docs-with-april-profile-design-system-approach/TASK.md`](../026-aprilhub-align-docs-with-april-profile-design-system-approach/TASK.md)
  - [`tasks/032-aprilhub-aprilprofile-widgets-rbac-e2e-suite/TASK.md`](../032-aprilhub-aprilprofile-widgets-rbac-e2e-suite/TASK.md)
  - [`tasks/041-aprilhub-execute-external-task-040-phase-5-widget-card-layout-modernization-april-profile-1/TASK.md`](../041-aprilhub-execute-external-task-040-phase-5-widget-card-layout-modernization-april-profile-1/TASK.md)
  - [`docs-site/docs/task-story-026-phase-4a-hub-profiles-list-host-bff-flow.md`](../../docs-site/docs/task-story-026-phase-4a-hub-profiles-list-host-bff-flow.md)
  - [`hub-shell/src/shell/AuthorizedHubContent.tsx`](../../hub-shell/src/shell/AuthorizedHubContent.tsx)
  - [`hub-shell/src/shell/shell-paths.ts`](../../hub-shell/src/shell/shell-paths.ts)
  - [`hub-shell/src/widgets.tsx`](../../hub-shell/src/widgets.tsx)

## Цель
С нуля перевести раздел `Профиль — список` в сайдбаре AprilHub на внешний `profiles-widget` из `april-profile-1`, чтобы при выборе пункта меню открывался именно внешний виджет с корректной host-обвязкой (OIDC/BFF/telemetry/error-boundary), а старая локальная реализация списка профилей была удалена.

## Контекст для агента
- Текущий маршрут списка профилей (`/app/profile/entities`) рендерит локальный host-компонент в `hub-shell`.
- Требуется заменить существующую реализацию раздела на внешний виджет и не оставлять параллельного legacy-пути.
- Интеграция должна остаться совместимой с routing/навигацией авторизованной зоны AprilHub и существующей моделью ролей.
- Задача считается продуктовой интеграцией (не только документация): ожидается изменение runtime-поведения в UI.

## Входит в объём
- Подключить внешний `profiles-widget` из `april-profile-1` как единственный источник UI для раздела `Профиль — список`.
- Пересобрать host-обвязку для этого раздела:
  - прокинуть `HostContext` (`tenant`, `auth`, `telemetry`);
  - прокинуть `accessToken` (Keycloak) и required callbacks;
  - сохранить вызовы через BFF-префикс (`/api/v1/admin/profile/api`);
  - оставить защиту через `CompositionErrorBoundary`.
- Обновить route binding: пункт в сайдбаре `Профиль — список` должен вести на маршрут списка и рендерить внешний виджет.
- Удалить старую локальную реализацию списка профилей и связанный мёртвый код/legacy-ветки, если они больше не используются.
- Актуализировать документацию/заметки по задаче (включая фиксацию точек интеграции и ограничений).

## Точный механизм доставки внешнего виджета
- Источник поставки: npm-пакет внешнего репозитория `april-profile-1` (линейка `@april/profile-ui`, включая `profiles-widget`).
- Способ подключения: явная зависимость в `hub-shell/package.json` с контролем semver и lockfile.
- Граница интеграции в Hub:
  1. импорт внешнего `profiles-widget` в host-слое `hub-shell`;
  2. адаптер/обвязка в `hub-shell` для `HostContext`, `apiBaseUrl`, `accessToken`, telemetry callbacks;
  3. рендер через маршрут `/app/profile/entities` и пункт сайдбара `Профиль — список`.
- Допустимый fallback: временный локальный shim только как технический мост на время миграции в пределах ветки; в итоговом результате production-путь должен вести на внешний виджет без legacy-компонента списка.

## Не входит в объём
- Полная переработка остальных профильных разделов (`карточка`, `история`, `конфликты`), если не требуется для запуска `profiles-widget`.
- Изменение backend-контрактов AprilProfile/Hub BFF вне необходимых адаптаций для внешнего виджета.
- Добавление новых бизнес-фич списка профилей, не связанных с миграцией на внешний виджет.

## Технические ограничения
- Не хранить секреты/токены в коде и отчётах.
- Не дублировать UI-логику списка профилей в Hub после миграции.
- Сохранить корректную передачу `requestId/correlationId` в downstream-вызовы.
- Все изменения должны быть совместимы с текущим маршрутом `/app/profile/entities` и навигацией сайдбара.
- При несовместимости версий внешнего пакета — фиксировать ограничение и причину в `REPORT.md`.

## Критерии готовности (testable acceptance)
- [ ] **Маршрут:** переход из сайдбара по пункту `Профиль — список` открывает `/app/profile/entities` без ручного ввода URL.
- [ ] **Ожидаемый рендер:** на `/app/profile/entities` отображается внешний `profiles-widget` (не legacy host-list компонент), и видны его опорные UI-элементы/селекторы.
- [ ] **Host-обвязка:** внешний виджет получает валидный `HostContext` + `accessToken` и работает через BFF-префикс `/api/v1/admin/profile/api`.
- [ ] **Ошибка:** при штатно смоделированной ошибке загрузки/запроса показывается ожидаемый error-state (error boundary/alert/toast) без падения всей страницы.
- [ ] **Legacy removal:** старая локальная реализация списка профилей удалена из runtime-пути и не участвует в рендере раздела.
- [ ] **Документация и отчёт:** в `REPORT.md` зафиксированы механизм доставки, финальная точка рендера и фактические проверки.

## Обязательный e2e smoke по сайдбару
- Добавить/обновить Playwright smoke-сценарий уровня critical path:
  1. логин в AprilHub;
  2. клик по пункту сайдбара `Профиль — список`;
  3. проверка маршрута `/app/profile/entities`;
  4. проверка рендера внешнего `profiles-widget`;
  5. негативная проверка ошибки (перехват 4xx/5xx или падение запроса) с ожиданием корректного UI-сообщения.
- Smoke должен входить в обязательный прогон `hub-shell` e2e smoke набора (не только локальный ad-hoc запуск).

## Проверка (команды)
```bash
# Статика/типы
npm --prefix hub-shell run lint

# Unit/integration frontend
npm --prefix hub-shell run test -- --runInBand

# Обязательный smoke по сайдбару и профилям
npm --prefix hub-shell run e2e:smoke
```

## Результат в отчёте
- Какие файлы/маршруты обновлены для интеграции внешнего `profiles-widget`.
- Какая версия и способ поставки внешнего пакета зафиксированы в Hub.
- Какие legacy-части удалены.
- Какие e2e smoke и дополнительные проверки выполнены, с итогом по каждому сценарию.
- Известные ограничения, риски и follow-up.
