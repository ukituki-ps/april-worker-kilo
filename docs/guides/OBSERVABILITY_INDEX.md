# Observability Index

Единая точка входа по central observability для April ecosystem (multi-service + multi-stand).

## Who should read what

- Developer / DevOps:
  - `docs/guides/OBSERVABILITY_MULTI_STAND_OPERATING_MODEL.md`
  - `docs/runbooks/OBSERVABILITY_STACK_DEPLOY.md`
  - `docs/runbooks/OBSERVABILITY_STACK_ONBOARDING.md`
- Agent:
  - `docs/guides/OBSERVABILITY_AGENT_PLAYBOOK.md`
  - `docs/AGENT_ERROR_TRIAGE_PROMPT.md` (incident: UI/API; корреляция Sentry → Loki → Prometheus)
  - `infra/observability/README.md`

## Core artifacts

- Stack root: `infra/observability/`
- Error telemetry architecture: `docs/architecture/ERROR_TELEMETRY_MODEL.md`
- Compose: `infra/observability/docker-compose.yml`
- Prometheus config: `infra/observability/config/prometheus/prometheus.yml`
- Alert rules:
  - `infra/observability/config/prometheus/rules/aprilhub-alerts.yml`
  - `infra/observability/config/prometheus/rules/aprilprofile-alerts.yml` (AprilProfile)
- Promtail (central): `infra/observability/config/promtail/promtail.yml`
- Promtail agent (remote stands): `infra/observability/agents/promtail/`
- Dashboards:
  - `infra/observability/grafana/dashboards/multi-stand-overview.json`
  - `infra/observability/grafana/dashboards/multi-stand-logs-overview.json`
  - `infra/observability/grafana/dashboards/april-profile-service-overview.json` (AprilProfile; UID `april-profile-service-overview`)

## Quick scenarios

### 1) Deploy or update central stack

```bash
cd infra/observability
docker compose --env-file env/.env pull
docker compose --env-file env/.env up -d
```

Reference:
- `docs/runbooks/OBSERVABILITY_STACK_DEPLOY.md`

### 2) Add metrics for a new stand/service

```bash
cd infra/observability
./scripts/register-stand-target.sh <stand_name> <host> <service_name> <metrics_port> <env>
docker compose --env-file env/.env up -d prometheus
```

Reference:
- `docs/runbooks/OBSERVABILITY_STACK_ONBOARDING.md`

### 3) Add logs from a remote stand

```bash
cd infra/observability/agents/promtail
cp .env.example .env
docker compose --env-file .env up -d
```

Reference:
- `docs/runbooks/OBSERVABILITY_STACK_ONBOARDING.md`

### 4) Verify that onboarding worked

- Prometheus targets: `http://<prometheus-host>:9090/targets`
- Grafana dashboards:
  - `Multi Stand Service Overview`
  - `Multi Stand Logs Overview`
  - `AprilProfile Service Overview`
- Loki explore query:

```logql
{job=~"docker|docker_remote",stand="<stand_name>",service="<service_name>"}
```

## Incident quick links

- Error telemetry triage (`Sentry -> Loki -> Prometheus -> RCA`):
  - `docs/runbooks/APRIL_ERROR_TELEMETRY_TRIAGE.md`
- Deploy and health troubleshooting:
  - `docs/runbooks/OBSERVABILITY_STACK_DEPLOY.md`
- Onboarding and query troubleshooting:
  - `docs/runbooks/OBSERVABILITY_STACK_ONBOARDING.md`
- AprilProfile SLO (черновик) и алерты:
  - `docs/runbooks/APRILPROFILE_SLO_DRAFT.md`
- Agent execution checklist:
  - `docs/guides/OBSERVABILITY_AGENT_PLAYBOOK.md`

## Documentation ownership

- Architecture and operating model:
  - `docs/guides/OBSERVABILITY_MULTI_STAND_OPERATING_MODEL.md`
- Runtime and command examples:
  - `infra/observability/README.md`
- Process and verification history:
  - `tasks/018-aprilhub-multi-service-documentation-foundation/REPORT.md`
