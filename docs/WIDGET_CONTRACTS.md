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
