# Observability Multi-stand Operating Model

## Purpose

Документ описывает, как использовать центральный `ObservabilityStack` для нескольких микросервисов и стендов (локальные, dev-хосты, дополнительные инфраструктуры).

Для frontend runtime-инцидентов применяется дополнительный incident-layer (Sentry) по модели `docs/architecture/ERROR_TELEMETRY_MODEL.md`; текущий документ описывает операционный слой Loki/Prometheus/Grafana.

Базовые артефакты:

- `infra/observability/README.md`
- `infra/observability/docker-compose.yml`
- `docs/runbooks/OBSERVABILITY_STACK_DEPLOY.md`
- `docs/runbooks/OBSERVABILITY_STACK_ONBOARDING.md`

## Topology

- Центральный observability-хост поднимает:
  - `Prometheus`
  - `Loki`
  - `Grafana`
  - `Promtail` (локальные docker-логи хоста observability)
  - `node-exporter`, `cadvisor`
- Каждый дополнительный стенд:
  - отдает `GET /metrics` для микросервисов;
  - (опционально/рекомендуется) запускает `promtail-agent` и отправляет логи в центральный Loki.

## Contracts for any microservice

### Metrics contract

Сервис обязан:

1. Экспортировать `GET /metrics` (Prometheus format).
2. Обеспечить сетевую доступность endpoint с central observability host (`<host>:<port>`).
3. Быть зарегистрирован в `infra/observability/overlays/targets/*.yml` с labels:
   - `env`
   - `host`
   - `stand`
   - `service`

Быстрое добавление:

```bash
cd infra/observability
./scripts/register-stand-target.sh <stand_name> <host_ip_or_dns> <service_name> <metrics_port> <env>
docker compose --env-file env/.env up -d prometheus
```

### Logs contract

Сервис/стенд обязан:

1. Писать логи в `stdout/stderr` (лучше JSON).
2. Для удаленного стенда запускать `infra/observability/agents/promtail` с env:
   - `HOST_ALIAS=<host>`
   - `STAND_NAME=<stand>`
   - `LOKI_PUSH_URL=http://<central-observability>:3100/loki/api/v1/push`

## Dashboards

Основные dashboards:

- `Hub API Health`
- `Hub Auth And Degraded`
- `Infra Runtime`
- `Multi Stand Service Overview`
- `Multi Stand Logs Overview`

`Multi Stand Service Overview` и `Multi Stand Logs Overview` являются базовыми для multi-service/multi-stand и поддерживают фильтрацию по `host`, `stand`, `service`.

## Alerting baseline

Prometheus rules:

- `AprilHubTargetDown`
- `AprilHubHighErrorRate`
- `AprilHubP95LatencyHigh`
- `AprilHubAuthErrorsSpike`

Файл:

- `infra/observability/config/prometheus/rules/aprilhub-alerts.yml`

## Onboarding checklist for new stand/service

1. Сервис доступен по `http://<host>:<port>/metrics`.
2. Endpoint достижим с central host (ports/routing/firewall).
3. Target добавлен в `overlays/targets/`.
4. `prometheus` перезапущен (`up -d prometheus`).
5. На удаленном стенде запущен `promtail-agent` (если нужны логи).
6. В Grafana видны:
   - target `UP` в Prometheus;
   - лог-поток с labels `host/stand/service`;
   - метрики в `Multi Stand Service Overview`;
   - события в `Multi Stand Logs Overview`.

## Operational notes

- Не использовать динамические идентификаторы (`requestId`, `correlationId`, `userId`) как labels.
- Для поиска по `requestId/correlationId` использовать full-text фильтрацию в Loki (`|=`).
- Для triage runtime/UI ошибок использовать цепочку `Sentry issue -> Loki logs -> Prometheus alerts` (см. `docs/runbooks/APRIL_ERROR_TELEMETRY_TRIAGE.md`).
- Для новых стендов достаточно:
  - нового файла targets;
  - env для `promtail-agent`;
  - без изменений центрального кода/compose.
