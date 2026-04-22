# AprilHub: C3 и C4

Документ описывает `AprilHub` на детальных уровнях C4-модели:
- **C3 (Component)** — логические компоненты внутри контейнеров `Hub Shell` и `Hub BFF API`.
- **C4 (Code)** — реализация и runtime-потоки на уровне модулей и взаимодействий.

Базовая архитектурная модель: `structurizr/workspace.dsl`.

## 1. Роль AprilHub в экосистеме

`AprilHub` — рабочее место сотрудника и единая точка входа в экосистему April.

Ключевые принципы:
- `AprilHub` оркестрирует UI (компоновка микрофронтов), но не владеет доменными данными.
- Доменные микрофронты взаимодействуют со своими API напрямую.
- `Hub BFF API` используется для агрегированных UI-сценариев и адаптации данных под frontend.
- Аутентификация пользователя и администратора происходит через `Keycloak Login UI`.

## 2. C3: Компоненты AprilHub

### 2.1 Компоненты `Hub Shell (Microfrontend Orchestrator)`

1. **App Shell Core**
   - Базовый каркас приложения (layout, навигация, роутинг, lifecycle страницы).
   - Управляет инициализацией пользовательского контекста и глобального состояния.

2. **Auth Client**
   - OIDC-клиент для интеграции с `Keycloak`.
   - Выполняет login/logout, проверяет валидность токена, инициирует refresh.

3. **Microfrontend Registry**
   - Каталог доступных микрофронтов и правил их отображения.
   - Выбирает виджеты на основе ролей пользователя, маршрута и бизнес-контекста.

4. **Microfrontend Loader**
   - Динамически загружает микрофронты (`WorkflowWidget`, `NFlowWidget`, `OrgChartWidget`, `ProfileWidget`, `EDCWidget`, `ReportWidget`).
   - Поддерживает fallback-режимы при деградации/ошибке загрузки.

5. **UI Composition Layer**
   - Встраивает виджеты в единый интерфейс.
   - Передаёт общий контекст исполнения: `user`, `roles`, `orgScope`, `correlationId`.

6. **Shared UX Layer**
   - Общие UX-паттерны и инфраструктурные обвязки: уведомления, локализация, feature toggles, error boundaries.

7. **Frontend Telemetry**
   - Сбор клиентских метрик, ошибок и trace-контекста.

### 2.2 Компоненты `Hub BFF API`

1. **BFF Entry Controller**
   - Входной слой API для frontend-запросов, требующих агрегации.

2. **Auth/RBAC Middleware**
   - Валидация токенов через `Keycloak`, извлечение claims и ролей.
   - Ограничение доступа на уровне use-case.

3. **Use-case Orchestrator (UI Aggregation)**
   - Оркестрирует только UI-агрегационные сценарии.
   - Не подменяет доменную оркестрацию сервисов.

4. **Service Adapters**
   - Клиенты к `AprilWorkFlow`, `AprilNFlow`, `AprilOrgFlow`, `AprilProfile`, `AprilEDC`, `AprilReport`, `AprilWorker`.

5. **Response Composer**
   - Собирает и нормализует данные из нескольких сервисов в frontend-friendly DTO.

6. **Observability Middleware**
   - Единый `correlationId`, метрики latency/error-rate, технические логи.

## 3. C4: Code-level поведение AprilHub

Ниже — ключевые runtime-потоки на уровне кода и модулей.

### 3.1 Login flow (через Keycloak)

1. Пользователь открывает `AprilHub` через `Nginx`.
2. `Auth Client` обнаруживает отсутствие валидной сессии.
3. Выполняется редирект на `Keycloak Login UI`.
4. После успешной авторизации `Hub Shell` получает токены OIDC.
5. Инициализируется пользовательский контекст и список доступных микрофронтов.

### 3.2 Microfrontend composition flow

1. `Microfrontend Registry` определяет, какие виджеты доступны текущему пользователю.
2. `Microfrontend Loader` подгружает виджеты динамически.
3. `UI Composition Layer` размещает их в layout.
4. Виджеты обращаются к своим backend API напрямую.
5. Для агрегированных экранов `Hub Shell` вызывает `Hub BFF API`.

### 3.3 BFF aggregation flow

1. Запрос приходит в `BFF Entry Controller`.
2. `Auth/RBAC Middleware` подтверждает доступ.
3. `Use-case Orchestrator` выполняет fan-out к целевым сервисам.
4. `Response Composer` объединяет ответы и формирует DTO.
5. Ответ возвращается в `Hub Shell` с trace-контекстом.

### 3.4 Error handling and resiliency

- Ошибка отдельного микрофронта не должна “падать” весь Hub.
- Для downstream-вызовов BFF нужны timeout и деградация ответа (partial response).
- При истечении сессии выполняется refresh или controlled re-login через Keycloak.

### 3.5 Correlation and tracing

- На пользовательское действие создаётся `correlationId`.
- `correlationId` прокидывается в:
  - вызовы из `Hub Shell`,
  - запросы в `Hub BFF`,
  - вызовы BFF в downstream-сервисы.
- Это обеспечивает end-to-end трассировку сценария.

## 4. Границы ответственности

`AprilHub` отвечает за:
- единый пользовательский вход и UX-композицию;
- orchestration UI-сценариев;
- агрегированные BFF-представления данных.

`AprilHub` **не** отвечает за:
- владение доменными данными;
- доменные workflow-правила сервисов;
- интеграционную бизнес-оркестрацию между доменными сервисами.

Эти обязанности остаются в доменных системах (`AprilWorkFlow`, `AprilNFlow`, `AprilOrgFlow`, `AprilProfile`, `AprilEDC`, `AprilReport`) и в `AprilWorker`.

## 5. Минимальные технические требования к реализации

- Единый формат propagation-заголовков (`correlationId`, `requestId`, `sourceService`).
- Общая политика обработки ошибок и кодов отказа в BFF.
- Чёткое разделение между UI-агрегацией (BFF) и доменной оркестрацией (`AprilWorker`).
- Контракты интеграции согласуются с `docs/architecture/INTEGRATION_CONTRACTS.md`.
