---
sidebar_position: 24
---

# Task story 030: Hub instance history host + e2e

Статус: исполнение задачи из `april-profile-1`, реализация выполнена в `april-worker`.

## Что реализовано

- В `hub-shell` добавлен host-экран `InstanceHistoryHostWidget` для маршрута `/app/profile/instances/:instanceId/history`.
- Экран загружает текущую версию и таймлайн версий через BFF (`GET /v1/entities/{id}` и `GET /v1/entities/{id}/versions/{version}`).
- Добавлены просмотр выбранной версии, snapshot JSON и diff (с текущей или предыдущей версией).
- В сценарий экземпляров добавлено обновление (`PUT /v1/entities/{id}`), чтобы e2e покрывал путь `изменение -> новая версия -> история`.
- Обновлён Playwright smoke: логин -> раздел экземпляров -> update -> переход в историю -> проверка выбранной версии и diff.

## Как запускать сценарий

```bash
DOCS_HTTP_PORT=18080 ./scripts/run-playwright-aprilhub.sh
```

## Ограничения и ручные условия

- Restore версии не реализован, так как в текущем API-контракте отсутствует endpoint восстановления; экран истории работает в режиме read-only.
- Для запуска smoke нужны рабочие учётные данные Keycloak (`PLAYWRIGHT_USER`/`PLAYWRIGHT_PASSWORD`) и доступность связки `hub-shell -> hub-bff`.
- Скрипт `./scripts/run-playwright-aprilhub.sh` дожидается JWKS Keycloak (через ephemeral `busybox` в docker-сети compose) перед стартом `hub-bff`, чтобы не ловить race на cold start.
- Для стабильности smoke доменные запросы истории/версий подменяются route stubs в Playwright.

## Ссылки

- Постановка: `april-profile-1/tasks/030-phase-4a-hub-instance-history-host-e2e/TASK.md`
- Задача (april-worker): `tasks/028-aprilhub-execute-external-task-030-april-profile-1/TASK.md`
- План (april-worker): `tasks/028-aprilhub-execute-external-task-030-april-profile-1/PLAN.md`
- Отчёт (april-worker): `tasks/028-aprilhub-execute-external-task-030-april-profile-1/REPORT.md`
