# Observability Stack

Portable Docker Compose baseline for:

- Promtail
- Loki
- Prometheus
- Grafana
- node-exporter
- cadvisor

## Structure

- `docker-compose.yml` - stack services and volumes
- `config/loki/loki.yml` - Loki storage and runtime config
- `config/promtail/promtail.yml` - log collection and labels
- `config/prometheus/prometheus.yml` - scrape config with `file_sd`
- `env/.env.example` - environment template
- `overlays/*.env` - host overlays (example: `192.168.1.29`)
- `overlays/*.prometheus.targets.yml` - host target templates
- `overlays/targets/` - active targets loaded by Prometheus
- `overlays/examples/` - templates for additional stands (for example `192.168.1.42`)
- `agents/promtail/` - remote promtail agent to ship logs from other hosts
- `grafana/provisioning/` - datasources and dashboard providers
- `grafana/dashboards/` - prebuilt dashboards

## Quick start

```bash
cd infra/observability
cp env/.env.example env/.env
cat overlays/192.168.1.29.env >> env/.env
cp overlays/192.168.1.29.prometheus.targets.yml overlays/targets/192.168.1.29.yml
docker compose --env-file env/.env up -d
```

## Multi-stand setup

To add another stand (local host, `192.168.1.42`, or any future host):

1. Add metrics target file:

```bash
cp overlays/examples/stand-192.168.1.42.targets.example.yml overlays/targets/stand-192.168.1.42.yml
docker compose --env-file env/.env up -d prometheus
```

2. On that remote stand, run promtail agent to ship logs to central Loki:

```bash
cd infra/observability/agents/promtail
cp .env.example .env
docker compose --env-file .env up -d
```

Central stack will then show metrics and logs for all connected stands.

## Multi-service contract (for any microservice)

Any microservice or stand can use this central ObservabilityStack if it follows:

1. **Metrics contract**
   - expose `GET /metrics` in Prometheus format;
   - add one target entry with labels `env`, `host`, `stand`, `service`.

2. **Logs contract**
   - write logs to stdout/stderr (prefer structured JSON logs);
   - run remote `promtail-agent` with:
     - `HOST_ALIAS=<stand-host>`
     - `STAND_NAME=<stand-id>`
     - `LOKI_PUSH_URL=http://<central-observability>:3100/loki/api/v1/push`

3. **Query contract**
   - Prometheus filtering by labels: `stand`, `service`, `env`;
   - Loki filtering by labels: `job`, `stand`, `service`, `host`.

## Fast registration (metrics target)

Use helper script to register new stand/service metrics target:

```bash
cd infra/observability
./scripts/register-stand-target.sh <stand_name> <host_ip_or_dns> <service_name> <metrics_port> <env>
docker compose --env-file env/.env up -d prometheus
```

## Health endpoints

- Grafana: `http://<host>:<GRAFANA_PORT>/api/health`
- Prometheus: `http://<host>:<PROMETHEUS_PORT>/-/healthy`
- Loki build info: `http://<host>:<LOKI_PORT>/loki/api/v1/status/buildinfo`

## Dashboards

- `Hub API Health`
- `Hub Auth And Degraded`
- `Infra Runtime`
- `Multi Stand Service Overview`
- `Multi Stand Logs Overview`
- `AprilHub Unified Error Overview`
