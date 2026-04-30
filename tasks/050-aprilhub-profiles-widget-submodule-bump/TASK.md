# Задача 050: обновление внешнего `profiles-widget` в AprilHub (submodule + выкладка)

## Мета

- **ID / ветка:** `050-aprilhub-profiles-widget-submodule-bump`
- **Приоритет:** обычный (повторяемая операционная задача при релизах `april-profile`)
- **Тип:** интеграция внешнего репозитория + при необходимости правки deploy/runtime
- **Связанные документы:**
  - [`task_list.md`](../../task_list.md)
  - [`tasks/042-aprilhub-profiles-widget-sidebar-integration/TASK.md`](../042-aprilhub-profiles-widget-sidebar-integration/TASK.md)
  - [`tasks/045-aprilhub-sidebar-profiles-widget-section/TASK.md`](../045-aprilhub-sidebar-profiles-widget-section/TASK.md)
  - [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)
  - [`docs/runbooks/APRILHUB_4A_WIDGET_RELEASE_GATE.md`](../../docs/runbooks/APRILHUB_4A_WIDGET_RELEASE_GATE.md)
  - [`hub-shell/vite.config.ts`](../../hub-shell/vite.config.ts) (alias `@april/profile-ui-external` → `vendor/april-profile/.../profile-ui`)
  - [`hub-shell/src/integrations/april-profile-ui.ts`](../../hub-shell/src/integrations/april-profile-ui.ts)
  - [`deploy.sh`](../../deploy.sh) (`run_submodules`, `sync_frontend_dependencies`)

## Цель

Зафиксировать и воспроизводимо выполнять обновление UI **`profiles-widget`** в Hub после изменений во внешнем репозитории **`april-profile`** (`frontend/packages/profile-ui`): обновить git submodule `vendor/april-profile`, прогнать качество `hub-shell`, при необходимости обеспечить корректную перезагрузку Vite/контейнера на dev и задокументировать контрактные риски (semver, breaking props).

## Контекст для агента

- В `april-worker` виджет подключается не как отдельная npm-зависимость в текущем baseline, а через **submodule** `vendor/april-profile` и Vite-alias на исходники пакета `profile-ui` (см. `hub-shell/vite.config.ts`).
- Команда в upstream должна сначала влить изменения в **`april-profile`** (целевая ветка submodule в `.gitmodules` — **`develop`**).
- **Deploy to dev** выкатывает **коммит `april-worker`** и выполняет `git submodule update` до SHA, **записанного в этом коммите**; он не подтягивает «последний» `april-profile` без bump submodule в родительском репозитории.
- Известный operational gap: `deploy.sh` пересоздаёт сервис `hub-shell` при смене lock-файла или git-tree каталога `hub-shell/`, но **не** при изменении только указателя submodule `vendor/april-profile` — после деплоя может потребоваться **`docker compose up -d --force-recreate hub-shell`** (или эквивалент), чтобы процесс Vite перечитал внешний модуль.
- При появлении в `hub-shell` зависимости `@april/profile-ui` из registry — действует semver-гейт: `hub-shell/scripts/check-april-profile-ui-semver.mjs` и [`APRILHUB_4A_WIDGET_RELEASE_GATE.md`](../../docs/runbooks/APRILHUB_4A_WIDGET_RELEASE_GATE.md).

## Входит в объём

- Обновить submodule: `vendor/april-profile` → согласованный коммит внешнего репозитория (обычно `develop` после merge фичи с виджетом).
- Закоммитить **новый указатель submodule** в `april-worker` (один коммит или атомарно с сопутствующими правками).
- Локально: `cd hub-shell && npm run ds:prepare && npm run lint && npm run test && npm run build` (или актуальный quality gate из [`README.md`](../../README.md)).
- Проверить, что интеграционный слой [`hub-shell/src/integrations/april-profile-ui.ts`](../../hub-shell/src/integrations/april-profile-ui.ts) и типы [`hub-shell/src/types/april-profile-ui-external.d.ts`](../../hub-shell/src/types/april-profile-ui-external.d.ts) согласованы с экспортом `ProfilesWidget` (при breaking changes — правки host props/callbacks в [`hub-shell/src/widgets.tsx`](../../hub-shell/src/widgets.tsx)).
- При необходимости: одна целевая правка **`deploy.sh`** или документации, чтобы bump только `vendor/april-profile` стабильно приводил к перезапуску `hub-shell` на dev (без ручного шага) — только если подтверждена проблема на стенде.
- Кратко зафиксировать в `REPORT.md`: целевой SHA `april-profile`, ссылка на PR/issue во внешнем репо, результат проверок.

## Не входит в объём

- Разработка самого виджета во внешнем репозитории (только потребление обновлённого артефакта).
- Полный переход с submodule на npm registry — см. эпик [`049`](../049-april-ds-registry-consumption-epic/TASK.md) и задачи по `@april/profile-ui`.
- Расширение BFF/OpenAPI, если контракт API не менялся во внешнем релизе.

## Технические ограничения

- Не коммитить секреты; SSH для submodule на CI описан в [`DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md) (`APRIL_PROFILE_DEPLOY_KEY`).
- Сохранять совместимость с контрактом [`docs/WIDGET_CONTRACTS.md`](../../docs/WIDGET_CONTRACTS.md) по возможности; при изменении контракта — явная заметка в отчёте и согласование с задачами 042/045.

## Критерии готовности (acceptance)

- [ ] В `april-worker` зафиксирован новый коммит submodule `vendor/april-profile`, соответствующий согласованному релизу виджета во внешнем репо.
- [ ] `hub-shell`: `npm run lint`, `npm run test`, `npm run build` проходят на чистом дереве после `git submodule update --init`.
- [ ] Задокументировано (в `REPORT.md` задачи): внешний коммит/PR, отсутствие или наличие правок host-слоя при breaking API виджета.
- [ ] Для dev-стенда: либо подтверждено, что после **Deploy to dev** UI подтягивает новую версию, либо описан и выполнен явный шаг перезапуска `hub-shell` / зафиксирован follow-up на автоматизацию в `deploy.sh`.

## Проверка (команды)

```bash
# из корня april-worker
git submodule update --init --recursive vendor/april-profile
cd hub-shell && npm ci && npm run ds:prepare && npm run lint && npm run test && npm run build
```

При необходимости smoke e2e (см. [`tasks/042-aprilhub-profiles-widget-sidebar-integration/REPORT.md`](../042-aprilhub-profiles-widget-sidebar-integration/REPORT.md)):

```bash
cd hub-shell && npm run e2e:smoke
```

## Результат в отчёте

По [`docs/AGENT_REPORT_TEMPLATE.md`](../../docs/AGENT_REPORT_TEMPLATE.md): SHA submodule, ссылки на внешний PR, список изменённых файлов в `april-worker`, замечания по deploy и контракту виджета.
