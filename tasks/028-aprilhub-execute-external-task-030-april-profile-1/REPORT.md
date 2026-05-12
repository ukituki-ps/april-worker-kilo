## 1) Итого
- Статус: ✅ выполнено
- Задача: исполнение внешней задачи 030 из `april-profile-1` с двойным отчётом
- Ветка: `feature/aprilhub-phase-4a3-instance-history-host-e2e`
- Коммиты: `ad08248` (реализация), `40d8b85`, `71cf271`, `57f76f0` (актуализации REPORT/ссылки PR после push)
- PR: черновик сравнения (GitHub): https://github.com/ukituki-ps/april-worker-kilo

## 2) Что сделано
- [frontend] Добавлен host-экран истории экземпляра `InstanceHistoryHostWidget` в `hub-shell` (таймлайн версий, snapshot, diff, read-only режим).
- [frontend] Расширен shell-роутинг и IA для пути `/app/profile/instances/:instanceId/history`: маршруты, sidebar-пункт и breadcrumbs.
- [frontend] В `ProfileInstancesHostWidget` добавлено действие update (`PUT /api/v1/admin/profile/api/v1/entities/{id}`) для сценария "изменение -> новая версия".
- [tests] Обновлён Playwright smoke-сценарий: login -> instances -> update -> history -> проверка выбранной версии и diff.
- [infra/tooling] Стабилизирован `scripts/run-playwright-aprilhub.sh`: сначала поднимается Keycloak, ожидание JWKS через ephemeral `busybox` в сети compose, затем `hub-bff` (меньше race с инициализацией auth); увеличен запас ожидания health `hub-bff`.
- [docs] Обновлены `docs/WIDGET_CONTRACTS.md`, `docs-site/docs/task-stories-overview.md`, добавлена история `docs-site/docs/task-story-030-phase-4a-hub-instance-history-host-e2e.md`.
- [process] Для нетривиальной задачи создан `tasks/028-aprilhub-execute-external-task-030-april-profile-1/PLAN.md`.

## 3) Изменённые файлы
- `hub-shell/src/widgets.tsx`
- `hub-shell/src/shell/AuthorizedHubContent.tsx`
- `hub-shell/src/shell/shell-paths.ts`
- `hub-shell/src/shell/shell-nav-config.ts`
- `hub-shell/src/shell/ShellBreadcrumbs.tsx`
- `hub-shell/src/shell/hub-host-context.tsx`
- `hub-shell/tests/e2e/smoke.spec.ts`
- `scripts/run-playwright-aprilhub.sh`
- `docs/WIDGET_CONTRACTS.md`
- `docs-site/docs/task-stories-overview.md`
- `docs-site/docs/task-story-030-phase-4a-hub-instance-history-host-e2e.md`
- `task_list.md`
- `tasks/028-aprilhub-execute-external-task-030-april-profile-1/PLAN.md`
- `tasks/028-aprilhub-execute-external-task-030-april-profile-1/REPORT.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: нет изменений
- Обратимость: да (реверт изменений в `hub-shell`/`docs`/`docs-site`/`tasks`)

## 5) Проверка качества
- Линтер: ok
- Сборка: не запускалась отдельно
- Unit tests: ok
- Integration tests: не запускались (backend не менялся)
- E2E / smoke: ok (после стабилизации `scripts/run-playwright-aprilhub.sh`)

Команды (фактически выполненные):
```bash
cd hub-shell && npm run lint && npm run test
DOCS_HTTP_PORT=18080 ./scripts/run-playwright-aprilhub.sh
```

## 6) Деплой
- Среда: нет
- Согласовано с: `docs/DEPLOYMENT_STRATEGY.md`
- Образы: не применялось
- Health / readiness: подтверждены `hub-bff` `/healthz` (внутри контейнера и через ingress `/healthz`)
- Rollback: не применялся

## 7) Риски и ограничения
- Restore версии по-прежнему недоступен в текущем API-контракте; экран истории работает в read-only режиме.
- Первый прогон smoke мог падать из-за гонки: `hub-bff` стартовал до готовности Keycloak JWKS и уходил в restart loop с повторным `go mod download`; исправлено ожиданием JWKS в `scripts/run-playwright-aprilhub.sh`.

## 8) Что осталось
- [x] Ветка запушена в origin; осталось оформить PR (черновик сравнения см. в §1) с test plan и рисками.
- [x] Отчёт продублирован в `april-profile-1/tasks/030-phase-4a-hub-instance-history-host-e2e/REPORT.md` (ветка `feature/report-030-hub-instance-history` в репозитории `april-profile`).
