# Observability Stack Deploy Runbook

## Scope

Этот runbook описывает разворачивание и сопровождение `ObservabilityStack` (`Promtail`, `Loki`, `Prometheus`, `Grafana`, `node-exporter`, `cadvisor`) для dev/stage контуров с Docker Compose.

Ключевые артефакты:

- `infra/observability/docker-compose.yml`
- `infra/observability/config/loki/loki.yml`
- `infra/observability/config/promtail/promtail.yml`
- `infra/observability/config/prometheus/prometheus.yml`
- `infra/observability/grafana/provisioning/*`
- `infra/observability/overlays/*.env`
- `infra/observability/overlays/*.prometheus.targets.yml`

## Prerequisites

- Linux host с установленными `docker` и `docker compose`.
- Доступ к `/var/lib/docker/containers` на хосте для Promtail.
- Открытые порты для Grafana/Prometheus/Loki по политике окружения.
- Репозиторий развернут на хосте (или синхронизирован как артефакт).

## Initial bootstrap

1. Перейти в каталог observability:

```bash
cd /path/to/repo/infra/observability
```

2. Подготовить env-файл:

```bash
mkdir -p env overlays/targets
cp env/.env.example env/.env
cat overlays/192.168.1.29.env >> env/.env
```

3. Подготовить targets для Prometheus:

```bash
cp overlays/192.168.1.29.prometheus.targets.yml overlays/targets/192.168.1.29.yml
```

4. Запустить стек:

```bash
docker compose --env-file env/.env up -d
```

5. Проверить статус:

```bash
docker compose --env-file env/.env ps
docker compose --env-file env/.env logs --tail=100 grafana prometheus loki promtail
```

## Health checks

- Grafana: `http://<host>:<GRAFANA_PORT>/api/health`
- Prometheus: `http://<host>:<PROMETHEUS_PORT>/-/healthy`
- Loki: `http://<host>:<LOKI_PORT>/ready`

Проверка ingestion:

- Prometheus Targets: `http://<host>:<PROMETHEUS_PORT>/targets`
- Prometheus Alerts: `http://<host>:<PROMETHEUS_PORT>/alerts`
- В Grafana открыть dashboards:
  - `Hub API Health`
  - `Hub Auth And Degraded`
  - `Infra Runtime`
- В Explore (Loki) выполнить: `{job="docker"} |= "hub-bff"`

## Upgrade

1. Обновить репозиторий/артефакты.
2. Проверить дифф env и targets.
3. Выполнить:

```bash
docker compose --env-file env/.env pull
docker compose --env-file env/.env up -d
```

4. Повторить health checks.
5. Проверить корректную загрузку alert rules:

```bash
curl -sf http://<host>:<PROMETHEUS_PORT>/api/v1/rules
curl -sf http://<host>:<PROMETHEUS_PORT>/api/v1/alerts
```

## Rollback

Если после обновления есть деградация:

1. Вернуть предыдущую ревизию репозитория или compose/config файлов.
2. Восстановить предыдущие `env/.env` и `overlays/targets/*.yml`.
3. Выполнить:

```bash
docker compose --env-file env/.env up -d
```

4. Проверить health endpoints и ingestion.

## Troubleshooting

- `Promtail permission denied`:
  - проверить mounts `/var/lib/docker/containers` и права пользователя Docker daemon.
- `Prometheus target down`:
  - проверить адрес target в `overlays/targets/*.yml`;
  - проверить доступность `http://target/metrics` с хоста.
- `No logs in Loki`:
  - проверить `promtail` logs и `LOKI_PUSH_URL` в `env/.env`.
- `Grafana dashboard empty`:
  - проверить datasource provisioning в `grafana/provisioning/datasources/datasources.yml`;
  - проверить наличие метрик `hub_bff_*` в Prometheus UI.
