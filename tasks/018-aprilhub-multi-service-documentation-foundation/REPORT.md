## 1) Итого

- Статус: ✅ выполнено (итерация ObservabilityStack baseline)
- Среда deploy: `192.168.1.29`
- Цель: подготовить переносимые observability-артефакты и проверить запуск на отдельной инфраструктуре

## 2) Что сделано

- Добавлен переносимый контур `infra/observability/*`:
  - `docker-compose.yml`
  - `config/loki/loki.yml`
  - `config/promtail/promtail.yml`
  - `config/prometheus/prometheus.yml`
  - `env/.env.example`
  - `overlays/192.168.1.29.env`
  - `overlays/192.168.1.29.prometheus.targets.yml`
  - `overlays/examples/aprilhub-targets.example.yml`
  - `grafana/provisioning/*`
  - `grafana/dashboards/*`
  - `README.md`
- Добавлены runbooks:
  - `docs/runbooks/OBSERVABILITY_STACK_DEPLOY.md`
  - `docs/runbooks/OBSERVABILITY_STACK_ONBOARDING.md`
- Добавлены guide-артефакты для human-first и agent-first контуров:
  - `docs/guides/OBSERVABILITY_MULTI_STAND_OPERATING_MODEL.md`
  - `docs/guides/OBSERVABILITY_AGENT_PLAYBOOK.md`
- Выполнен deploy по SSH на `192.168.1.29`:
  - артефакты синхронизированы в `/opt/april/infra/observability`
  - стек поднят командой `docker compose --env-file env/.env up -d`
  - health и ingestion проверены.
- Реализована multi-stand/multi-service модель:
  - регистрация стендов/сервисов через `infra/observability/scripts/register-stand-target.sh`;
  - remote log shipping через `infra/observability/agents/promtail/*`;
  - единые dashboards:
    - `Multi Stand Service Overview`
    - `Multi Stand Logs Overview`
  - baseline alert rules в `infra/observability/config/prometheus/rules/aprilhub-alerts.yml`.

## 3) Проверка

Фактически выполненные проверки на `192.168.1.29`:

- `docker compose --env-file env/.env ps`
- `curl http://127.0.0.1:3300/api/health` (Grafana OK)
- `curl http://127.0.0.1:9090/-/healthy` (Prometheus OK)
- `curl http://127.0.0.1:3100/loki/api/v1/status/buildinfo` (Loki API OK)
- `curl http://127.0.0.1:9090/api/v1/targets`:
  - `prometheus`, `node_exporter`, `cadvisor` = `up`
  - `aprilhub_dynamic_targets (192.168.1.29:8081)` = `up` (после подключения текущего `hub-bff` стенда)
- `curl -G http://127.0.0.1:3100/loki/api/v1/query ...`:
  - логи в Loki поступают (проверка `job="docker"` успешна).
- `curl http://127.0.0.1:9090/api/v1/rules`:
  - alert rules загружены и доступны.

## 4) Параметры подключения для проекта

- Grafana: `http://192.168.1.29:3300`
- Prometheus: `http://192.168.1.29:9090`
- Loki: `http://192.168.1.29:3100`
- Datasources в Grafana:
  - `Prometheus` -> `http://prometheus:9090`
  - `Loki` -> `http://loki:3100`

## 5) Ограничения и follow-up

- Для удаленных стендов требуется сетевой доступ до центрального Loki (`3100/tcp`) и Prometheus scrape до metrics endpoint.
- Для production рекомендуется вынести секреты (`GRAFANA_ADMIN_PASSWORD`) в защищенный secret-store.
- При переносе на другие хосты достаточно:
  - обновить `env/.env` через соответствующий overlay;
  - добавить актуальные `overlays/targets/<env>.yml`.
