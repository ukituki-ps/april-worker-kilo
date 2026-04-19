## 1) Итого

- Статус: ✅ выполнено
- Задача: Публичный B2B-лендинг-тизер (022) + тёмная тема и переключатель темы в шапке (светлая / тёмная / системная)
- Ветка: `feature/022-aprilhub-public-b2b-landing-teaser`
- Коммиты: `6541a2e` (родительский репозиторий), `854c37c` (submodule `design-system/DisignApril`: `AprilProviders`)
- PR: не создавался

## 2) Что сделано

- [frontend] **Задача 022 (базовая поставка):** Guest-зона — B2B-тизер (Hero, ICP, карта контуров + AprilEDC, этапы, статус, внедрение, безопасность, FAQ, форма, footer); sticky-навигация; единый `onStartLogin` → `keycloak.login()`; контент в `landing/content.ts`; лид-форма — `mailto:`; `AprilProductHeader` + `AprilProviders` / `createAprilTheme()`; SEO в `index.html`.
- [frontend] **Тема:** компонент `ThemeSchemeControl` (`SegmentedControl`: Светлая / Тёмная / Системная) в шапке гостевого лендинга (`GuestB2BLanding`) и в `AppShell` для авторизованной зоны; предпочтение сохраняется стандартным менеджером Mantine (localStorage).
- [design-system] `AprilProviders`: значение по умолчанию **`defaultColorScheme = 'auto'`** (системная тема до явного выбора пользователя).
- [frontend] Тёмный режим для legacy-классов: переопределение `--april-*` в `april-tokens-fallback.css` под `[data-mantine-color-scheme="dark"]`; градиенты фона guest/authorized shell в `app.css` для тёмной схемы.
- [frontend] Тесты: `App.test.tsx` проверяет наличие `theme-scheme-control` на лендинге и в авторизованной зоне.

## 3) Изменённые файлы

- `design-system/DisignApril/packages/ui/src/providers.tsx` (submodule)
- `hub-shell/src/theme/ThemeSchemeControl.tsx`
- `hub-shell/src/landing/GuestB2BLanding.tsx`
- `hub-shell/src/app-shell.tsx`
- `hub-shell/src/app.css`
- `hub-shell/src/styles/april-tokens-fallback.css`
- `hub-shell/src/App.test.tsx`
- `tasks/022-aprilhub-public-b2b-landing-teaser/REPORT.md`

## 4) Миграции и данные

- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применялось
- Обратимость: да (revert коммитов; сброс темы — очистка ключа Mantine в localStorage при необходимости)

## 5) Проверка качества

- Линтер: ok (`npm --prefix hub-shell run lint`)
- Сборка: не прогонялся полный `vite build` в этой сессии (при проблемах прав на `dist/` см. DEPLOYMENT/ранее отчёт)
- Unit tests: ok (`npm --prefix hub-shell run test`)
- Integration tests: не применялось
- E2E / smoke: не перезапускались в этой сессии

Команды (фактически выполненные):

```bash
cd /home/ukituki/april-worker/design-system/DisignApril/packages/ui && npm run build
cd /home/ukituki/april-worker/hub-shell && npm run lint && npm run test
```

## 6) Деплой

- Среда: нет
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)
- Образы: не применялось
- Health / readiness: не применялось
- Rollback: нет

## 7) Риски и ограничения

- **Submodule:** изменение `DisignApril` требует согласованного push submodule + ссылки в родительском репозитории.
- **Узкая ширина экрана:** трёхсегментный переключатель в шапке может переноситься (`Group`/`wrap`); при необходимости — отдельная компактная раскладка (иконки / меню).
- **Сборка DS в CI:** `ds:prepare` собирает витрину; при read-only `node_modules` в DS убедиться, что образы CI собирают `@april/ui` после изменений исходников.

## 8) Что осталось

- [ ] Backend для приёма лидов (приоритет продукта)
- [ ] Прогнать `npm --prefix hub-shell run build` и e2e на стенде/CI
- [ ] При необходимости — донастройка контрастов/токенов тёмной темы по ревью дизайна
