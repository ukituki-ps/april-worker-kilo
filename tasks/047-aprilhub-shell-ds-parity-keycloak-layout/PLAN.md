# План: AprilHub Shell — parity с `@april/ui` Header/Sidebar и full-height layout

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-29
- **Статус плана:** выполнен

## Исходные допущения

- Эталон визуала — разделы **2. Header** и **3. Sidebar** в `UIKit` (`packages/ui/src/components/UIKit.tsx`).
- Публичные переиспользуемые блоки вынесены в `ProductHeaderToolbar` и `ProductSidebarNavigation`; `HeaderSection` / `SidebarSection` остаются демо-секциями витрины.
- В `hub-shell` для иконки пункта навигации используется локальный глиф без добавления зависимости `lucide-react` (конфликт прав при `npm install` из-за `playwright`, установленного от root).

## Порядок работ (фактический)

1. Добавлены `ProductHeaderToolbar` и `ProductSidebarNavigation` в `@april/ui`, экспорт в `index.ts`, рефакторинг `HeaderSection` / `SidebarSection` под использование общих блоков.
2. `hub-shell`: `AppShell` переведён на новые компоненты + `VisuallyHidden` с `<h1>` для доступности smoke/e2e; обновлены стили `.app-shell` / `.shell-layout-fill`.
3. Favicon Icon Only `#12B886`: `fill="#12B886"` в `public/logo-icon.svg`, синхронизация в `public/favicon.svg` и Keycloak-тему.
4. Проверка: `hub-shell` lint / test / build.

## Затрагиваемые области

| Область        | Изменения |
|----------------|-----------|
| Frontend `@april/ui` | Новые компоненты полосы заголовка и сайдбара, правки секций UIKit |
| Frontend `hub-shell` | Интеграция shell, обновление `app.css`, иконки сайдбара |
| infra Keycloak theme | Обновление `themes/aprilhub/login/resources/img/favicon.svg` |

## Риски и откат

- **Smoke 502 при отсутствии upstream nginx/hub-shell** — см. REPORT; код не блокируется, стенд поднимает сервисы отдельно.
- Откат: вернуть `app-shell.tsx` / CSS к предыдущему layout и удалить экспорты в `@april/ui`.

## Проверка после выполнения

- `npm --prefix hub-shell run lint`
- `npm --prefix hub-shell run test`
- `npm --prefix hub-shell run build`
- `npm --prefix design-system/DisignApril/packages/ui run build`
- `./scripts/smoke-aprilhub.sh` (при живом ingress и hub-shell без 502 — см. отчёт)
