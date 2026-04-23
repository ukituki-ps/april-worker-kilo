---
sidebar_position: 20
---

# Task story 021: AprilHub BFF proxy + admin routes + OIDC

Статус: исполнение задачи из `april-profile-1`, реализация выполнена в `april-worker`.

## Что реализовано

- В `hub-bff` добавлен admin proxy маршрут `/api/v1/admin/profile/*` в upstream AprilProfile.
- Для маршрута используется существующий Keycloak-first контур (один OIDC-клиент), доступ ограничен ролью `admin`.
- Для upstream вызовов сохраняется `Authorization` и трассировочные/tenant заголовки (`X-Correlation-Id`, `X-Request-Id`, `X-Tenant-*`).
- Добавлены unit-тесты на path rewrite, header passthrough и fallback без конфигурации upstream.

## Конфигурация

- `APRIL_PROFILE_ADMIN_URL` — базовый URL upstream сервиса Profile для admin proxy.

## Ограничения

- Задача покрывает только BFF-маршрутизацию и auth-guard в Hub.
- Публикация UI-пакета и e2e-виджет-хостинг остаются в задачах `022`/`023` дорожной карты `april-profile-1`.

## Ссылки

- Постановка: `april-profile-1/tasks/021-phase-4-aprilhub-bff-proxy-admin-routes-oidc/TASK.md`
- Отчёт (april-worker): `tasks/023-aprilhub-execute-external-task-021-april-profile-1/REPORT.md`
- Отчёт (april-profile-1): `april-profile-1/tasks/021-phase-4-aprilhub-bff-proxy-admin-routes-oidc/REPORT.md`
