# План: исполнение внешней задачи 021 (BFF proxy admin routes + OIDC)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-23
- **Статус плана:** согласован

## Исходные допущения
- Реализация выполняется в `april-worker`, постановка и дублирующий отчёт ведутся также в `april-profile-1`.
- Для проксирования admin-маршрутов Profile используется существующий Keycloak-first контур (один OIDC-клиент), без внедрения второй auth-модели.
- Для нетривиальной задачи достаточно локальных проверок по затронутым модулям (`hub-bff` + docs/OpenAPI) и фиксации ограничений в отчёте.

## Порядок работ (шаги)
1. Добавить в `hub-bff` конфигурацию upstream для admin proxy Profile и handler проксирования `/api/v1/admin/profile/*` с пробросом обязательных заголовков.
2. Подключить маршрут в `cmd/hub-bff/main.go` под существующим admin role guard (`admin`), не меняя текущие auth-контракты.
3. Добавить unit-тесты на прокси-маршрут (path rewrite + headers passthrough + поведение при отсутствии upstream).
4. Обновить OpenAPI и документацию (`.env.example`, `docs-site/docs/*`) под новый admin proxy сценарий.
5. Прогнать релевантные проверки и подготовить `REPORT.md` в `tasks/023...`.
6. Подготовить дублирующий отчёт в `april-profile-1/tasks/021.../REPORT.md` с тем же набором фактов и ссылками.

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | Новый admin proxy маршрут до Profile upstream в `hub-bff` |
| Frontend | Не меняется |
| БД / Atlas | Нет изменений |
| Инфра / Compose | Только env-конфигурация URL upstream |
| Документация / OpenAPI | Контракт admin proxy и task-story/overview в docs-site |

## Риски и откат
- **Риск:** некорректный upstream URL/маршрутизация на dev -> **Митигация:** явная env-переменная + `503` при отсутствии конфигурации.
- **Риск:** потеря tenant/request tracing headers -> **Митигация:** явный проброс `Authorization`, `X-Request-Id`, `X-Correlation-Id`, `X-Tenant-*` в proxy handler.
- При необходимости отката: удалить маршрут и env из ветки задачи, вернуть предыдущий контракт `hub-bff`.

## Проверка после выполнения
- Команды: `cd hub-bff && go test ./...`, `make openapi-lint`.
- Ручная проверка / smoke: запрос на `/api/v1/admin/profile/*` через `hub-bff` с Bearer token и проверкой проброса заголовков.

## Примечания
- Связанные задачи: внешний тикет `april-profile-1/tasks/021-phase-4-aprilhub-bff-proxy-admin-routes-oidc/TASK.md`.
- Обновления плана: 2026-04-23 — первичная версия.
