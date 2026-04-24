## 1) Итого
- Статус: ✅ выполнено
- Задача: исполнение внешней задачи 028 из `april-profile-1` с двойным отчётом
- Ветка: `develop` (локальная рабочая)
- Коммиты: не создавались в рамках этой сессии
- PR: не создавался

## 2) Что сделано
- [frontend] В `hub-shell` заменена заглушка маршрута `/app/profile/instances/:instanceId` на рабочий host-экран `ProfileInstancesHostWidget`.
- [frontend] Реализован BFF/OIDC flow для сценария экземпляров: загрузка по `instanceId` и create через `/api/v1/admin/profile/api/v1/entities`.
- [frontend] Обновлены shell-артефакты маршрутизации и UX: пункт навигации `Профиль — экземпляры`, breadcrumbs и модульный рендер в `AuthorizedHubContent`.
- [tests] Playwright smoke расширен e2e-сценарием: логин -> переход в раздел экземпляров -> create экземпляра через BFF -> проверка host callback `profile-instances-last-action`.
- [infra/tooling] Стабилизирован `scripts/run-playwright-aprilhub.sh`:
  - fallback на root-user, если `hub-shell/node_modules` или `node_modules/.bin` недоступны для записи;
  - подавлен шум `wget` при ожидании health (`2>/dev/null`);
  - экспортирован `VITE_PROFILE_INSTANCE_IDS` для e2e среды.
- [docs] Обновлены `docs/WIDGET_CONTRACTS.md`, `.env.example`, `docker-compose.yml`; добавлена история `docs-site/docs/task-story-028-phase-4a-hub-instances-host-routing-e2e.md`; обновлён `docs-site/docs/task-stories-overview.md`.
- [process] Для нетривиальной задачи создан и заполнен `tasks/027-aprilhub-execute-external-task-028-april-profile-1/PLAN.md`.

## 3) Изменённые файлы
- `.env.example`
- `docker-compose.yml`
- `scripts/run-playwright-aprilhub.sh`
- `hub-shell/src/widgets.tsx`
- `hub-shell/src/shell/AuthorizedHubContent.tsx`
- `hub-shell/src/shell/ShellBreadcrumbs.tsx`
- `hub-shell/src/shell/shell-nav-config.ts`
- `hub-shell/tests/e2e/smoke.spec.ts`
- `docs/WIDGET_CONTRACTS.md`
- `docs-site/docs/task-stories-overview.md`
- `docs-site/docs/task-story-028-phase-4a-hub-instances-host-routing-e2e.md`
- `tasks/027-aprilhub-execute-external-task-028-april-profile-1/PLAN.md`
- `tasks/027-aprilhub-execute-external-task-028-april-profile-1/REPORT.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: нет изменений
- Обратимость: да (реверт изменений в `hub-shell`/`docs`/`scripts`)

## 5) Проверка качества
- Линтер: ok
- Сборка: не запускалась отдельно
- Unit tests: ok
- Integration tests: не запускались (backend не менялся)
- E2E / smoke: ok

Команды (фактически выполненные):
```bash
cd hub-shell && npm run lint && npm run test
DOCS_HTTP_PORT=18080 ./scripts/run-playwright-aprilhub.sh
```

## 6) Деплой
- Среда: нет
- Согласовано с: `docs/DEPLOYMENT_STRATEGY.md`
- Образы: не применялось
- Health / readiness: в smoke подтверждены `hub-bff` health-check внутри контейнера и ingress-доступность перед запуском Playwright
- Rollback: не применялся

## 7) Риски и ограничения
- Host-реализация виджета экземпляров сейчас локальная в `hub-shell`; после публикации внешнего пакетного виджета из `april-profile-1` потребуется синхронизация.
- Для запуска smoke нужен свободный порт `DOCS_HTTP_PORT`; при занятом `8080` требуется альтернативный порт (например `18080`).

## 8) Что осталось
- [ ] Создать commit(ы) и PR в рабочую ветку `feature/*`/`fix/*` с test plan и рисками.
- [x] Отчёт продублирован в `april-profile-1/tasks/028-phase-4a-hub-instances-host-routing-e2e/REPORT.md`.
