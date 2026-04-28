# APRIL Error Telemetry Triage Runbook

## Назначение

Runbook для расследования инцидентов ошибок `400/404/503` и frontend runtime-ошибок в контурах AprilHub + AprilProfile.

Цепочка анализа:

`Sentry issue -> Loki logs -> Prometheus alert -> root cause`

Связанные документы:

- `docs/architecture/ERROR_TELEMETRY_MODEL.md`
- `docs/guides/OBSERVABILITY_INDEX.md`
- `docs/guides/OBSERVABILITY_MULTI_STAND_OPERATING_MODEL.md`

## 1) Preconditions

- Есть идентификатор инцидента в Sentry (или алерт Grafana/Prometheus).
- Доступны ключи корреляции: `requestId`, `correlationId`, `tenant`, `route`, `module`/`widget`.
- Известно окружение (`env`) и предполагаемый сервис (`hub-shell`, `hub-bff`, `april-profile-api`).

## 2) Шаг 1 — Sentry issue (frontend incident-layer)

1. Открыть issue и зафиксировать:
   - тип ошибки (`React render`, `unhandledrejection`, API client);
   - timestamp/релиз;
   - теги `requestId`, `correlationId`, `tenant`, `route`, `module`/`widget`.
2. Проверить breadcrumbs:
   - последний API-запрос;
   - navigation event перед ошибкой;
   - наличие повторяемости у одного release.
3. Сформировать initial hypothesis (UI-only / API-related / infra-related).

## 3) Шаг 2 — Loki correlation

Использовать ключи из Sentry, начиная с самого точного (`requestId`):

```logql
{job=~"docker|docker_remote",service=~"hub-bff|hub-shell|april-profile-api"} |= "requestId=<value>"
```

Если `requestId` отсутствует, искать по `correlationId` и route:

```logql
{job=~"docker|docker_remote",service=~"hub-bff|april-profile-api"} |= "correlationId=<value>" |= "<route>"
```

Что фиксировать:

- первый сервис, где возникла ошибка;
- HTTP статус (`400`/`404`/`503`);
- наличие degraded-ответа BFF (`status=degraded`, `degraded[]`);
- downstream timeout/transport errors.

## 4) Шаг 3 — Prometheus/Grafana checks

Проверить временное окно инцидента в dashboards:

- `Hub API Health`
- `Hub Auth And Degraded`
- `Multi Stand Service Overview`
- `Multi Stand Logs Overview`

Проверить алерты:

- `AprilHubTargetDown`
- `AprilHubHighErrorRate`
- `AprilHubP95LatencyHigh`
- `AprilHubAuthErrorsSpike`

Критерии инфраструктурной причины:

- одновременный рост `5xx/503`, latency и/или target down;
- коррелирующие ошибки в нескольких маршрутах/модулях.

## 5) Шаг 4 — Root cause classification

Классифицировать инцидент и назначить owner:

- **UI/runtime defect (AprilHub host/widget):**
  - Sentry stacktrace указывает на рендер/состояние/контракт виджета;
  - backend метрики не показывают деградацию.
- **Hub BFF integration issue:**
  - ошибки агрегации, invalid JSON downstream, массовый degraded.
- **AprilProfile/domain backend issue:**
  - стабильные ошибки конкретного доменного endpoint;
  - подтверждается логами/метриками profile backend.
- **Infra/network issue:**
  - target down, timeouts, системные алерты.

## 6) Incident output format

В incident note/тикете фиксировать:

1. Incident ID / timeframe / environment.
2. Ключи корреляции (`requestId`, `correlationId`, `tenant`, `route`, `module/widget`).
3. Наблюдения из Sentry/Loki/Prometheus.
4. Root cause classification и owner (AprilHub/AprilProfile/Infra).
5. Mitigation/rollback и follow-up actions.

## 7) Security and PII guardrails

- Не копировать в тикеты и чаты токены, cookies, секреты DSN.
- Персональные данные редактировать или заменять техническим ID.
- При необходимости приложить только минимальные фрагменты логов с redaction.
