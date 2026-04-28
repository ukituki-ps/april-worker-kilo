# Error Telemetry Architecture (AprilHub + AprilProfile)

## Статус и назначение

- **Статус:** agreed baseline для задач `033-038`.
- **Назначение:** единая модель обработки и корреляции ошибок `400/404/503` и frontend runtime-ошибок (`React Error Boundary`, `unhandledrejection`) между AprilHub (host) и AprilProfile (domain widget/backend).

Связанные артефакты:

- `docs/architecture/INTEGRATION_CONTRACTS.md`
- `docs/WIDGET_CONTRACTS.md`
- `docs/guides/OBSERVABILITY_INDEX.md`
- `docs/runbooks/APRIL_ERROR_TELEMETRY_TRIAGE.md`
- `infra/observability/`

## 1. Слои наблюдаемости

### 1.1 Frontend incident layer (Sentry)

Sentry используется как incident-layer для runtime-ошибок UI:

- исключения в `CompositionErrorBoundary`/domain error boundaries;
- `window.unhandledrejection`;
- ошибки API-клиента в UI-контексте (как breadcrumbs и/или отдельные issue по policy).

Sentry не заменяет операционную диагностику в Loki/Prometheus, а запускает triage-цепочку.

### 1.2 Operational layer (Loki + Prometheus + Grafana)

Loki/Prometheus/Grafana остаются source of truth для операционной диагностики:

- HTTP ошибки `400/404/503`, `5xx`, degraded status;
- latency/auth spikes и availability;
- корреляция request-потоков между host BFF и downstream сервисами.

## 2. Источники ошибок и точки capture

| Источник | Примеры | Где capture | Основной канал |
|---|---|---|---|
| Frontend runtime | render crash, `unhandledrejection` | `hub-shell` host boundary + widget boundary | Sentry |
| Frontend API usage | failed fetch, invalid payload | host/widget API adapter + BFF logs | Sentry + Loki |
| Hub API | `400/404/503`, auth errors, timeout | `hub-bff` middleware/access log/metrics | Loki + Prometheus |
| Downstream API | timeout, invalid JSON, degraded source | `hub-bff/internal/aggregation` | Loki + Prometheus |
| Domain backend (AprilProfile) | business validation/availability | profile backend logs/metrics | Loki + Prometheus |

## 3. Обязательные поля корреляции

Минимальный обязательный набор для событий/логов/issue:

- `requestId` (обязателен, генерируется на ingress при отсутствии);
- `correlationId` (обязателен, передаётся end-to-end);
- `tenant` (trusted context, не из пользовательского ввода);
- `route` (host route или API path);
- `module`/`widget` (источник UI-модуля, например `profile-card-widget`);
- `service` (например `hub-shell`, `hub-bff`, `april-profile-api`);
- `environment` (`dev`, `staging`, `prod`).

Рекомендованные поля:

- `traceId`, `spanId` (если включена трассировка);
- `release` (git SHA/semver компонента);
- `roleSet` (агрегированный набор ролей без PII).

## 4. Политика redaction / PII

- Запрещено отправлять в Sentry/Loki: access tokens, refresh tokens, cookies, пароли, сырые персональные данные.
- Для идентификации пользователя в telemetry использовать стабильный технический идентификатор (`subject`/hash), без ФИО/email в открытом виде.
- Payload запросов/ответов логировать выборочно:
  - разрешены технические коды (`code`, `httpStatus`, `source`, `degraded[]`);
  - бизнес-данные и пользовательский ввод редактируются или исключаются.
- Любое расширение telemetry-полей проходит ревью на предмет PII и security.

## 5. Модель корреляции и triage-поток

1. Инцидент фиксируется в Sentry (runtime/UI/API client error).
2. Из issue берутся `requestId`/`correlationId`/`tenant`/`route`/`module`.
3. По этим ключам выполняется поиск в Loki и проверяются связанные временные окна в Grafana.
4. По alert-правилам Prometheus проверяется наличие инфраструктурного/сервисного инцидента.
5. Root cause и owner фиксируются в runbook/incident notes.

Подробный алгоритм: `docs/runbooks/APRIL_ERROR_TELEMETRY_TRIAGE.md`.

## 6. Границы ответственности (AprilHub vs AprilProfile)

| Зона | AprilHub (host) | AprilProfile (domain) |
|---|---|---|
| UI runtime capture | Host boundary + shell-level context/tags | Domain widget boundary + domain tags |
| Correlation propagation | Генерация/прокидка `requestId`/`correlationId` host -> BFF | Принятие и дальнейшая передача в profile API |
| API telemetry | Hub BFF access logs/metrics/degraded policy | Profile backend logs/metrics/error semantics |
| Incident triage ownership | Первый уровень triage по host/BFF инцидентам | RCA по domain backend/widget-специфике |

## 7. Ограничения текущего baseline

- Документ описывает архитектурный и операционный baseline; фактическая SDK-интеграция Sentry реализуется отдельными задачами (`035-038`).
- Для новых интеграционных сценариев обязательна синхронизация `INTEGRATION_CONTRACTS.md` и `WIDGET_CONTRACTS.md`.
