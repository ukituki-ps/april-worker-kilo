# Integration Contracts (Draft)

Документ фиксирует рабочий черновик контрактов интеграции между сервисами April.

Источник текущих связей:
- `structurizr/workspace.dsl`
- `docs/architecture/INTERSERVICE_LINKS.md`

## Статус документа

- Версия: `draft v1`
- Назначение: выровнять ожидания команд до детализации OpenAPI/event-схем
- Поля с точными параметрами и форматами могут иметь `TBD`

## Общие правила

- **Owner данных**: каждый домен владеет своими сущностями, другие сервисы только читают или получают события.
- **Sync-вызовы**: REST, явный timeout, повтор только для идемпотентных операций.
- **Async-интеграции**: Event/API, at-least-once доставка, обязательная идемпотентность consumer.
- **Корреляция**: во все вызовы/события передаётся `correlationId`.
- **Трассировка**: обязательны технические метаданные (`requestId`, `sourceService`, `timestamp`).

## Sync contracts (REST)

| Producer | Consumer | Назначение | Contract ID | Timeout | Retry | Idempotency | Owner | Status |
|---|---|---|---|---|---|---|---|---|
| `AprilWorker` | `AprilWorkFlow` | Запуск и координация workflow-сценариев | `SYNC-AW-AWF-01` | 3s (TBD) | 1 retry (TBD) | Required | `AprilWorkFlow` | Draft |
| `AprilWorker` | `AprilNFlow` | Инициация коммуникаций по бизнес-правилам | `SYNC-AW-ANF-01` | 2s (TBD) | 1 retry (TBD) | Required | `AprilNFlow` | Draft |
| `AprilWorker` | `AprilOrgFlow` | Получение оргконтекста для маршрутов и правил | `SYNC-AW-AOF-01` | 2s (TBD) | 1 retry (TBD) | Required | `AprilOrgFlow` | Draft |
| `AprilWorker` | `AprilProfil` | Получение профильных атрибутов участников | `SYNC-AW-APR-01` | 2s (TBD) | 1 retry (TBD) | Required | `AprilProfil` | Draft |
| `AprilWorker` | `AprilEDC` | Запуск интеграционных задач по бизнес-логике | `SYNC-AW-AEDC-01` | 3s (TBD) | 1 retry (TBD) | Required | `AprilEDC` | Draft |
| `AprilWorker` | `AprilReport` | Запуск обновления отчётных срезов | `SYNC-AW-ARP-01` | 3s (TBD) | 1 retry (TBD) | Required | `AprilReport` | Draft |
| `AprilWorkFlow` | `AprilNFlow` | Инициация уведомлений по этапам процесса | `SYNC-AWF-ANF-01` | 2s (TBD) | 1 retry (TBD) | Required | `AprilNFlow` | Draft |
| `AprilWorkFlow` | `AprilOrgFlow` | Чтение оргконтекста и ролей согласования | `SYNC-AWF-AOF-01` | 2s (TBD) | 1 retry (TBD) | Required | `AprilOrgFlow` | Draft |
| `AprilWorkFlow` | `AprilProfil` | Чтение профилей участников процесса | `SYNC-AWF-APR-01` | 2s (TBD) | 1 retry (TBD) | Required | `AprilProfil` | Draft |
| `AprilWorkFlow` | `AprilEDC` | Запуск интеграционной задачи по бизнес-логике | `SYNC-AWF-AEDC-01` | 3s (TBD) | 1 retry (TBD) | Required | `AprilEDC` | Draft |
| `AprilNFlow` | `AprilWorkFlow` | Получение инициатора процесса для уведомлений | `SYNC-ANF-AWF-01` | 2s (TBD) | 1 retry (TBD) | Required | `AprilWorkFlow` | Draft |
| `AprilNFlow` | `AprilOrgFlow` | Получение руководителя по оргструктуре для эскалаций | `SYNC-ANF-AOF-01` | 2s (TBD) | 1 retry (TBD) | Required | `AprilOrgFlow` | Draft |
| `AprilNFlow` | `AprilProfil` | Получение контактных и ролевых данных получателей | `SYNC-ANF-APR-01` | 2s (TBD) | 1 retry (TBD) | Required | `AprilProfil` | Draft |
| `AprilNFlow` | `AprilEDC` | Запуск интеграционной задачи по бизнес-логике | `SYNC-ANF-AEDC-01` | 3s (TBD) | 1 retry (TBD) | Required | `AprilEDC` | Draft |
| `AprilOrgFlow` | `AprilEDC` | Запуск интеграционной задачи по бизнес-логике | `SYNC-AOF-AEDC-01` | 3s (TBD) | 1 retry (TBD) | Required | `AprilEDC` | Draft |
| `AprilProfil` | `AprilEDC` | Запуск интеграционной задачи по бизнес-логике | `SYNC-APR-AEDC-01` | 3s (TBD) | 1 retry (TBD) | Required | `AprilEDC` | Draft |
| `AprilReport` | `AprilWorkFlow` | Получение метрик исполнения процессов | `SYNC-ARP-AWF-01` | 3s (TBD) | 1 retry (TBD) | Required | `AprilWorkFlow` | Draft |
| `AprilReport` | `AprilNFlow` | Получение статусов коммуникаций | `SYNC-ARP-ANF-01` | 3s (TBD) | 1 retry (TBD) | Required | `AprilNFlow` | Draft |
| `AprilReport` | `AprilOrgFlow` | Получение оргиерархии для агрегирования | `SYNC-ARP-AOF-01` | 3s (TBD) | 1 retry (TBD) | Required | `AprilOrgFlow` | Draft |
| `AprilReport` | `AprilProfil` | Получение кадровых справочников для отчётов | `SYNC-ARP-APR-01` | 3s (TBD) | 1 retry (TBD) | Required | `AprilProfil` | Draft |
| `AprilReport` | `AprilEDC` | Запуск интеграционной задачи по бизнес-логике | `SYNC-ARP-AEDC-01` | 3s (TBD) | 1 retry (TBD) | Required | `AprilEDC` | Draft |

