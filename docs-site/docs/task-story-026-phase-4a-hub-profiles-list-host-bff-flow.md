---
sidebar_position: 22
---

# Task story 026: Hub profiles list host + BFF/OIDC flow

Статус: исполнение задачи из `april-profile-1`, реализация выполнена в `april-worker`.

## Что реализовано

- В `hub-shell` добавлен host-совместимый `ProfilesListWidget` с BFF/OIDC-контекстом для сценария списка профилей в AprilHub.
- Добавлен отдельный маршрут списка профилей `/app/profile/entities` и навигационный пункт `Профиль — список`.
- В авторизованной зоне Hub встроен `ProfilesListWidget` с `HostContext` (`tenant`, `auth`, `telemetry`) и BFF-префиксом `apiBaseUrl=/api/v1/admin/profile/api`.
- Добавлен smoke-сценарий Playwright: логин -> переход на экран списка профилей -> create через BFF -> проверка host callback (`profiles-list-last-action`).

## Как запускать сценарий

```bash
./scripts/run-playwright-aprilhub.sh
```

Опционально для списка профилей:

```bash
VITE_PROFILE_LIST_ENTITY_IDS=00000000-0000-0000-0000-000000000001
```

## Ручные точки и ограничения

- Нужны рабочие доступы Keycloak (`PLAYWRIGHT_USER`/`PLAYWRIGHT_PASSWORD`) и доступность маршрута Hub -> AprilProfile (`APRIL_PROFILE_ADMIN_URL`).
- Реализация списка профилей в Hub пока локальная и должна быть синхронизирована с внешним пакетом при его публикации в registry.
- Для стабильного smoke используются сетевые перехваты Playwright на BFF-префиксе, чтобы детерминированно подтвердить create flow.

## Актуализация после phase 5 (task 040 во внешнем repo)

- Во внешнем `april-profile-1` выполнена модернизация карточного layout для `Profiles list widget` (задача `040-phase-5-widget-card-layout-modernization`).
- Для `april-worker` это изменение трактуется как актуализация документационного слоя host-интеграции: маршрут `/app/profile/entities`, BFF-префикс и host-контекст остаются опорными точками.
- Детали phase 5, относящиеся к визуальному устройству карточки, фиксируются в отдельной истории: `task-story-040-phase-5-widget-card-layout-modernization-profiles-list`.
- Если реализация в `hub-shell` и внешний пакет расходятся по UI-поведению, приоритет у внешнего контракта `april-profile-1`; в `april-worker` такие расхождения выносятся в follow-up без несогласованного расширения scope.

## Ссылки

- Постановка: `april-profile-1/tasks/026-phase-4a-hub-profiles-list-host-bff-flow/TASK.md`
- План (april-worker): `tasks/026-aprilhub-align-docs-with-april-profile-design-system-approach/PLAN.md`
- Отчёт (april-worker): `tasks/026-aprilhub-align-docs-with-april-profile-design-system-approach/REPORT.md`
