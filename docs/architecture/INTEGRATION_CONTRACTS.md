# Integration Contracts

Документ фиксирует baseline контрактов интеграции между сервисами April.

Источник текущих связей:
- `structurizr/workspace.dsl`
- `docs/architecture/INTERSERVICE_LINKS.md`
- `openapi/aprilhub-bff.yaml`

## Статус документа

- Версия: `v1 baseline`
- Назначение: согласовать runtime-контракты и публичный API без расхождений
- Scope этапа `005`: финализация контрактов `Hub BFF -> downstream` и policy обратной совместимости OpenAPI `aprilhub-bff`

## Общие правила

- **Owner данных**: каждый домен владеет своими сущностями, другие сервисы только читают или получают события.
- **Sync-вызовы**: REST, явный timeout, повтор только для идемпотентных операций.
- **Async-интеграции**: Event/API, at-least-once доставка, обязательная идемпотентность consumer.
- **Корреляция**: во все вызовы/события передаётся `correlationId`.
- **Трассировка**: обязательны технические метаданные (`requestId`, `sourceService`); `timestamp` рекомендуется, если контракт это поддерживает.
- **Degraded policy**: для BFF-агрегации допускается partial response без повторной эскалации в UI-оркестрацию.

### Error telemetry contract (AprilHub + AprilProfile)

- Для ошибок `400/404/503` и frontend runtime событий применяется единый baseline из `docs/architecture/ERROR_TELEMETRY_MODEL.md`.
- Обязательные поля корреляции в telemetry-событиях и диагностических логах:
  - `requestId`
  - `correlationId`
  - `tenant`
  - `route`
  - `module`/`widget`
- Для frontend runtime incident-layer используется Sentry; для операционного расследования и метрик используются Loki/Prometheus/Grafana.
- В контрактах обмена запрещено логировать/передавать секреты и PII без redaction.

## Hub BFF -> downstream (agreed baseline)

Контракты ниже описывают фактический runtime `hub-bff/internal/aggregation` и являются baseline для этапов `006/008`.

| Producer | Consumer | Назначение | Contract ID | Path | Timeout | Retry | Idempotency | Degraded policy | Status |
|---|---|---|---|---|---|---|---|---|---|
| `Hub BFF` | `AprilWorkFlow` | Dashboard workflow widget | `SYNC-HB-AWF-001` | `/api/v1/ui/dashboard/workflow` | `2s` | `1` retry only on transport timeout for safe GET | Required (GET) | Mark source degraded, keep `200` with partial payload | Agreed |
| `Hub BFF` | `AprilNFlow` | Dashboard notifications widget | `SYNC-HB-ANF-001` | `/api/v1/ui/dashboard/notifications` | `2s` | `1` retry only on transport timeout for safe GET | Required (GET) | Mark source degraded, keep `200` with partial payload | Agreed |
| `Hub BFF` | `AprilProfile` | Dashboard profile widget | `SYNC-HB-APR-001` | `/api/v1/ui/dashboard/profile` | `2s` | `1` retry only on transport timeout for safe GET | Required (GET) | Mark source degraded, keep `200` with partial payload | Agreed |
| `Hub BFF` | `AprilWorkFlow` | Home workflow block | `SYNC-HB-AWF-002` | `/api/v1/ui/home/workflow` | `2s` | `1` retry only on transport timeout for safe GET | Required (GET) | Mark source degraded, keep `200` with partial payload | Agreed |
| `Hub BFF` | `AprilOrgFlow` | Home org block | `SYNC-HB-AOF-001` | `/api/v1/ui/home/org` | `2s` | `1` retry only on transport timeout for safe GET | Required (GET) | Mark source degraded, keep `200` with partial payload | Agreed |
| `Hub BFF` | `AprilNFlow` | Home notifications block | `SYNC-HB-ANF-002` | `/api/v1/ui/home/notifications` | `2s` | `1` retry only on transport timeout for safe GET | Required (GET) | Mark source degraded, keep `200` with partial payload | Agreed |
| `Hub BFF` | `AprilReport` | Summary report block | `SYNC-HB-ARP-001` | `/api/v1/ui/summary/report` | `2s` | `1` retry only on transport timeout for safe GET | Required (GET) | Mark source degraded, keep `200` with partial payload | Agreed |
| `Hub BFF` | `AprilWorkFlow` | Summary workflow block | `SYNC-HB-AWF-003` | `/api/v1/ui/summary/workflow` | `2s` | `1` retry only on transport timeout for safe GET | Required (GET) | Mark source degraded, keep `200` with partial payload | Agreed |
| `Hub BFF` | `AprilProfile` | Summary profile block | `SYNC-HB-APR-002` | `/api/v1/ui/summary/profile` | `2s` | `1` retry only on transport timeout for safe GET | Required (GET) | Mark source degraded, keep `200` with partial payload | Agreed |

