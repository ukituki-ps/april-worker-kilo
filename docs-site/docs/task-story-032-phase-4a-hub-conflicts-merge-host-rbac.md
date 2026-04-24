---
sidebar_position: 25
---

# Task story 032: Hub — хостинг конфликтного UI, RBAC и e2e

Статус: исполнение постановки из `april-profile-1` (фаза **4a.4**), реализация в **`april-worker`**.

## Что реализовано

- Маршрут `#/app/profile/admin/conflicts` и пункт сайдбара «Профиль — конфликты и merge» (виден только при realm-роли `admin` в Hub JWT).
- Host-экран `ConflictsMergeHostWidget`: загрузка очереди, разрешение выбранного конфликта, отдельный блок merge source/target через BFF-префикс `/api/v1/admin/profile/api/v1/admin/...`.
- Playwright: сценарий resolve + merge со stubs; негативный кейс для пользователя без `admin` (`april-user` в dev-realm).
- В dev-realm Keycloak: `april-dev` получил роль `admin`; добавлен `april-user` (только `user`) для RBAC-smoke.

## Как запускать

```bash
DOCS_HTTP_PORT=18080 ./scripts/run-playwright-aprilhub.sh
```

Переменные: `PLAYWRIGHT_RESTRICTED_USER` / `PLAYWRIGHT_RESTRICTED_PASSWORD` (по умолчанию `april-user` / `april-user-pass`).

## Роли и риски

- **Hub BFF** требует realm-роль `admin` для любого вызова `/api/v1/admin/profile/*`.
- **AprilProfile** на admin-эндпоинтах дополнительно проверяет `KEYCLOAK_ADMIN_REALM_ROLE` (часто `april-profile-admin`). Если роли в токене Hub не согласованы с ожиданием Profile, upstream вернёт **403** даже при доступе к экрану в shell — это не обход IAM на уровне UI, а несогласованность конфигурации Keycloak между сервисами; устраняется маппингом ролей или composite roles в realm.

## Ссылки

- Постановка: `april-profile-1/tasks/032-phase-4a-hub-conflicts-merge-host-rbac/TASK.md`
- Задача (april-worker): `tasks/029-aprilhub-execute-external-task-032-april-profile-1/TASK.md`
- План (april-worker): `tasks/029-aprilhub-execute-external-task-032-april-profile-1/PLAN.md`
- Отчёт (april-worker): `tasks/029-aprilhub-execute-external-task-032-april-profile-1/REPORT.md`
- Отчёт (april-profile-1): `april-profile-1/tasks/032-phase-4a-hub-conflicts-merge-host-rbac/REPORT.md`
