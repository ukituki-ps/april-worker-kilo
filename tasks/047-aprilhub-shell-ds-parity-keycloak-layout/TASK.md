# Задача: AprilHub Shell — parity с эталонными компонентами `@april/ui` (Header / Sidebar), полная высота layout, восстановление Keycloak login

## Мета
- **ID / ветка:** `047-aprilhub-shell-ds-parity-keycloak-layout`
- **Приоритет:** высокий
- **Связанные документы / контекст:** [`tasks/013-aprilhub-design-system-integration-showcase/TASK.md`](../013-aprilhub-design-system-integration-showcase/TASK.md), [`tasks/014-aprilhub-keycloak-design-system-alignment/TASK.md`](../014-aprilhub-keycloak-design-system-alignment/TASK.md), [`tasks/015-aprilhub-authorized-shell-standard-layout/TASK.md`](../015-aprilhub-authorized-shell-standard-layout/TASK.md), [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](../../docs/AGENT_ARCHITECTURE_CONTEXT.md), [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)

## Цель
Привести внешний вид и каркас авторизованной зоны `hub-shell` к эталонным реализациям в пакете **DisignApril / `@april/ui`**. В исходниках дизайн-системы справочная страница **`UIKit`** задаёт нумерацию разделов «**2. Header**» и «**3. Sidebar**» (см. файл [`design-system/DisignApril/packages/ui/src/components/UIKit.tsx`](../../design-system/DisignApril/packages/ui/src/components/UIKit.tsx)). Соответствующие **эталонные компоненты**:
- **`HeaderSection`** — [`HeaderSection.tsx`](../../design-system/DisignApril/packages/ui/src/components/HeaderSection.tsx) (поиск по центру, иконки сообщений/уведомлений «колокольчик»/help, меню пользователя).
- **`SidebarSection`** — [`SidebarSection.tsx`](../../design-system/DisignApril/packages/ui/src/components/SidebarSection.tsx) (схлопывание до 60px, `NavLink` + иконки lucide, секции, нижний Settings).

Нужно воспроизвести **эту** композицию и поведение в `hub-shell` (без самодельной альтернативной шапки/сайдбара), обеспечить **заполнение всей высоты viewport** каркасом `shell-header` + остальной зоной (`shell-layout`), параллельно вернуть **регресс по стилизации страниц входа Keycloak** (как после этапа `014`, без «голого» Keycloak UI).

**Реализация в коде:** предпочтительно **использовать те же модули**, что и дизайн-система — т.е. вынести `HeaderSection` / `SidebarSection` в публичные экспорты [`design-system/DisignApril/packages/ui/src/index.ts`](../../design-system/DisignApril/packages/ui/src/index.ts) (сейчас из пакета официально экспортируется `UIKit`, а header/sidebar живут только как внутренние секции) и импортировать их в `hub-shell` с подстановкой продуктовых данных (название зоны, пункты навигации, меню аккаунта). Допустим обёрточный компонент-адаптер в `hub-shell`, если без него нельзя связать маршруты, но **разметка и стилистика** должны совпадать с `HeaderSection` / `SidebarSection`, а не повторять их «с нуля».

Задача **логически разбита на пять подработ** (можно выполнять в одном PR или цепочкой PR после согласования порядка в `PLAN.md`):

1. **Favicon** — взять из дизайн-системы вариант **Icon Only**, цвет брендового знака **`#12B886`**; подключить в `hub-shell` (мета-теги / сборка статики как принято во Vite).
2. **Keycloak login UX** — выяснить причину исчезновения темы и **восстановить** пользовательские login/auth страницы в том же качестве, что зафиксировано в задаче `014` (скрин/smoke-доказательства до/после при необходимости).
3. **Header из дизайн-системы** — заменить текущий кастомный `hub-shell` header на компонент **`HeaderSection`** из `@april/ui` (раздел **«2. Header»** на странице `UIKit`: [`UIKit.tsx`](../../design-system/DisignApril/packages/ui/src/components/UIKit.tsx) → [`HeaderSection.tsx`](../../design-system/DisignApril/packages/ui/src/components/HeaderSection.tsx)): логотип + имя продукта слева, глобальный поиск по центру, справа ActionIcon (сообщения, уведомления с `Indicator`, помощь) и `Menu` пользователя с `Avatar`. Отступление от этой композиции не допускается без явного ADR/issue; строки/колбэки связать с текущим аккаунт-меню Keycloak и заглушками, где нет бэкенда.
4. **Полная высота shell** — `shell-header` + область ниже должны суммарно занимать **100% высоты viewport** (типично: колоночный flex на `main.app-shell`, `min-height: 100vh`, `shell-layout`/`shell-content` с `flex: 1` и `min-height: 0` для корректного overflow); убрать ощущение «обрубленной» нижней зоны при коротком контенте.
5. **Sidebar из дизайн-системы** — заменить текущий `shell-nav` на компонент **`SidebarSection`** из `@april/ui` (раздел **«3. Sidebar»** на странице `UIKit`: [`UIKit.tsx`](../../design-system/DisignApril/packages/ui/src/components/UIKit.tsx) → [`SidebarSection.tsx`](../../design-system/DisignApril/packages/ui/src/components/SidebarSection.tsx)): управляемая ширина (в эталоне 250/220px vs **60px** в схлопнутом виде), `ScrollArea`, пункты на **`NavLink`** с **`leftSection`‑иконками** (lucide), опционально бейджи, секции через подписи/`Divider`, внизу Settings. Поведение **схлопывания** (`collapsed` state + кнопка Chevron как в эталоне) обязательно. Продуктовые пункты навигации/host-маршруты подставить вместо демонстрационного списка (смежные задачи `042`/`045` — если актуальны для выбранного контура).

