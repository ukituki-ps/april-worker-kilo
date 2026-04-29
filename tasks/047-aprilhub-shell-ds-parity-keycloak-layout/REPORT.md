## 1) Итого

- Статус: ✅ выполнено (локальная интеграция и сборка; смок на dev-ingress ожидается при поднятом upstream без 502)
- Задача: AprilHub Shell — parity с `@april/ui` (Header / Sidebar), full-height layout, favicon Icon Only `#12B886`, выравнивание Keycloak favicon
- Ветка: `fix/047-aprilhub-shell-ds-parity`
- Коммиты: см. последний коммит на ветке `fix/047-aprilhub-shell-ds-parity`; подмодуль [`design-system/DisignApril`](../../design-system/DisignApril) зафиксирован на `5e03e27`.
- PR: не создавался

## 2) Что сделано

- [frontend `@april/ui`] Добавлены и экспортированы `ProductHeaderToolbar` и `ProductSidebarNavigation` по эталону разделов **2. Header** и **3. Sidebar** (`UIKit`); `HeaderSection` и `SidebarSection` переведены на эти блоки, код демо-сценариев упрощён.
- [frontend `hub-shell`] `AppShell` использует `ProductHeaderToolbar` (бренд «AprilHub», русские подписи поиска/подсказок, слот `ProfileAccountMenu`) и `ProductSidebarNavigation`; для скрытого заголовка сохранены тексты задачи через `VisuallyHidden` + `<h1>` (совместимость со smoke/e2e по тексту «Рабочая зона AprilHub»). Для иконки пункта «Профили» добавлен лёгкий SVG `ProfilesSidebarIcon` без зависимости `lucide-react`.
- [frontend `hub-shell`] Каркас на всю высоту viewport: `app-shell` — flex-колонка, `.shell-layout-fill` занимает оставшуюся высоту с прокруткой контента.
- [favicon / Keycloak] В `hub-shell/public/logo-icon.svg` задана заливка `#12B886`; синхронизированы `public/favicon.svg` и `infra/keycloak/themes/aprilhub/login/resources/img/favicon.svg`.
- [docs задачи] Заполнены `PLAN.md` и данный отчёт.

## 3) Изменённые файлы (основные)

- `design-system/DisignApril/packages/ui/src/components/ProductHeaderToolbar.tsx`
- `design-system/DisignApril/packages/ui/src/components/ProductSidebarNavigation.tsx`
- `design-system/DisignApril/packages/ui/src/components/HeaderSection.tsx`
- `design-system/DisignApril/packages/ui/src/components/SidebarSection.tsx`
- `design-system/DisignApril/packages/ui/src/index.ts`
- `hub-shell/src/app-shell.tsx`
- `hub-shell/src/app.css`
- `hub-shell/src/shell/shell-sidebar-icons.tsx`
- `hub-shell/public/logo-icon.svg`, `hub-shell/public/favicon.svg`
- `infra/keycloak/themes/aprilhub/login/resources/img/favicon.svg`
- `tasks/047-aprilhub-shell-ds-parity-keycloak-layout/PLAN.md`
- `tasks/047-aprilhub-shell-ds-parity-keycloak-layout/REPORT.md`

## 4) Миграции и данные

- Миграции Atlas: нет
- Изменений схемы БД: нет
- Обратимость: да (откат коммита в приложении и в подмодуле дизайн-системы)

## 5) Проверка качества

- Линтер (`hub-shell`): ok (`npm run lint`)
- Сборка `hub-shell`: ok (`npm run build`)
- Сборка `@april/ui`: ok (`npm run build` в `packages/ui`)
- Unit tests `hub-shell`: ok (`npm run test`, 10 тестов)
- E2E / smoke `./scripts/smoke-aprilhub.sh`: не получил успешное завершение в данной среде — оболочка на `http://localhost:8080` отвечает **502 Bad Gateway** на маршрут shell (нет здорового upstream за nginx для `hub-shell`); ранее пройдены блоки ingress health и проверки темы Keycloak login CSS.

Команды (фактически выполненные):

```bash
npm run build                                      # cwd: design-system/DisignApril/packages/ui
npm run lint && npm run test && npm run build       # cwd: hub-shell
./scripts/smoke-aprilhub.sh                        # cwd: april-worker — остановлен на 502 upstream shell
```

## 6) Деплой

- Среда: нет (локальная работа и коммиты)
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)

## 7) Риски и ограничения

- Подмодуль `design-system/DisignApril`: коммит `5e03e27` в `main` подмодуля; родительский репозиторий должен зафиксировать указатель подмодуля после `git submodule update`/push политики команды.
- В `hub-shell` не добавлен пакет `lucide-react` из‑за конфликта прав на дерево `node_modules/playwright` (каталог от root из Docker); иконки навигации реализованы локальным глифом, совместимым по месту под `NavLink`/иконку.
- Полное E2E и smoke против реального ingress нужно повторить на стенде, где `nginx` успешно проксирует `hub-shell` (без 502).

## 8) Что осталось

- [ ] При поднятом dev-контуре повторить `./scripts/smoke-aprilhub.sh` до зелёного статуса.
- [ ] Опционально: привести в порядок права на `hub-shell/node_modules/playwright` (или переустановку без root) и рассмотреть использование тех же иконок `lucide-react`, что в дизайн-системе, для профилевого пункта.
