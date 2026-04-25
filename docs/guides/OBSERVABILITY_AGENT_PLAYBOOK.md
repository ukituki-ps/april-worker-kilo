# Observability Agent Playbook

## Goal

Короткий agent-first сценарий для задач по central observability (deploy, onboarding, troubleshooting, verification) без расхождения с проектными артефактами.

## Source of truth

Перед действиями агент опирается на:

- `infra/observability/README.md`
- `docs/runbooks/OBSERVABILITY_STACK_DEPLOY.md`
- `docs/runbooks/OBSERVABILITY_STACK_ONBOARDING.md`
- `infra/observability/config/prometheus/prometheus.yml`
- `infra/observability/config/prometheus/rules/aprilhub-alerts.yml`
- UI/API incidents (агентный промпт + чеклисты): `docs/AGENT_ERROR_TRIAGE_PROMPT.md`
- Детальный triage-runbook: `docs/runbooks/APRIL_ERROR_TELEMETRY_TRIAGE.md`

## Standard workflow

### 1) Deploy / update central stack

1. Синхронизировать артефакты в `infra/observability`.
2. Выполнить:

```bash
cd infra/observability
docker compose --env-file env/.env pull
docker compose --env-file env/.env up -d
```

3. Проверить:
   - `docker compose --env-file env/.env ps`
   - `curl /api/health` Grafana
   - `curl /-/healthy` Prometheus
   - `curl /loki/api/v1/status/buildinfo` Loki

### 2) Register new stand/service metrics

```bash
cd infra/observability
./scripts/register-stand-target.sh <stand_name> <host> <service> <metrics_port> <env>
docker compose --env-file env/.env up -d prometheus
```

Проверка:

- Prometheus `/targets` -> target `UP`
- labels присутствуют: `env`, `host`, `stand`, `service`

### 2a) Auto-onboarding from deploy

Если стенд деплоится через `deploy.sh`, агент должен предпочитать автоматический путь:

```bash
OBS_AUTO_ONBOARD=1 \
OBS_CENTRAL_HOST=<central-host> \
OBS_CENTRAL_USER=<central-user> \
OBS_CENTRAL_OBS_PATH=/opt/april/infra/observability \
OBS_STAND_HOST=<stand-host> \
OBS_STAND_NAME=<stand-name> \
OBS_SERVICE_NAME=<service-name> \
OBS_METRICS_PORT=<metrics-port> \
OBS_ENV_NAME=<env> \
OBS_SETUP_LOCAL_PROMTAIL_AGENT=1 \
./deploy.sh
```

После деплоя проверить артефакт:

- `.deploy-artifacts/deploy-*/observability-onboard.log`

### 3) Register remote logs

На удаленном стенде:

```bash
cd infra/observability/agents/promtail
cp .env.example .env
docker compose --env-file .env up -d
```

Проверка на центральном Loki:

```logql
{job=~"docker|docker_remote",stand="<stand_name>",service="<service_name>"}
```

### 4) Dashboard verification

Обязательные проверки:

- `Multi Stand Service Overview`:
  - фильтры `host`, `stand`, `service` работают;
  - request/latency/error серии обновляются.
- `Multi Stand Logs Overview`:
  - фильтры `host`, `stand`, `service`, `contains` работают;
  - панели error/auth/degraded/timeout не пустые при генерации событий.

## Troubleshooting quick map

- Target `DOWN`:
  - проверить `overlays/targets/*.yml`;
  - проверить доступность `<host>:<port>/metrics`.
- Нет логов удаленного стенда:
  - проверить `promtail-agent` статус;
  - проверить `LOKI_PUSH_URL`;
  - проверить firewall до central Loki.
- Пустой dashboard:
  - проверить datasource;
  - проверить labels в Prometheus/Loki;
  - проверить time range.

## Reporting template (agent output)

Агент фиксирует:

1. Какие файлы изменены.
2. Какие команды выполнялись.
3. Health status сервисов.
4. Target status (`UP/DOWN`) и список подключенных стендов.
5. Какие dashboard/queries проверены.
6. Follow-up и ограничения.
