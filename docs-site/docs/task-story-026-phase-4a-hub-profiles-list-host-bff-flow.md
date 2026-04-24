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

## Ссылки

- Постановка: `april-profile-1/tasks/026-phase-4a-hub-profiles-list-host-bff-flow/TASK.md`
- План (april-worker): `tasks/026-aprilhub-align-docs-with-april-profile-design-system-approach/PLAN.md`
- Отчёт (april-worker): `tasks/026-aprilhub-align-docs-with-april-profile-design-system-approach/REPORT.md`
