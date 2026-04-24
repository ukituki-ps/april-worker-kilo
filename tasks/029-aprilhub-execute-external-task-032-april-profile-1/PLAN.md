# План: исполнение внешней задачи 032 (хостинг конфликтов + RBAC + e2e)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-24
- **Статус плана:** согласован

## Исходные допущения

- Виджет `ConflictQueueWidget` из пакета `@april/profile-ui` не встраиваем в этом инкременте (граница задачи 031); host-экран в Hub — тонкий слой с прямыми вызовами BFF по контракту OpenAPI Profile.
- Hub BFF уже проксирует `/api/v1/admin/profile/*` с guard `admin`.
- Playwright smoke использует route stubs для стабильности без обязательной БД с конфликтами.

## Порядок работ (шаги)

1. Расширить IA: `shellPaths`, `matchShellRoute`, навигация, breadcrumbs, ветка в `AuthorizedHubContent` с gate по `admin`.
2. Реализовать `ConflictsMergeHostWidget` (список, resolve, merge) на префиксе `/api/v1/admin/profile/api`.
3. Расширить smoke Playwright и при необходимости dev-realm Keycloak (`april-user`, `admin` у `april-dev`).
4. Документация: `WIDGET_CONTRACTS.md`, getting-started, task-story в `docs-site` здесь и в `april-profile-1`, двойной `REPORT.md`.

## Затрагиваемые области

| Область | Что меняется |
|--------|----------------|
| Frontend (`hub-shell`) | Маршрут, виджет, e2e |
| Инфра | `infra/keycloak/realm/april-realm.json` |
| Документация | `docs/`, `docs-site/`, внешний репозиторий `april-profile-1` |
| Backend | без изменений (guard уже есть) |

## Риски и откат

- **Риск:** Profile отклоняет запросы при отсутствии `april-profile-admin` в JWT. **Митигация:** задокументировать согласование ролей в Keycloak.
- Откат: реверт коммита в `april-worker` и при необходимости откат realm-import на стенде.

## Проверка после выполнения

```bash
cd hub-shell && npm run lint && npm run test
DOCS_HTTP_PORT=18080 ./scripts/run-playwright-aprilhub.sh
```
