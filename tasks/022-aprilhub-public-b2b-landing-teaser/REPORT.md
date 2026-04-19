## 1) Итого

- Статус: ✅ выполнено
- Задача: Публичный B2B-лендинг-тизер (022) + UX шапки + блок «Экосистема April» (6 карточек Simple Info Card)
- Ветка: `feature/022-aprilhub-public-b2b-landing-teaser`
- Коммиты: `854c37c` (submodule `design-system/DisignApril`: `AprilProviders`); в родительском репозитории — последний коммит на `feature/022-aprilhub-public-b2b-landing-teaser` с сообщением `feat(hub-shell): theme switcher and dark mode for guest and shell`
- PR: не создавался

## 2) Что сделано

- [frontend] **Guest-лендинг (актуальная структура):** Hero, ICP и «Проблема рынка», блок экосистемы с карточками, безопасность, FAQ, footer; контент в `landing/content.ts`; единый `onStartLogin` → `keycloak.login()`; `AprilProductHeader` + `AprilProviders`; SEO в `index.html`.
- [frontend] **Тема и аккаунт:** меню профиля (`ProfileAccountMenu`, паттерн как в витрине DS): аватар + выпадающее меню с темой (светлая / тёмная / системная), входом или профилем/выходом; предпочтение темы — Mantine + localStorage.
- [design-system + hub-shell] **Блок «Экосистема April»:** **`AprilEcosystemSimpleCards`** — Simple Info Card + справа от заголовка **`Badge`** как в витрине §8 Badges (semantic: `color="gray"` для **Plan**, `color="blue"` для **In Progress** у **AprilProfile**). Витринный **`CardsSection`** использует те же данные. Статусы заданы в **`content.ts`** (`statusBadgeLabel`, `statusBadgeColor`).
- [frontend] **Упрощение guest-лендинга:** удалены секции «Карта возможностей», EDC отдельным блоком, «Этапы», «Текущий статус» (таблица), «Внедрение», «Прозрачность», финальный CTA+форма «Заявка на контакт». Навигация: Зачем · Экосистема · Безопасность · FAQ; вторичная кнопка Hero ведёт на `#faq`.
- [design-system] `AprilProviders`: значение по умолчанию **`defaultColorScheme = 'auto'`** (системная тема до явного выбора пользователя).
- [frontend] Тёмный режим для legacy-классов: переопределение `--april-*` в `april-tokens-fallback.css` под `[data-mantine-color-scheme="dark"]`; градиенты фона guest/authorized shell в `app.css` для тёмной схемы.
- [frontend] Тесты: `App.test.tsx` проверяет наличие `theme-scheme-control` на лендинге и в авторизованной зоне.

## 3) Изменённые файлы

- `design-system/DisignApril/packages/ui/src/index.ts` — экспорт `AprilEcosystemSimpleCards`, типы
- `design-system/DisignApril/packages/ui/src/components/AprilEcosystemSimpleCards.tsx` — новый
- `design-system/DisignApril/packages/ui/src/components/CardsSection.tsx` — использует `AprilEcosystemSimpleCards`
- `hub-shell/src/landing/content.ts` — блок экосистемы + навигация
- `hub-shell/src/landing/GuestB2BLanding.tsx` — секция `#ecosystem`
- `hub-shell/src/App.test.tsx`, `hub-shell/tests/e2e/smoke.spec.ts`
- `tasks/022-aprilhub-public-b2b-landing-teaser/REPORT.md`
- (ранее по 022) `providers.tsx`, `ProfileAccountMenu`, `app-shell`, `app.css`, `april-tokens-fallback.css` и др.

## 4) Миграции и данные

- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применялось
- Обратимость: да (revert коммитов; сброс темы — очистка ключа Mantine в localStorage при необходимости)

## 5) Проверка качества

- Линтер: ok (`npm --prefix hub-shell run lint`)
- Сборка: `vite build` на данной машине — **EACCES** при очистке `hub-shell/dist/` (права на артефакты); `tsc` и тесты проходят
- Unit tests: ok (`npm --prefix hub-shell run test`)
- Integration tests: не применялось
- E2E / smoke: unit-тесты обновлены; e2e сценарий входа: открытие меню профиля перед проверкой «Выйти»

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
