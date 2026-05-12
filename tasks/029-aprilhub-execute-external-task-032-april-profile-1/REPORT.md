## 1) Итого

- Статус: выполнено
- Задача: исполнение внешней задачи 032 (`032-phase-4a-hub-conflicts-merge-host-rbac`) с двойным отчётом
- Ветка: `feature/aprilhub-phase-4a4-conflicts-host-rbac`
- Коммиты: `e5d1661` (основной diff), затем актуализации `REPORT.md` на ветке `feature/aprilhub-phase-4a4-conflicts-host-rbac` (см. `git log`)
- PR: не создавался из среды агента — черновик сравнения: `https://github.com/ukituki-ps/april-worker-kilo

## 2) Что сделано

- [frontend] Маршрут `#/app/profile/admin/conflicts`, пункт сайдбара «Профиль — конфликты и merge» (`requiresRole: admin`), breadcrumbs, `goToProfileConflicts()` в `HubHostContext`.
- [frontend] Host-экран `ConflictsMergeHostWidget`: `GET` очереди, `POST` resolve, `POST` merge через префикс `/api/v1/admin/profile/api/v1/admin/...`; gate в `AuthorizedHubContent` для пользователей без `admin`.
- [tests] Playwright: сценарий resolve+merge со stubs (перехват по предикату URL из-за ограничений glob на части пути); негативный RBAC для `april-user`.
- [infra] Keycloak dev-realm: `april-dev` — роли `user` и `admin`; добавлен `april-user` / `april-user-pass` только с `user`.
- [tooling] `scripts/run-playwright-aprilhub.sh`: экспорт `PLAYWRIGHT_RESTRICTED_USER` / `PLAYWRIGHT_RESTRICTED_PASSWORD`.
- [docs] `docs/WIDGET_CONTRACTS.md`, `docs-site/docs/getting-started.md`, `docs-site/docs/task-story-032-*.md`, `docs-site/docs/task-stories-overview.md`.
- [внешний репозиторий] `april-profile-1`: `docs-site/docs/task-story-032-*.md`, обновление `docs-site/docs/task-stories-overview.md`, `task_list.md`, `tasks/032-.../TASK.md` (чеклисты), `tasks/032-.../REPORT.md`.

## 3) Изменённые файлы

- `hub-shell/src/shell/shell-paths.ts`, `shell-paths.test.ts`
- `hub-shell/src/shell/hub-host-context.tsx`, `AuthorizedHubContent.tsx`, `shell-nav-config.ts`, `ShellBreadcrumbs.tsx`
- `hub-shell/src/widgets.tsx`
- `hub-shell/tests/e2e/smoke.spec.ts`
- `infra/keycloak/realm/april-realm.json`
- `scripts/run-playwright-aprilhub.sh`
- `docs/WIDGET_CONTRACTS.md`
- `docs-site/docs/getting-started.md`, `docs-site/docs/task-stories-overview.md`, `docs-site/docs/task-story-032-phase-4a-hub-conflicts-merge-host-rbac.md`
- `task_list.md`
- `tasks/029-aprilhub-execute-external-task-032-april-profile-1/PLAN.md`, `tasks/029-aprilhub-execute-external-task-032-april-profile-1/REPORT.md`
- В каталоге `april-profile-1` (соседний клон): `docs-site/docs/task-story-032-phase-4a-hub-conflicts-merge-host-rbac.md`, `docs-site/docs/task-stories-overview.md`, `task_list.md`, `tasks/032-phase-4a-hub-conflicts-merge-host-rbac/TASK.md`, `tasks/032-phase-4a-hub-conflicts-merge-host-rbac/REPORT.md` (коммиты `cdfb485`, `9fa3a34` — вынести на `feature/*` перед PR, если `develop` защищён)

## 4) Миграции и данные

- Миграции Atlas: нет
- Обратимость: да (реверт правок в репозиториях; при импорте realm — пересоздание тома Keycloak в dev)

## 5) Проверка качества

- Линтер (`hub-shell`): ok
- Сборка: не отдельно (tsc в lint)
- Unit tests (`hub-shell` vitest): ok
- `hub-bff` go test: ok
- E2E / smoke: ok (`DOCS_HTTP_PORT=18080 ./scripts/run-playwright-aprilhub.sh`)

Команды (фактически выполненные):

```bash
cd hub-shell && npm run lint && npm run test
cd hub-bff && go test ./...
DOCS_HTTP_PORT=18080 ./scripts/run-playwright-aprilhub.sh
```

## 6) Деплой

- Среда: нет
- Согласовано с: `docs/DEPLOYMENT_STRATEGY.md`
- Образы: не применялось
- Rollback: не применялся

## 7) Риски и ограничения

- Hub guard использует realm-роль **`admin`**; AprilProfile admin API дополнительно ожидает роль из `KEYCLOAK_ADMIN_REALM_ROLE` (часто **`april-profile-admin`**). При расхождении возможен **403 от upstream** при открытом доступе в shell — устраняется маппингом/composite roles в Keycloak, не обходом в UI.
- Host-экран не подключает npm-виджет `ConflictQueueWidget` (задача 031); это осознанный минимальный host-слой до выравнивания semver и lazy-load.

## 8) Что осталось

- [ ] Оформить PR в `april-worker` с test plan и рисками; при необходимости отдельный PR в `april-profile-1` только с docs/task REPORT (если политика репозитория требует разнесения).
- [ ] На dev: после merge импортировать обновлённый realm или вручную создать `april-user` и выдать `admin` пользователю, который ведёт админ-сценарии.

## 9) Дублирование отчёта

- [x] `april-profile-1/tasks/032-phase-4a-hub-conflicts-merge-host-rbac/REPORT.md`
- [x] этот файл (`tasks/029-aprilhub-execute-external-task-032-april-profile-1/REPORT.md`)
