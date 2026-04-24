## 1) Итого
- Статус: ✅ выполнено
- Задача: исполнение внешней задачи 026 из `april-profile-1` с двойным отчётом
- Ветка: `026-aprilhub-align-docs-with-april-profile-design-system-approach` (текущая рабочая)
- Коммиты: не создавались в рамках этой сессии
- PR: не создавался

## 2) Что сделано
- [frontend] В `hub-shell` добавлен host-экран списка профилей (`/app/profile/entities`) и встраивание `ProfilesListWidget` из локального пакета AprilProfile (`../april-profile-1/frontend/packages/profile-ui/dist`).
- [frontend] Добавлен host callback для `onAction`/`onError` и отображение результата CRUD-действия (`profiles-list-last-action`).
- [frontend] Маршрутизация и навигация shell расширены отдельным пунктом `Профиль — список`; сохранён существующий экран карточки сущности.
- [tests] Playwright smoke расширен сценарием: логин -> переход в `Профиль — список` -> create профиля через BFF-префикс `/api/v1/admin/profile/api`.
- [docs] Обновлены runtime env и гайды: `.env.example`, `docker-compose.yml`, `scripts/run-playwright-aprilhub.sh`, `docs-site/docs/getting-started.md`.
- [docs/tooling] В `scripts/run-playwright-aprilhub.sh` добавлены стабилизации smoke-run:
  - fallback на `LOCAL_UID=0`, `LOCAL_GID=0` при `EACCES` в `hub-shell/node_modules`;
  - ожидание `hub-bff` health напрямую внутри контейнера перед ingress-check;
  - запуск только необходимых сервисов (без `april-showcase`);
  - экспорт `KC_HOSTNAME`/`KEYCLOAK_ISSUER` под локальный `PLAYWRIGHT_BASE_URL`.
- [infra] Для docker runtime добавлен mount `../april-profile-1:/april-profile-1:ro`, чтобы `hub-shell` в контейнере видел локальный пакет виджета.
- [infra] Для `hub-bff` включён workspace cache (`/workspace/.cache/go-*`), чтобы снизить cold-start на `go mod download`.
- [docs-site] Добавлена обязательная история `docs-site/docs/task-story-026-phase-4a-hub-profiles-list-host-bff-flow.md`; индекс `task-stories-overview.md` обновлён.

## 3) Изменённые файлы
- `hub-shell/src/widgets.tsx`
- `hub-shell/src/shell/shell-paths.ts`
- `hub-shell/src/shell/shell-paths.test.ts`
- `hub-shell/src/shell/shell-nav-config.ts`
- `hub-shell/src/shell/ShellBreadcrumbs.tsx`
- `hub-shell/src/shell/AuthorizedHubContent.tsx`
- `hub-shell/src/vite-env.d.ts`
- `hub-shell/tests/e2e/smoke.spec.ts`
- `.env.example`
- `docker-compose.yml`
- `scripts/run-playwright-aprilhub.sh`
- `docs-site/docs/getting-started.md`
- `docs-site/docs/task-stories-overview.md`
- `docs-site/docs/task-story-026-phase-4a-hub-profiles-list-host-bff-flow.md`
- `tasks/026-aprilhub-align-docs-with-april-profile-design-system-approach/REPORT.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: нет изменений
- Обратимость: да (откат — удаление/реверт изменений shell/docs)

## 5) Проверка качества
- Линтер: ok (`cd hub-shell && npm run lint`)
- Сборка: не запускалась отдельно (в рамках сессии)
- Unit tests: ok (`cd hub-shell && npm run test`)
- Integration tests: не запускались
- E2E / smoke: ok (`./scripts/run-playwright-aprilhub.sh` -> `6 passed`)

Команды (фактически выполненные):
```bash
cd hub-shell && npm run lint
cd hub-shell && npm run test
./scripts/run-playwright-aprilhub.sh
DOCS_HTTP_PORT=18080 ./scripts/run-playwright-aprilhub.sh
```

## 6) Деплой
- Среда: нет
- Согласовано с: `docs/DEPLOYMENT_STRATEGY.md`
- Образы: не применялось
- Health / readiness: проверка по ingress пройдена в финальном прогоне (`/healthz`, `/` доступны перед запуском Playwright)
- Rollback: не применялся

## 7) Риски и ограничения
- Интеграция `ProfilesListWidget` пока локальная (из соседнего репозитория `april-profile-1`) до публикации пакета в registry.

## 8) Что осталось
- [x] Перезапустить e2e/smoke после стабилизации ingress и зафиксировать успешный прогон list+CRUD.
- [x] Синхронизировать итоговый отчёт по задаче 026 в `april-profile-1/tasks/026-phase-4a-hub-profiles-list-host-bff-flow/REPORT.md`.