### Технические метаданные sync-вызовов BFF

- `X-Correlation-Id` -> обязательный; если отсутствует во входящем запросе, генерируется в middleware BFF.
- `X-Request-Id` -> обязательный; если отсутствует во входящем запросе, генерируется в middleware BFF.
- `X-Source-Service` -> outbound всегда `hub-bff`.
- `timestamp` -> не передаётся отдельным заголовком в текущем runtime BFF, но может присутствовать в downstream payload/error для трассировки.

### Единая policy ошибок и degraded режима для BFF

- При недоступности downstream или невалидном downstream JSON BFF не возвращает `5xx` клиенту по aggregation endpoint-ам.
- Ответ BFF остаётся `200`, `status` переключается в `degraded`, а источник добавляется в `degraded[]`.
- Код деградации: `downstream_unavailable`.
- Для auth/role ошибок BFF использует единый формат:
  - `401` -> `{ code: "unauthorized", message, metadata }`
  - `403` -> `{ code: "forbidden", message, metadata }`

### Версионирование и backward compatibility (OpenAPI aprilhub-bff)

- Текущий baseline: `v1` (`/api/v1/*` и `openapi.info.version` серии `1.x`).
- Non-breaking изменения:
  - добавление optional полей в response;
  - добавление новых endpoint-ов внутри `v1`;
  - добавление новых `enum` значений только если consumer это допускает как расширение.
- Breaking изменения:
  - удаление/renaming endpoint path или обязательного поля;
  - изменение типа поля;
  - ужесточение требований авторизации без миграционного окна.
- Депрекация:
  - endpoint/поле сначала маркируется как `deprecated` в OpenAPI и поддерживается минимум один релизный цикл;
  - пример: `/api/v1/overview` оставлен как compatibility endpoint с приоритетом `/api/v1/aggregation/dashboard`.

## Sync contracts (REST) for core backend services

