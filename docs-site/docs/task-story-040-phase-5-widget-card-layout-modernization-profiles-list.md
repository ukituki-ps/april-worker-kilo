---
sidebar_position: 23
---

# Task story 040: Profiles list widget card layout modernization (phase 5)

Статус: внешняя задача `april-profile-1` синхронизирована в документации `april-worker` (задача `041`).

## Что зафиксировано для AprilHub

- Во внешнем репозитории `april-profile-1` обновлён `Profiles list widget` в рамках `040-phase-5-widget-card-layout-modernization`.
- В `april-worker` актуализирован documentation-layer: описание host-встраивания, границы ответственности и ссылки между историями.
- Для host-сценария в AprilHub остаются неизменными опорные интеграционные элементы:
  - маршрут `/app/profile/entities`,
  - BFF-префикс `apiBaseUrl=/api/v1/admin/profile/api`,
  - `HostContext` (`tenant`, `auth`, `telemetry`).

## Что не менялось в этом репозитории

- Runtime-код `ProfilesListHostWidget` не перерабатывался в рамках задачи 041.
- Backend-контракты и IAM-модель (Keycloak) не изменялись.
- Миграции БД (Atlas) не требовались.

## Риски и follow-up

- При недоступности внешнего репозитория в локальном workspace возможна задержка в синхронизации формулировок с последними коммитами phase 5.
- Если во внешнем `april-profile-1` появятся дополнительные требования к host API/props, их нужно оформить отдельной задачей для `april-worker`.

## Ссылки

- Внешняя постановка: `april-profile-1/tasks/040-phase-5-widget-card-layout-modernization/TASK.md`
- Внешний отчёт: `april-profile-1/tasks/040-phase-5-widget-card-layout-modernization/REPORT.md`
- Локальная задача синхронизации: `tasks/041-aprilhub-execute-external-task-040-phase-5-widget-card-layout-modernization-april-profile-1/TASK.md`
- Базовая история host flow: `docs-site/docs/task-story-026-phase-4a-hub-profiles-list-host-bff-flow.md`
