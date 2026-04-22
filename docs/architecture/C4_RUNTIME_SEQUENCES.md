# C4 Runtime Sequences

Документ фиксирует ключевые runtime-сценарии экосистемы April в виде sequence-диаграмм.

Связанные документы:
- `docs/architecture/APRILHUB_C3_C4.md`
- `docs/architecture/APRILWORKER_C3_C4.md`
- `docs/architecture/INTEGRATION_CONTRACTS.md`
- `structurizr/workspace.dsl`

## 1) Вход пользователя через Keycloak и загрузка Hub

```mermaid
sequenceDiagram
    autonumber
    actor U as User/Admin
    participant N as Nginx
    participant H as AprilHub Shell
    participant K as Keycloak
    participant B as Hub BFF API

    U->>N: GET / (AprilHub)
    N->>H: Отдаёт Hub Shell
    H->>K: Redirect на Login UI (OIDC)
    U->>K: Ввод учётных данных
    K-->>H: Auth code / tokens
    H->>B: Запрос агрегированных данных (Bearer token)
    B->>K: Проверка токена и ролей
    K-->>B: claims/roles
    B-->>H: DTO для стартового экрана
    H-->>U: Рабочее место загружено
```

**Failure path**
- Если `Keycloak` недоступен: `Hub Shell` показывает страницу недоступности авторизации и не загружает защищённые виджеты.
- Если `Hub BFF` не отвечает вовремя: UI загружается в degraded mode (часть карточек без агрегированных данных).
- При невалидном токене: принудительный re-login через `Keycloak`.

## 2) Эскалационная нотификация в AprilNFlow

Сценарий: триггер не выполнен, `AprilNFlow` должен отправить сообщение руководителю или инициатору процесса.

```mermaid
sequenceDiagram
    autonumber
    participant WF as AprilWorkFlow API
    participant NF as AprilNFlow API
    participant OF as AprilOrgFlow API
    participant PF as AprilProfile API
    participant CH as Канал уведомлений

    WF->>NF: Инициация уведомления по этапу
    NF->>OF: Запрос руководителя для эскалации
    OF-->>NF: managerId / org context
    NF->>WF: Запрос инициатора процесса
    WF-->>NF: initiatorId
    NF->>PF: Запрос контактов получателей
    PF-->>NF: email/phone/chatId
    NF->>CH: Отправка уведомления по шаблону
    CH-->>NF: Delivery status
```

**Failure path**
- Если `OrgFlow`/`WorkFlow` недоступны: fallback на базовый маршрут уведомления (например, только инициатор или дефолтная группа).
- Если канал доставки недоступен: задача переводится в retry через `NFlow Worker`.
- После превышения ретраев: фиксация failure-статуса и событие для ручной обработки.

## 3) Запуск интеграционной задачи через AprilEDC

Сценарий: доменный сервис инициирует интеграционную задачу.

```mermaid
sequenceDiagram
    autonumber
    participant S as Domain Service (Any)
    participant EAPI as AprilEDC API
    participant R as Redis/Asynq
    participant EW as AprilEDC Worker
    participant EXT as External Source (HH/LinkedIn/...)
    participant DB as PostgreSQL

    S->>EAPI: Запуск интеграционной задачи (Sync)
    EAPI->>R: enqueue(task)
    EAPI-->>S: taskAccepted + correlationId
    EW->>R: dequeue(task)
    EW->>EXT: Получение внешних данных
    EXT-->>EW: raw payload
    EW->>EW: Нормализация/маппинг
    EW->>DB: Сохранение результатов
    EW-->>EAPI: Статус выполнения задачи
```

**Failure path**
- Если внешние источники недоступны: `EDC Worker` повторяет вызов по backoff-политике.
- Если нормализация неуспешна: задача помечается как failed с причиной и correlationId.
- Если БД недоступна: задача возвращается в очередь на отложенный повтор.

## 4) Возврат результатов EDC в доменные сервисы (Async)

```mermaid
sequenceDiagram
    autonumber
    participant EW as AprilEDC Worker
    participant OF as AprilOrgFlow API
    participant PF as AprilProfile API
    participant WF as AprilWorkFlow API
    participant NF as AprilNFlow API
    participant RP as AprilReport API

    EW->>OF: Event/API: обновления оргданных
    OF-->>EW: ack
    EW->>PF: Event/API: обновления профилей
    PF-->>EW: ack
    EW->>WF: Event/API: результат интеграционной обработки
    WF-->>EW: ack
    EW->>NF: Event/API: результат интеграционной обработки
    NF-->>EW: ack
    EW->>RP: Event/API: результат интеграционной обработки
    RP-->>EW: ack
```

**Failure path**
- Если consumer не подтвердил `ack`: событие повторно публикуется (at-least-once).
- При повторных сбоях доставки: событие переводится в проблемный контур (DLQ/failed stream по проектной политике).
- Consumer обязан обрабатывать дубликаты идемпотентно по `eventId`/`entityKey`.

## 5) Сквозной сценарий через AprilWorker

Сценарий: `AprilWorker` координирует бизнес-правило, включает sync-шаги и async-обработку.

```mermaid
sequenceDiagram
    autonumber
    participant C as Caller Service
    participant AW as AprilWorker API
    participant AWE as AprilWorker Engine
    participant OF as AprilOrgFlow API
    participant PF as AprilProfile API
    participant NF as AprilNFlow API
    participant EAPI as AprilEDC API
    participant R as Redis/Asynq

    C->>AW: Запуск бизнес-сценария
    AW->>OF: Чтение оргконтекста
    OF-->>AW: org data
    AW->>PF: Чтение профильных атрибутов
    PF-->>AW: profile data
    AW->>NF: Инициация коммуникаций
    NF-->>AW: accepted
    AW->>EAPI: Запуск интеграционной задачи
    EAPI-->>AW: taskAccepted
    AW->>R: enqueue(async-step)
    AWE->>R: dequeue(async-step)
    AWE-->>C: Итоговый статус сценария (через callback/event)
```

**Failure path**
- Ошибка sync-шага: немедленное завершение сценария или запуск компенсации (по критичности шага).
- Ошибка async-шага: retry в `AprilWorker Engine`; при исчерпании — статус `Failed` с причиной.
- Для mutation-операций обязательно идемпотентное повторное выполнение по `scenarioId/correlationId`.
