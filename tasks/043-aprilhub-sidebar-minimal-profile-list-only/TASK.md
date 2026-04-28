# Задача 043: минималистичный сайдбар AprilHub (только `Профиль — список`)

## Мета
- **ID / ветка:** `043-aprilhub-sidebar-minimal-profile-list-only`
- **Приоритет:** высокий
- **Тип:** [UI shell simplification + routing cleanup]
- **Связанные документы:**
  - [`task_list.md`](../../task_list.md)
  - [`tasks/042-aprilhub-profiles-widget-sidebar-integration/TASK.md`](../042-aprilhub-profiles-widget-sidebar-integration/TASK.md)
  - [`hub-shell/src/shell/shell-nav-config.ts`](../../hub-shell/src/shell/shell-nav-config.ts)
  - [`hub-shell/src/shell/shell-paths.ts`](../../hub-shell/src/shell/shell-paths.ts)
  - [`hub-shell/src/shell/AuthorizedHubContent.tsx`](../../hub-shell/src/shell/AuthorizedHubContent.tsx)
  - [`hub-shell/src/widgets.tsx`](../../hub-shell/src/widgets.tsx)

## Цель
С нуля упростить авторизованную зону AprilHub: убрать из сайдбара все разделы, кроме `Профиль — список`, и убрать runtime-маршруты/виджеты/запросы, которые обслуживают удаляемые разделы. В результате в рабочем контуре остаётся только поток списка профилей через внешний `profiles-widget` и его host-обвязка.

## Контекст для агента
- Текущий сайдбар содержит дополнительные пункты (`обзор`, `роли`, `карточка`, `экземпляры`, `история`, `конфликты`, `админ-контур`), которые нужно удалить из продуктового маршрута.
- Текущая маршрутизация в `shell-paths` и `AuthorizedHubContent` обслуживает набор экранов больше, чем требуется для целевого UX.
- В `widgets.tsx` присутствует логика и сетевые вызовы для разделов, которые больше не должны быть доступны пользователю через сайдбар и runtime-навигацию.
- Изменение ожидается как продуктовая переработка IA/навигации, а не только скрытие пунктов в UI.

## Входит в объём
- Оставить в primary-sidebar только пункт `Профиль — список` с маршрутом `/app/profile/entities`.
- Удалить из runtime-навигации и роутинга все разделы, не относящиеся к `Профиль — список`:
  - overview,
  - roles,
  - profile entity/card,
  - profile instances,
  - profile instance history,
  - profile admin conflicts,
  - admin control.
- Привести `shell-paths`/route matching к минимальному набору путей (включая поведение для unknown route).
- Удалить или изолировать неиспользуемые host-виджеты и их запросы в `hub-shell`, чтобы в production-пути не осталось мёртвого runtime-кода для удалённых разделов.
- Сохранить рабочую host-обвязку `ProfilesListHostWidget`:
  - `HostContext`,
  - `accessToken`,
  - BFF-префикс `/api/v1/admin/profile/api`,
  - `CompositionErrorBoundary`.
- Обновить e2e smoke/regression для нового навигационного контракта (позитив + негатив по неизвестному маршруту).
- Зафиксировать в `REPORT.md`, какие разделы и маршруты реально удалены из runtime.

## Не входит в объём
- Редизайн самого внешнего `profiles-widget`.
- Изменение backend API-контрактов AprilProfile/Hub BFF, если они не нужны для списка профилей.
- Добавление новых бизнес-фич для профилей.
- Полноценный рефакторинг дизайн-системы сайдбара вне текущей задачи.

## Технические ограничения
- Не хранить секреты/токены в коде и отчётах.
- Не оставлять “скрытую” навигацию к удалённым разделам через sidebar config.
- Не оставлять активный runtime-роутинг удалённых разделов в основном контуре приложения.
- Сохранить существующий контракт интеграции `profiles-widget` и BFF-path `/api/v1/admin/profile/api`.
- Если для совместимости нужен временный shim/redirect, это должно быть явно задокументировано в `REPORT.md` и удалено из итогового UX-контракта сайдбара.

## Критерии готовности (testable acceptance)
- [ ] В сайдбаре отображается только один раздел: `Профиль — список`.
- [ ] Клик по `Профиль — список` стабильно открывает `/app/profile/entities`.
- [ ] На `/app/profile/entities` рендерится внешний `profiles-widget` с рабочей host-обвязкой и запросами через BFF.
- [ ] Разделы `overview/roles/card/instances/history/conflicts/admin` недоступны из сайдбара и не участвуют в основном runtime-потоке.
- [ ] При переходе на неизвестный или удалённый маршрут пользователь получает корректный fallback-state без падения приложения.
- [ ] e2e smoke обновлён и проходит для минимального сценария сайдбара.
- [ ] В `REPORT.md` перечислены удалённые маршруты, компоненты и связанные запросы.

## Проверка (команды)
```bash
# Статика/типы
npm --prefix hub-shell run lint

# Unit/integration frontend
npm --prefix hub-shell run test -- --runInBand

# E2E smoke авторизованной зоны
npm --prefix hub-shell run e2e:smoke
```

## Результат в отчёте
- Какие пункты сайдбара, маршруты и виджеты удалены или выведены из runtime-контракта.
- Какие файлы `hub-shell` изменены для минимального IA.
- Какие проверки (lint/test/e2e) выполнены и с каким результатом.
- Какие ограничения/риски/follow-up остаются после упрощения.