| Producer | Consumer | Назначение | Contract ID | Timeout | Retry | Idempotency | Owner | Status |
|---|---|---|---|---|---|---|---|---|
| `AprilWorker` | `AprilWorkFlow` | Запуск и координация workflow-сценариев | `SYNC-AW-AWF-01` | 3s (TBD) | 1 retry (TBD) | Required | `AprilWorkFlow` | Draft |
| `AprilWorker` | `AprilNFlow` | Инициация коммуникаций по бизнес-правилам | `SYNC-AW-ANF-01` | 2s (TBD) | 1 retry (TBD) | Required | `AprilNFlow` | Draft |
| `AprilWorker` | `AprilOrgFlow` | Получение оргконтекста для маршрутов и правил | `SYNC-AW-AOF-01` | 2s (TBD) | 1 retry (TBD) | Required | `AprilOrgFlow` | Draft |
| `AprilWorker` | `AprilProfile` | Получение профильных атрибутов участников | `SYNC-AW-APR-01` | 2s (TBD) | 1 retry (TBD) | Required | `AprilProfile` | Draft |
| `AprilWorker` | `AprilEDC` | Запуск интеграционных задач по бизнес-логике | `SYNC-AW-AEDC-01` | 3s (TBD) | 1 retry (TBD) | Required | `AprilEDC` | Draft |
| `AprilWorker` | `AprilReport` | Запуск обновления отчётных срезов | `SYNC-AW-ARP-01` | 3s (TBD) | 1 retry (TBD) | Required | `AprilReport` | Draft |
| `AprilWorkFlow` | `AprilNFlow` | Инициация уведомлений по этапам процесса | `SYNC-AWF-ANF-01` | 2s (TBD) | 1 retry (TBD) | Required | `AprilNFlow` | Draft |
| `AprilWorkFlow` | `AprilOrgFlow` | Чтение оргконтекста и ролей согласования | `SYNC-AWF-AOF-01` | 2s (TBD) | 1 retry (TBD) | Required | `AprilOrgFlow` | Draft |
| `AprilWorkFlow` | `AprilProfile` | Чтение профилей участников процесса | `SYNC-AWF-APR-01` | 2s (TBD) | 1 retry (TBD) | Required | `AprilProfile` | Draft |
| `AprilWorkFlow` | `AprilEDC` | Запуск интеграционной задачи по бизнес-логике | `SYNC-AWF-AEDC-01` | 3s (TBD) | 1 retry (TBD) | Required | `AprilEDC` | Draft |
| `AprilNFlow` | `AprilWorkFlow` | Получение инициатора процесса для уведомлений | `SYNC-ANF-AWF-01` | 2s (TBD) | 1 retry (TBD) | Required | `AprilWorkFlow` | Draft |
| `AprilNFlow` | `AprilOrgFlow` | Получение руководителя по оргструктуре для эскалаций | `SYNC-ANF-AOF-01` | 2s (TBD) | 1 retry (TBD) | Required | `AprilOrgFlow` | Draft |
| `AprilNFlow` | `AprilProfile` | Получение контактных и ролевых данных получателей | `SYNC-ANF-APR-01` | 2s (TBD) | 1 retry (TBD) | Required | `AprilProfile` | Draft |
| `AprilNFlow` | `AprilEDC` | Запуск интеграционной задачи по бизнес-логике | `SYNC-ANF-AEDC-01` | 3s (TBD) | 1 retry (TBD) | Required | `AprilEDC` | Draft |
| `AprilOrgFlow` | `AprilEDC` | Запуск интеграционной задачи по бизнес-логике | `SYNC-AOF-AEDC-01` | 3s (TBD) | 1 retry (TBD) | Required | `AprilEDC` | Draft |
| `AprilProfile` | `AprilEDC` | Запуск интеграционной задачи по бизнес-логике | `SYNC-APR-AEDC-01` | 3s (TBD) | 1 retry (TBD) | Required | `AprilEDC` | Draft |
| `AprilReport` | `AprilWorkFlow` | Получение метрик исполнения процессов | `SYNC-ARP-AWF-01` | 3s (TBD) | 1 retry (TBD) | Required | `AprilWorkFlow` | Draft |
| `AprilReport` | `AprilNFlow` | Получение статусов коммуникаций | `SYNC-ARP-ANF-01` | 3s (TBD) | 1 retry (TBD) | Required | `AprilNFlow` | Draft |
| `AprilReport` | `AprilOrgFlow` | Получение оргиерархии для агрегирования | `SYNC-ARP-AOF-01` | 3s (TBD) | 1 retry (TBD) | Required | `AprilOrgFlow` | Draft |
| `AprilReport` | `AprilProfile` | Получение кадровых справочников для отчётов | `SYNC-ARP-APR-01` | 3s (TBD) | 1 retry (TBD) | Required | `AprilProfile` | Draft |
| `AprilReport` | `AprilEDC` | Запуск интеграционной задачи по бизнес-логике | `SYNC-ARP-AEDC-01` | 3s (TBD) | 1 retry (TBD) | Required | `AprilEDC` | Draft |

## Async contracts (Event/API)

| Producer | Consumer | Назначение | Event/Contract ID | Delivery | Idempotency | Ordering | Owner | Status |
|---|---|---|---|---|---|---|---|---|
| `AprilEDC` | `AprilProfile` | Публикация нормализованных обновлений профилей | `ASYNC-AEDC-APR-01` | At-least-once | Required | Per entity (TBD) | `AprilProfile` | Draft |
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

- Утвердить отдельные SLO/SLA per downstream для Hub BFF (сейчас применяется общий runtime timeout).
- Добавить формализованный список retryable ошибок по типам сетевых сбоев.
- Зафиксировать контракт `timestamp` для sync-вызовов в едином формате заголовка/поля.
- Согласовать DLQ/retry policy для async-потоков `AprilEDC`.