## Async contracts (Event/API)

| Producer | Consumer | Назначение | Event/Contract ID | Delivery | Idempotency | Ordering | Owner | Status |
|---|---|---|---|---|---|---|---|---|
| `AprilEDC` | `AprilProfil` | Публикация нормализованных обновлений профилей | `ASYNC-AEDC-APR-01` | At-least-once | Required | Per entity (TBD) | `AprilProfil` | Draft |
| `AprilEDC` | `AprilOrgFlow` | Публикация нормализованных обновлений оргданных | `ASYNC-AEDC-AOF-01` | At-least-once | Required | Per entity (TBD) | `AprilOrgFlow` | Draft |
| `AprilEDC` | `AprilWorkFlow` | Возврат результата интеграционной обработки | `ASYNC-AEDC-AWF-01` | At-least-once | Required | Best effort (TBD) | `AprilWorkFlow` | Draft |
| `AprilEDC` | `AprilNFlow` | Возврат результата интеграционной обработки | `ASYNC-AEDC-ANF-01` | At-least-once | Required | Best effort (TBD) | `AprilNFlow` | Draft |
| `AprilEDC` | `AprilReport` | Возврат результата интеграционной обработки | `ASYNC-AEDC-ARP-01` | At-least-once | Required | Best effort (TBD) | `AprilReport` | Draft |

## Минимальный шаблон payload

### Sync request metadata

```json
{
  "correlationId": "uuid",
  "requestId": "uuid",
  "sourceService": "AprilNFlow",
  "timestamp": "2026-04-14T12:00:00Z",
  "payload": {}
}
```

### Async event envelope

```json
{
  "eventId": "uuid",
  "eventType": "ASYNC-AEDC-APR-01",
  "correlationId": "uuid",
  "producer": "AprilEDC",
  "occurredAt": "2026-04-14T12:00:00Z",
  "entityKey": "employee:123",
  "payload": {}
}
```

## Что уточнить в следующей итерации

- Утвердить точные endpoint paths и response-коды.
- Определить строгие SLA/timeout/retry по каждой связи.
- Зафиксировать версии контрактов (`v1`, `v2`) и политику обратной совместимости.
- Согласовать DLQ/retry policy для async-потоков `AprilEDC`.
