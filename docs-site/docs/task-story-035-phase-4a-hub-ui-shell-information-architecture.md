---
sidebar_position: 22
---

# Task story 035: Hub UI shell, IA и навигационный контракт (phase 4a.0)

Статус: исполнение в **AprilHub** (`april-worker`). Постановка и трассировка roadmap: `april-profile-1/tasks/035-phase-4a-hub-ui-shell-information-architecture/TASK.md`.

## Зачем это нужно

Фаза 4a подключает несколько виджетов профиля. Без общего shell-каркаса они расходятся по навигации, deep-link и передаче контекста. Задача **035** фиксирует единый каркас: sidebar, правила «вкладка vs маршрут», hash-URL и расширенный host-контекст.

## Как устроена навигация для profile-виджетов

1. **Sidebar (платформа + профиль):** верхние пункты «Обзор» и «Роли»; блок профиля — ссылка на карточку сущности с дефолтным `entityId` (из `VITE_PROFILE_DEMO_ENTITY_ID` или стаб для smoke), пункт «Экземпляр» ведёт на заглушку маршрута `/app/profile/instances/:instanceId` (до задачи 028); «Админ-контур» виден только при роли `admin`.
2. **Контент:** один основной слот на маршруте. Для карточки сущности используется вложенный маршрут вкладок: **`/card`** (виджет сохранения профиля) и **`/meta`** (заглушка + демо подтверждения опасного действия).
3. **Breadcrumbs и «Назад»:** breadcrumbs в шапке контента; кнопка «Назад» вызывает `history.back()`, «К обзору» — семантический переход на `/app/overview`.

## Когда sidebar, когда вкладки, когда отдельный маршрут

| Уровень | Когда использовать | Пример в Hub |
|--------|---------------------|--------------|
| **Sidebar** | Разделы верхнего уровня и переключение между крупными зонами продукта | Обзор, Роли, Профиль (карточка / экземпляр) |
| **Вкладки (подпуть)** | Несколько представлений **одной** сущности без отдельного бизнес-deep-link | `/app/profile/entities/:id/card` vs `.../meta` |
| **Отдельный маршрут** | Другая сущность, список, экземпляр, сценарии с отдельным URL и шарингом ссылок | `/app/profile/instances/:instanceId`, будущие списки (026) |

## HostContext и встраивание виджетов

Минимальный контракт по-прежнему описан в [WIDGET_CONTRACTS](https://github.com/ukituki-ps/april-worker/blob/develop/docs/WIDGET_CONTRACTS.md). В shell добавлены провайдер **`HubHostContextProvider`** (навигация + срез маршрута поверх tenant/auth/telemetry) и **`ShellToastProvider`** для унифицированных уведомлений об успехе/ошибке. Подключение нового виджета: см. **§8** в том же документе.

## Проверки

- Unit: `hub-shell/src/shell/shell-paths.test.ts` (разбор маршрутов).
- E2E: `hub-shell/tests/e2e/smoke.spec.ts` — сценарий sidebar → карточка → сохранение; отдельный кейс deep-link на `/#/app/profile/entities/.../card`.

## Ссылки

- Постановка: `april-profile-1/tasks/035-phase-4a-hub-ui-shell-information-architecture/TASK.md`
- План (april-worker): `tasks/025-aprilhub-execute-external-task-035-april-profile-1/PLAN.md`
- Отчёт (april-worker): `tasks/025-aprilhub-execute-external-task-035-april-profile-1/REPORT.md`
- Отчёт (april-profile-1): `tasks/035-phase-4a-hub-ui-shell-information-architecture/REPORT.md`
