# APRILHUB Testing Quality Metrics (Этап 020)

Runbook описывает минимальные метрики качества для P1/P2 testing extensions и порядок наблюдения за ними.

## Источники данных

- Workflow: `.github/workflows/testing-extensions-nightly.yml`.
- Artifacts:
  - `aprilhub-playwright-artifacts`
  - `aprilhub-integration-quality-metrics`
  - `aprilhub-k6-extended-artifacts`
- Файлы метрик в артефактах: `quality-metrics.json`.

## Набор метрик

- `duration_seconds` — длительность job.
- `run_attempt` — номер попытки workflow run.
- `is_retry` — признак повторного запуска (`run_attempt > 1`).
- `status` — итоговый статус исполнения джобы.

## Правила реакции

1. **Деградация длительности**
   - Триггер: рост `duration_seconds` > 20% к медиане последних 7 запусков.
   - Действие: проверить изменения в зависимостях/compose startup, зафиксировать результат в `docs/notes.md` или в задаче.

2. **Флаки / ретраи**
   - Триггер: `is_retry=true` хотя бы в одном nightly запуске.
   - Действие: создать triage note с указанием failing step и ссылкой на artifacts.

3. **Повторяющиеся падения**
   - Триггер: >=2 последовательных падения одного и того же nightly job.
   - Действие: завести follow-up задачу в `task_list.md`/`tasks/` с owner и сроком.

## Минимальный triage checklist

1. Сохранить ссылку на workflow run.
2. Приложить ключевой артефакт (`playwright trace`, `k6 log/summary`, `integration quality-metrics`).
3. Зафиксировать первопричину и corrective action.
4. Если причина инфраструктурная, отметить влияние на P0-gate (не должен быть затронут без отдельного решения команды).
