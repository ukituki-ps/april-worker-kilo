# План: агентный промпт triage/fix для ошибок UI/API

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-25
- **Статус плана:** согласован

## Исходные допущения

- Архитектурный baseline error telemetry уже зафиксирован в `docs/architecture/ERROR_TELEMETRY_MODEL.md` и runbook `APRIL_ERROR_TELEMETRY_TRIAGE.md`; промпт ссылается на них, а не копирует.
- Зеркало для `april-profile-1` — отдельная заметка в папке задачи, без доступа к внешнему репозиторию из этого PR.

## Порядок работ (шаги)

1. Согласовать структуру `docs/AGENT_ERROR_TRIAGE_PROMPT.md` с критериями TASK (входы, контекст, слои, anti-patterns, отчёт, Sentry↔Loki↔Prometheus).
2. Обновить навигацию: `AGENT_MASTER_PROMPT.md`, `APRILHUB_AGENT_DEVELOPMENT.md`, `APRILHUB_DOCUMENTATION_MAP.md`, `docs/README.md`, `OBSERVABILITY_INDEX.md`.
3. Добавить `EXTERNAL_MIRROR_APRIL_PROFILE_1.md` и `REPORT.md` с примером применения.

## Затрагиваемые области

| Область | Что меняется |
|--------|----------------|
| Документация | Новый промпт, ссылки в agent/observability entrypoints |
| Код / БД / инфра | Нет |

## Риски и откат

- **Риск:** расхождение формулировок с runbook → **Митигация:** явные отсылки на `APRIL_ERROR_TELEMETRY_TRIAGE.md`.
- Откат: revert коммита с документацией.

## Проверка после выполнения

- `make docs-build` (опционально, при изменениях docs-site — здесь не требуется).
- Ручная проверка относительных ссылок в новых/изменённых markdown-файлах.

## Примечания

- Связанные задачи: `033` (architecture), `035-038` (Sentry rollout/implementation).
