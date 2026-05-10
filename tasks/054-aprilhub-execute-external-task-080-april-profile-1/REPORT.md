## 1) Итого

- Статус: ✅ выполнено (локальный `hub-shell` gate без GPR-токена не прогонялся — см. §5)
- Задача: Внешняя **080** — mobile chrome AprilHub, bump `vendor/april-profile`, Playwright mobile smoke
- Ветка: `feature/054-hub-mobile-chrome-080`
- Коммиты: **`ffed478`** (tip ветки april-worker); submodule **`vendor/april-profile`** на **`1cb81d2`** (`develop` + `ProfilesApiWidget` + отчёт **080**)
- PR: не создавался из этой сессии — открыть в `april-worker` и при необходимости отдельный PR в `april-profile` на коммиты `101a802`…`1cb81d2` (или cherry-pick патча `ProfilesApiWidget`)

## 2) Что сделано

- **[frontend / hub-shell]** На `(max-width: 47.99em)` скрыт `ProductSidebarNavigation`, добавлен глобальный dock **`AprilMobileShellBar`** (`HubMobilePrimaryDock`: ссылки «Профили» / «Шаблоны»), отступ основной области через **`aprilMobileShellBarContentPaddingBottom()`** (`app-shell.tsx`).
- **[frontend / hub-shell]** Для **`ProfilesWidget`** на узком viewport: **`cardListColumnMobileLayout="off"`**, чтобы не было второй нижней капсулы у списка при активном host-dock (ADR-0006 / чеклист интеграции). Тип **`ProfilesWidgetProps`** расширен полем `cardListColumnMobileLayout`.
- **[frontend / hub-shell]** Playwright: проект **`mobile-chromium`** (`Pixel 5`) с `testMatch` на **`profile-widgets-smoke.spec.ts`**.
- **[frontend / hub-shell]** CSS: стек toast сдвинут вверх на mobile над глобальной панелью (`app.css`).
- **[vendor / april-profile]** **`ProfilesApiWidget`**: проброс `...coreProps` в **`ProfilesWidgetCore`** (иначе host не мог задавать `cardListColumnMobileLayout` и др.).
- **[docs / задачи]** `PLAN.md`, зеркальный **`vendor/april-profile/tasks/080-external-april-worker-hub-mobile-chrome-e2e/REPORT.md`**.

## 3) Изменённые файлы

- `hub-shell/src/app-shell.tsx`
- `hub-shell/src/app.css`
- `hub-shell/src/shell/HubMobilePrimaryDock.tsx`
- `hub-shell/src/widgets.tsx`
- `hub-shell/src/integrations/april-profile-ui.ts`
- `hub-shell/playwright.config.ts`
- `vendor/april-profile` (submodule: `frontend/packages/profile-ui/src/components/ProfilesApiWidget.tsx`, `tasks/080-external-april-worker-hub-mobile-chrome-e2e/REPORT.md`)
- `tasks/054-aprilhub-execute-external-task-080-april-profile-1/PLAN.md`
- `tasks/054-aprilhub-execute-external-task-080-april-profile-1/REPORT.md`
- `task_list.md`

## 4) Миграции и данные

- Миграции Atlas: нет

## 5) Проверка качества

- Линтер OpenAPI: ok (`make openapi-lint`)
- Hub BFF unit tests: ok (`cd hub-bff && go test ./...`)
- Hub Shell: **`npm ci`** в этом окружении — **fail (401/403 GPR)** без валидного `NODE_AUTH_TOKEN` с **`read:packages`**; ожидается зелёный job **hub-shell** на CI.

Команды (фактически выполненные / рекомендуемые):

```bash
make openapi-lint
cd hub-bff && go test ./...
cd hub-shell && npm ci && npm run lint && npm run test && npm run build
cd hub-shell && npm run e2e:install && npm run e2e -- --project=mobile-chromium
```

## 6) Деплой

- Среда: нет (не входило в задачу)
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)

## 7) Риски и ограничения

- **079** в upstream `april-profile` мог оставаться открытым; интеграция опирается на уже vendored `profile-ui` и DS **0.1.9**. При merge **079** — перепроверить mobile master–detail и при необходимости уточнить host-dock (immersive на отдельных маршрутах).
- Патчи в **`vendor/april-profile`** (`101a802`, `1cb81d2`) нужно **запушить** в `ukituki-ps/april-profile`, иначе submodule в april-worker укажет на недоступный коммит для других клонов.
- Список профилей на mobile в Hub с **`mobileLayout="off"`** использует «десктопный» тулбар колонки в карточке контента — осознанный обмен в пользу одной нижней капсулы уровня приложения.

## 8) Что осталось

- [ ] Открыть PR в **april-worker**; убедиться в зелёном CI (hub-shell + e2e).
- [ ] Запушить коммиты submodule в **april-profile** или заменить указатель на эквивалентный merge в `develop`.
- [ ] Опционально по **080**: ссылка из docs-site `task-story-074` во внешнем репо.
