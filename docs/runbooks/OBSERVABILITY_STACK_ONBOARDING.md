# Observability Stack Onboarding

## Purpose

Инструкция по подключению нового сервиса в `ObservabilityStack` без изменения базовой архитектуры стека.

Цель: один центральный observability-контур обслуживает несколько микросервисов и несколько стендов одновременно.

## Onboard stand metrics (any host)

1. Убедиться, что нужный сервис на стенде отдает `GET /metrics` в формате Prometheus.
2. На центральном observability-хосте добавить файл targets в `infra/observability/overlays/targets/`:

```yaml
- labels:
    env: dev
    host: 192.168.1.42
    stand: stand-192-168-1-42
    service: hub-bff
  targets:
    - "192.168.1.42:8081"
```

3. Применить изменение:

```bash
cd infra/observability
docker compose --env-file env/.env up -d prometheus
```

4. Проверить `UP` статус в Prometheus `/targets` по `job=aprilhub_dynamic_targets`.

Вместо ручного создания файла можно использовать:

```bash
cd infra/observability
./scripts/register-stand-target.sh <stand_name> <host_ip_or_dns> <service_name> <metrics_port> <env>
docker compose --env-file env/.env up -d prometheus
```

## Onboard stand logs (remote host -> central Loki)

1. На удаленном стенде развернуть promtail-agent из `infra/observability/agents/promtail/`:

```bash
cd infra/observability/agents/promtail
cp .env.example .env
# set HOST_ALIAS, STAND_NAME, LOKI_PUSH_URL=http://<central-host>:3100/loki/api/v1/push
docker compose --env-file .env up -d
```

2. Проверить логи в Grafana Explore на центральном стенде:

```logql
{job=~"docker|docker_remote",stand="stand-192-168-1-42"} |= "hub-bff"
```

## Labeling policy

Чтобы избежать высокой кардинальности:

- использовать labels только: `service`, `env`, `host`, `level`, `status`;
- не использовать dynamic IDs (`requestId`, `correlationId`, `userId`) как labels;
- `requestId` и `correlationId` хранить в log body и искать через `|=`.

Рекомендованные обязательные labels для multi-stand/multi-service:

- metrics: `env`, `stand`, `host`, `service`;
- logs: `job`, `stand`, `host`, `service`, `container`, `stream`.

## Minimal verification checklist

- target сервиса в Prometheus имеет статус `UP` и содержит labels `host/stand/service`;
- есть лог-поток сервиса в Loki с labels `stand/host/service`;
- на dashboard видны метрики request/error/latency для подключенного стенда;
- при ошибке (`4xx/5xx`) событие наблюдается в логах и метриках.

## Incident LogQL quick queries

Используйте в Grafana Explore (Loki), подставляя значения `host/stand/service`:

- Auth incidents:
  - `{job=~"docker|docker_remote",host=~"$host",stand=~"$stand",service=~"$service"} |= "auth"`
- 401/403 spikes:
  - `{job=~"docker|docker_remote",host=~"$host",stand=~"$stand",service=~"$service"} |= "401" or {job=~"docker|docker_remote",host=~"$host",stand=~"$stand",service=~"$service"} |= "403"`
- Degraded mode:
  - `{job=~"docker|docker_remote",host=~"$host",stand=~"$stand",service=~"$service"} |= "degraded"`
- Timeout/retry:
  - `{job=~"docker|docker_remote",host=~"$host",stand=~"$stand",service=~"$service"} |= "timeout" or {job=~"docker|docker_remote",host=~"$host",stand=~"$stand",service=~"$service"} |= "retry"`
- Downstream failures:
  - `{job=~"docker|docker_remote",host=~"$host",stand=~"$stand",service=~"$service"} |= "downstream" |= "error"`
