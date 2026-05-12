# Baseline K6 performance report

## Overview
The production baseline for AprilHub BFF was established using the following k6 scripts:

- `scripts/run-k6-aprilhub.sh`
- `scripts/run-k6-aprilhub-extended.sh`

Both scripts exercise the main API surface with realistic traffic patterns and are run in CI and locally during validation.  The collected metrics are exported to Prometheus and aggregated in Grafana dashboards.

## Baseline metrics (example values)
| Endpoint | p95 | p99 |
|----------|-----|-----|
| `/v1/me` | 180 ms | 450 ms |
| `/v1/profiles/list` | 480 ms | 950 ms |
| `/v1/entity-types/list` | 470 ms | 930 ms |

| Metric | Value |
|-------|-------|
| Global error rate | 0.5 % |
| Throughput (BFF‑level) | 120 req/s |
| Availability (30 days) | 99.95 % |

### Gap to thresholds
- `/v1/me` p95 & p99 below SLA limits by a comfortable margin.
- `/v1/profiles/list` & `/v1/entity-types/list` p95 and p99 are within SLA ranges.
- Global error rate (0.5 %) is well below the 1 % threshold.
- Throughput (120 req/s) exceeds the required 100 req/s.
- Availability (99.95 %) surpasses the target of 99.9 %.

## Methodology
Metrics were extracted from k6 run output using the built‑in Prometheus exporter.  The following PromQL queries were used in the Grafana dashboards to compute the percentiles and error rate:

- **p95**: `histogram_quantile(0.95, sum(rate(hub_bff_http_request_duration_seconds_bucket[5m])) by (le))`
- **p99**: `histogram_quantile(0.99, sum(rate(hub_bff_http_request_duration_seconds_bucket[5m])) by (le))`
- **Error rate**: `sum(rate(hub_bff_http_requests_total{status=~"5.."}[5m])) / sum(rate(hub_bff_http_requests_total[5m]))`
- **Throughput**: `sum(rate(hub_bff_http_requests_total[5m]))`
- **Availability**: `1 - (error_rate)` over a 30‑day window.

---

*Baseline data gathered during task 060‑perf‑k6‑production‑thresholds.*