---
sidebar_position: 23
---

# Task story 028: Hub instances host + routing + e2e

Статус: исполнение задачи из `april-profile-1`, реализация выполнена в `april-worker`.

## Что реализовано

- В `hub-shell` заменена заглушка маршрута `/app/profile/instances/:instanceId` на рабочий host-экран `ProfileInstancesHostWidget`.
- В экран экземпляров добавлен BFF/OIDC flow: чтение экземпляра по `instanceId` и create новой записи через `/api/v1/admin/profile/api/v1/entities`.
- Навигация shell обновлена: пункт sidebar `Профиль — экземпляры` ведёт в рабочий сценарий вместо placeholder.
- Добавлен Playwright smoke: логин -> переход в раздел экземпляров -> create через BFF-префикс -> проверка host callback `profile-instances-last-action`.

## Как запускать сценарий

```bash
./scripts/run-playwright-aprilhub.sh
```

Опционально для детерминированного списка:

```bash
VITE_PROFILE_INSTANCE_IDS=demo-instance
```

## Ручные шаги и ограничения

- Нужны рабочие доступы Keycloak (`PLAYWRIGHT_USER`/`PLAYWRIGHT_PASSWORD`) и доступность связки Hub -> BFF -> AprilProfile.
- Для стабильного smoke используются Playwright route stubs на BFF endpoint’ах экземпляров.
- Хост-экран экземпляров пока реализован локально в `hub-shell`; при публикации внешнего `@april/profile-ui` требуется синхронизация на пакетный компонент.

## Что делать при недоступности стенда

- Проверить доступность `hub-bff` health и проксирование `/api/v1/admin/profile`.
- Повторить прогон `./scripts/run-playwright-aprilhub.sh` после восстановления Keycloak и AprilProfile.
- Если стенд нестабилен, зафиксировать причину в отчёте и приложить последний статус smoke.

## Ссылки

- Постановка: `april-profile-1/tasks/028-phase-4a-hub-instances-host-routing-e2e/TASK.md`
- Задача (april-worker): `tasks/027-aprilhub-execute-external-task-028-april-profile-1/TASK.md`
- План (april-worker): `tasks/027-aprilhub-execute-external-task-028-april-profile-1/PLAN.md`
- Отчёт (april-worker): `tasks/027-aprilhub-execute-external-task-028-april-profile-1/REPORT.md`
