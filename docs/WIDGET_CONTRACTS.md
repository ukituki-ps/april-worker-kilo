# Контракты host-виджет интеграции для AprilHub (v1)

> Базовый документ для интеграции domain widgets в `hub-shell`. Термины и структура согласованы с `april-profile-1`, но зафиксированы как host-level правила для `april-worker`.

**Связанные документы:** [`FRONTEND_STRATEGY.md`](./FRONTEND_STRATEGY.md), [`guides/DESIGN_SYSTEM.md`](./guides/DESIGN_SYSTEM.md), [`auth-jwt-keycloak-adapted.md`](./auth-jwt-keycloak-adapted.md), [`architecture/INTEGRATION_CONTRACTS.md`](./architecture/INTEGRATION_CONTRACTS.md)

---

## 1. Принципы владения

| Слой | Владеет |
|------|---------|
| **Host (AprilHub)** | Router, layout, глобальный сценарный state, OIDC/tenant-контекст, обработка intent-событий виджета. |
| **Widget (`@april/*-ui`)** | Доменный UI-блок, локальный state, доменные API-вызовы в пределах сценария, эмиссия событий для host. |
| **Design System (`@april/ui`, `@april/tokens`)** | Визуальные примитивы и тема; без доменной логики, tenant и RBAC-решений. |

Запрещено: виджет управляет глобальным URL напрямую (`navigate`, `window.location`) вместо событийного контракта с host.

---

## 2. HostContext v1 (минимум)

Контекст передаётся через props и/или React context из доверенного host-слоя.

| Поле | Тип (логический) | Назначение |
|------|------------------|------------|
| `tenant` | `{ id: string }` | Текущий tenant из токена/BFF. |
| `auth` | `{ subject?: string; roles?: string[]; tokenRef?: string }` | Идентификация и роли из Keycloak. |
| `theme` | `'light' \| 'dark' \| 'system'` | Согласование темы между host и widget. |
| `locale` | `string` (BCP 47) | Локаль UI. |
| `telemetry` | `{ requestId: string; traceId?: string; spanId?: string }` | Сквозная корреляция запросов и ошибок. |

Расширения допустимы только как backward-compatible поля или новая версия контракта.

---

## 3. Widget Props v1

Минимальный набор входов для встраиваемого виджета:

| Проп | Обязательность | Комментарий |
|------|----------------|-------------|
| `hostContext` | обязателен | Контекст host из §2. |
| `entityId` / доменные ID | по сценарию | Идентификаторы текущей сущности/контекста. |
| `entityType` / `schemaRef` | по сценарию | Тип и версия доменной схемы (если применимо). |
| `apiBaseUrl` или API-клиент | по соглашению | Внедрённый клиент или BFF endpoint. |
| `onEvent` и/или именованные callbacks | рекомендуется | Канал событий виджета в host. |

Анти-паттерн: принимать `tenantId` из пользовательского ввода как источник truth.

---

## 4. Widget Events v1

События от виджета к host должны быть явными и типизированными.

| Событие | Payload (пример) | Действие host |
|---------|-------------------|---------------|
| `onSaveSuccess` | `{ entityId }` | Обновить список/контекст, выполнить переход по сценарию. |
| `onAction` | `{ type: string; payload?: unknown }` | Обработать intent (`requestNext`, `openRelated`, и т.д.). |
| `onError` | `{ code?: string; message: string; requestId?: string }` | Показать ошибку и залогировать с корреляцией. |

Навигационные события должны быть семантическими intent, а не прямыми URL-инструкциями.

---

## 5. Навигация и state

- Глобальный state сценария (очередь, текущий route, query-параметры) хранит **host**.
- Виджет хранит только локальный state, а после успешных операций эмитит событие в host.
- URL-синхронизация контролируется host, чтобы deep-link/back-navigation были единообразными.

---

## 6. IAM / ABAC границы

- Роли и права определяются **Keycloak** и backend-политиками.
- Виджет не вводит альтернативную модель authorisation.
- Tenant берётся из trusted контекста токена/BFF; query/body/header от клиента не источник tenant.

---

## 7. Версионирование

- Несовместимые изменения props/events контракта требуют major-обновления пакета виджета.
- Добавление optional полей — minor, если не ломается существующее поведение.
- При обновлении контракта синхронно обновляются документация и интеграционные заметки в задаче.

---

## 8. Shell-каркас AprilHub (профиль-домен, hash-маршрутизация)

Реализация в `hub-shell` после задачи **035 / phase 4a.0** (см. `tasks/025-aprilhub-execute-external-task-035-april-profile-1/`).

### 8.1 Информационная архитектура (IA)

- **Платформа (sidebar):** «Обзор», «Роли», далее блок **Профиль April** — «Карточка сущности» (deeplink на `entityId` по умолчанию из env или стаба), «Экземпляр (заглушка)» под будущий `instanceId`, «Админ-контур» (только роль `admin`).
- **Вкладки vs маршруты:** состояние одной сущности, не требующее отдельного deep-link, остаётся во **вкладках-подпутях** (`/card`, `/meta`). Списки профилей, другая сущность, экземпляр — **отдельный маршрут** (`/app/profile/entities/:entityId/...`, `/app/profile/instances/:instanceId`).
- **Канонические пути:** заданы в `hub-shell/src/shell/shell-paths.ts` (`shellPaths`, `matchShellRoute`). Параметры: `entityId` (карточка), `instanceId` (заглушка до задачи 028).

### 8.2 Расширенный `HubHostContext` (host → виджет и страницы)

Провайдер `HubHostContextProvider` объединяет поля §2 с навигационным API и срезом маршрута (`route.match`, `profileEntityId`, `profileInstanceId`). Виджеты по-прежнему получают минимальный `hostContext` через props; страницы shell могут вызывать `useHubHostContext()` для семантической навигации (`goToProfileEntityCard`, `goBack`, …).

### 8.3 Обёртки состояний и UX

- Общие состояния: `SharedState` (`loading` / `empty` / `error` / `forbidden`) для зон shell и отдельных разделов.
- Уведомления об успехе/ошибке сохранения: `ShellToastProvider` + `useShellToast()` на уровне авторизованной оболочки.
- Опасные действия: паттерн подтверждения через `Modal` (демо на вкладке «Связи»); в продуктовых виджетах — тот же подход + политика IAM на BFF.

### 8.4 Подключение нового виджета в shell

1. Зафиксировать контракт host/widget (§2–§6) и сценарий маршрута (§8.1).
2. Добавить маршрут в `AuthorizedHubContent` / вложенный layout, не открывая второй маршрутный контур в обход BFF.
3. Оборачивать lazy/рискованные модули в `CompositionErrorBoundary`.
4. Расширить Playwright smoke для критичного deep-link / навигации sidebar → слот виджета.
