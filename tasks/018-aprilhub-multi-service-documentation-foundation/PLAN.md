# План: Multi-service documentation foundation (Этап 018)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-17
- **Статус плана:** в работе

## Цель итерации

Подготовить переносимый baseline артефактов observability и операционные инструкции, чтобы стек `Promtail + Loki + Prometheus + Grafana` можно было воспроизводимо поднимать на новых инфраструктурах с минимальными host-specific overlays.

## Шаги

1. Создать структуру `infra/observability` с `docker-compose.yml`, конфигами и env-шаблоном.
2. Добавить provisioning Grafana (datasources, dashboard providers, baseline dashboards).
3. Оформить runbooks deploy/onboarding/troubleshooting в `docs/runbooks`.
4. Выполнить удаленный deploy на `192.168.1.29` и проверить health/ingestion.
5. Зафиксировать результаты и параметры подключения в `REPORT.md`.

## Проверки

- `docker compose --env-file env/.env up -d` в `infra/observability`
- health-check endpoints Grafana/Prometheus/Loki API
- Loki query на наличие логов
- Prometheus `/targets` на статус scrape jobs
