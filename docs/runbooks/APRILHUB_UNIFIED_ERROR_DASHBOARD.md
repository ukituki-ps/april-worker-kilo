# AprilHub Unified Error Dashboard Runbook

## Назначение

`AprilHub Unified Error Overview` — единый экран в Grafana для ежедневного мониторинга ошибок по слоям:

- frontend runtime (по логам),
- `hub-bff` API (по метрикам + логам),
- downstream / `april-profile` (по метрикам + логам).

Dashboard UID: `aprilhub-unified-error-overview`.

## Где открыть

- Grafana стенда: `http://192.168.1.29:3300/`
- Dashboard: `AprilHub Unified Error Overview`

## Основные фильтры

- `env` — окружение для метрик Prometheus.
- `stand` — стенд из target labels.
- `host` — хост логов (Loki label).
- `service` — сервис (Loki label, ограничивает и metrics-панели).
- `contains` — regex/шаблон для log-drill-down (по умолчанию `ERROR|exception|503`).
- `correlation` — `requestId`/`correlationId` для точечного расследования.

## Как использовать (быстрый triage)

1. Проверить верхние KPI:
   - `All Error Events`,
   - `Hub BFF 5xx Ratio`,
   - `AprilProfile 5xx Ratio`,
   - `Frontend Runtime Errors`.
2. На панели `Error Rate by Service` определить проблемный сервис.
3. На панели `HTTP Error Rate by Route` и `Top 5xx Routes` локализовать endpoint/route.
4. В `Drill-down Logs` задать:
   - `contains` = `ERROR|exception|timeout|503` (или точный фрагмент),
   - `correlation` = `requestId`/`correlationId`.
5. Сопоставить окно времени с алертами Prometheus и Sentry-инцидентом (если есть).

## Базовые пороги инцидента

- `5xx ratio > 0.05` более 10 минут на `hub-bff` или `april-profile`.
- Повторяющиеся frontend runtime ошибки на одном route/module.
- Резкий рост логов с `error/exception/panic` в сравнении с базовым уровнем.

## Эскалация

- Frontend runtime / widget issues -> владельцы `hub-shell`/виджета.
- API `4xx/5xx` на `hub-bff` -> владелец `hub-bff`.
- Ошибки `april-profile` routes -> владелец downstream сервиса.
- Массовый `target down`/деградация нескольких сервисов -> infra/on-call.

## Ограничения

- Дашборд использует labels `env/stand/host/service`; если метки не заполнены, часть панелей покажет неполные данные.
- Поиск `requestId/correlationId` выполняется full-text через Loki logs (`contains`/`correlation`), без выделения этих полей в labels.
- Sentry отображается в отдельном контуре; этот dashboard покрывает операционный слой (Loki/Prometheus/Grafana).
