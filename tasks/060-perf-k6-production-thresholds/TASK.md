# Задача 060: k6 Production Thresholds

## Meta
- **ID / ветка:** `060-perf-k6-production-thresholds`
- **Приоритет:** высокий (Phase 9 — Performance трек, нет зависимостей)
- **ADR:** [`docs/architecture/ADR-april-phase-9-security-and-performance.md`](../../docs/architecture/ADR-april-phase-9-security-and-performance.md)

## Цель
На основе существующих k6 baseline сценариев определить production performance thresholds (SLA), configure Prometheus alerts для deviation и задокументировать thresholds.

## Контекст для агента
- k6 scripts: `scripts/run-k6-aprilhub.sh`, `scripts/run-k6-aprilhub-extended.sh`
-existing baseline data: k6 run'ы выполнялись в CI и локально
- Prometheus + Alertmanager: уже configured (observability стек из Phase 033–041)
- Grafana dashboards: operational (задача 040)

## Входит в объём

### SLA Definition
- [ ] Response time thresholds per endpoint:
  - `/v1/me`: p95 < 200ms, p99 < 500ms
  - `/v1/profiles/list`: p95 < 500ms, p99 < 1000ms
  - `/v1/entity-types/list`: p95 < 500ms, p99 < 1000ms
  - SSE `/sse`: connection establishment < 100ms, message delivery < 200ms
- [ ] Error rate: < 1% для всех endpoints
- [ ] Throughput: > 100 req/sec per BFF instance (с rate limiting)
- [ ] Availability: 99.9% uptime (SLO)

### k6 Baseline Analysis
- [ ] Запустить `run-k6-aprilhub.sh` и `run-k6-aprilhub-extended.sh`
- [ ] Собрать metrics: response times, throughput, errors, resource usage
- [ ] Сравнить с текущими thresholds — определить gap
- [ ] Задокументировать baseline data в `REPORT.md`

### Prometheus Alerts
- [ ] Alert rule: `response_time_p95_threshold_bff` — p95 > 500ms на 5 min → Warning
- [ ] Alert rule: `response_time_p99_threshold_bff` — p99 > 1000ms на 2 min → Critical
- [ ] Alert rule: `error_rate_threshold_bff` — error rate > 1% на 5 min → Warning
- [ ] Alert rule: `availability_slo_bff` — uptime < 99.9% на 15 min → Critical
- [ ] Alert route: Grafana → Slack/Email (или existing alert channel)

### Documentation
- [ ] `docs/performance/sla-thresholds.md` — SLA definition per endpoint
- [ ] `docs/performance/k6-baseline-report.md` — baseline data, current gaps
- [ ] Alert rules в `infra/prometheus/alerts/aprilhub-perf.yaml`

## Не входит в объём
- Оптимизация кода (это задачи 061, 062, 063)
- Infrastructure scaling (separate infra epic)
- Production load testing (dev-стенд data достаточно)

## Технические ограничения
- k6 scripts: существующие, не менять сценарии
- Prometheus: existing config в `infra/prometheus/`
- Grafana: existing dashboards — не ломать

## Критерии готовности (acceptance)
- [ ] k6 baseline запущен, metrics собраны
- [ ] SLA thresholds определены и задокументированы
- [ ] Prometheus alert rules созданы и работают
- [ ] `docs/performance/sla-thresholds.md` создана
- [ ] `REPORT.md` с baseline data и recommended thresholds

## Проверка
```bash
# Run k6 baseline
./scripts/run-k6-aprilhub.sh
./scripts/run-k6-aprilhub-extended.sh

# Check Prometheus alerts
curl http://localhost:9090/api/v1/rules | jq '.data.rules[] | select(.labels.alert =~ "aprilhub-perf")'

# Check Grafana dashboard
# Open Grafana → AprilHub Performance Dashboard → verify panels
```

## Результат в отчёте
Baseline data table, SLA thresholds, alert rules, docs.
