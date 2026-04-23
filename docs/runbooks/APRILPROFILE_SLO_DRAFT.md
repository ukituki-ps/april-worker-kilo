# AprilProfile — черновик SLO (dev / stage)

Статус: **черновик** для согласования с владельцем стенда и командой AprilHub. Не является организационной error-budget политикой.

## Скоуп

- Сервис: **AprilProfile** (`april-profile`), метрики namespace `april_profile_*` (см. задачу 018 в репозитории april-profile).
- Измерение: центральный **Prometheus** AprilHub, job **`aprilhub_dynamic_targets`**, labels из target-файла: `env`, `stand`, `host`, `service`.
- Имя **`service`** в targets при регистрации должно совпадать с алертами в `aprilprofile-alerts.yml` (по умолчанию зафиксировано **`april-profile`**). При другом имени — скорректировать recording/alert matchers или завести follow-up.

## Цели (предложение)

| SLI | Описание | Цель (rolling window) | PromQL (идея) |
|-----|-----------|------------------------|---------------|
| Доступность | Доля успешных проверок готовности | 99% за 30 дней | Доля времени, когда `/readyz` отдаёт 2xx (по `april_profile_http_requests_total{route="/readyz",status=~"2.."}`) — уточнить окно и burn-rate алерты отдельно |
| Латентность | p95 HTTP API (исключая health-only маршруты при необходимости) | p95 < 500 ms на dev (не SLO prod) | `histogram_quantile(0.95, sum(rate(april_profile_http_request_duration_seconds_bucket[5m])) by (le))` с фильтром по `service` / `route` |
| Ошибки | Доля 5xx | < 0.1% (prod-ориентир; dev — см. алерт `AprilProfileHigh5xxRate`) | `sum(rate(...{status=~"5.."})) / sum(rate(...))` |

## Окно и error budget (черновик)

- **Окно наблюдения для дашбордов:** 6h / 24h (Grafana).
- **Error budget:** не выделен на уровне организации; при срабатывании алертов — ручная эскалация по процессу стенда (владелец AprilHub / on-call), без автоматизации вне scope задачи 019.

## Burn rate / эскалация

1. Проверить `AprilHubTargetDown` (общий scrape) и `AprilProfile*` алерты в Prometheus / Alertmanager.
2. Логи Loki: `{service="april-profile", stand="<stand>"}` и поиск по `requestId` из заголовка ответа.
3. Эскалация: владелец микросервиса april-profile + владелец стенда AprilHub (см. `OBSERVABILITY_STACK_ONBOARDING.md`).

## Откат / шум

- Ложные срабатывания из-за отсутствия трафика: рассмотреть `silence` для `AprilProfileHTTPMetricsMissing` на dev.
- Откат конфигурации: revert PR с правилами/дашбордом в april-worker.

## Связанные документы

- [OBSERVABILITY_INDEX.md](../guides/OBSERVABILITY_INDEX.md)
- [OBSERVABILITY_STACK_ONBOARDING.md](./OBSERVABILITY_STACK_ONBOARDING.md)
- Задача-источник метрик (AprilProfile): `tasks/018-phase-4-prometheus-metrics-logs-correlation/TASK.md` в репозитории april-profile.