## Контекст для агента
- Основная реализация shell: `@hub-shell/src/app-shell.tsx`, `@hub-shell/src/app.css`, связанные компоненты shell/header/sidebar.
- Тема Keycloak: каталоги в `infra/keycloak` (см. отчёт `014`) и способ подключения в `docker-compose` / realm.
- Эталон UI в пакете дизайн-системы: `UIKit` (`@april/ui`), секции **2 → `HeaderSection`**, **3 → `SidebarSection`** — пути выше; отдельное приложение `@april/showcase` из задачи `013` строится на том же монорепо, но **источник истины по верстке** для этой задачи — указанные **TSX-модули** в `packages/ui`.
- Интеграция UI: Mantine + `@april/ui` уже используются в `hub-shell` — сохранять согласованность импортов, `AprilProviders`, `useDensity`.

## Входит в объём
- Подключение favicon/branding-маркера из источника дизайн-системы (`#12B886`, Icon Only).
- Диагностика и восстановление Keycloak login theme (CSS/HTML resources, монтирование в compose, корректные пути в realm), без изменения протоколов OIDC.
- Полная замена кастомного header/sidebar на **`HeaderSection`** и **`SidebarSection`** (или их обёртки с тем же DOM/стилем после выноса в публичный API пакета `packages/ui`).
- Верстка высоты каркаса: header + нижний блок во всю высоту окна; осмысленный overflow в контентной колонке при длинных страницах.
- Обновление/дополнение юнит-тестов под новые текстовые маркеры/ARIA/`data-testid`, если они меняются.
- Отчёт: `PLAN.md` (при необходимости порядка работ) и `REPORT.md` по шаблону репозитория.

## Не входит в объём
- Изменение бизнес-логики авторизации на бэкенде или правил RBAC Keycloak (кроме путей к теме/UI).
- Реальная функциональность поиска/уведомлений на бэкенде — допускаются кнопки-заглушки или no-op при сохранении UI как в `HeaderSection`.
- Крупная смена информационной архитектуры или списка разделов (это отдельные задачи), кроме адаптации к API сайдбара из дизайн-системы.

## Технические ограничения
- Стек: React + TypeScript + Vite, Mantine, дизайн-система `@april/ui` — приоритет у **`HeaderSection` / `SidebarSection`** (и их зависимостей: lucide-иконки, токены Mantine) над кастомным CSS.
- Keycloak: пользовательские тексты на русском; не коммитить секреты; изменения темы должны быть воспроизводимы через существующий compose/deploy-паттерн.
- Не ломать `./scripts/smoke-aprilhub.sh` и общий вход guest → login → authorized; при правках маркеров smoke — синхронно обновить скрипт.
- После задачи видимые отличия header/sidebar от композиции **`HeaderSection` / `SidebarSection`** (разделы **2** и **3** в `UIKit`) считаются дефектом приёмки (допускается только содержание подписей/пунктов меню и привязка к маршрутам как в продукте).

## Критерии готовности (acceptance)
- [ ] В браузере на страницах `hub-shell` отображается favicon Icon Only цвета `#12B886` из дизайн-системы (проверка devtools Network + вкладка).
- [ ] Экран логина Keycloak снова визуально согласован с дизайн-системой (нет «дефолтного» Keycloak на типичном login-flow); `./scripts/smoke-aprilhub.sh` зелёный или обновлён осознанно с фиксацией в `REPORT.md`.
- [ ] Header авторизованной зоны **визуально и по композиции** соответствует **`HeaderSection`** (раздел **2** в `UIKit`); подключение через публичный импорт из `@april/ui` после выноса в `index.ts` либо эквивалент с явной ссылкой в `REPORT.md`, почему структура совпадает 1:1.
- [ ] `shell-header` вместе с областью ниже занимают полную высоту viewport без «висящего» пустого пространства снизу при коротком контенте; длинный контент прокручивается корректно (в том числе в сайдбаре/контенте — по дизайн-системе).
- [ ] Sidebar соответствует **`SidebarSection`** (раздел **3** в `UIKit`): **схлопывание** (в т.ч. 60px icon-only), **иконки** у пунктов (`NavLink` + `leftSection`); подключение через `@april/ui` как для header.
- [ ] `npm --prefix hub-shell run build` и `npm --prefix hub-shell run test` проходят.
- [ ] В `REPORT.md` зафиксированы: использование **`HeaderSection` / `SidebarSection`** (и изменения в `packages/ui/src/index.ts`, если были), список затронутых файлов, скрин или краткое описание проверки Keycloak, риски/follow-up.

## Проверка (команды)
```bash
npm --prefix hub-shell run build
npm --prefix hub-shell run test
./scripts/smoke-aprilhub.sh
# при работе с Keycloak theme:
docker compose --profile aprilhub config
docker compose up -d keycloak
```

## Результат в отчёте
По [`docs/AGENT_REPORT_TEMPLATE.md`](../../docs/AGENT_REPORT_TEMPLATE.md): что изменено, как проверено (включая Keycloak и full-height layout), ограничения и возможные follow-up (например полноценный backend для уведомлений/поиска).
