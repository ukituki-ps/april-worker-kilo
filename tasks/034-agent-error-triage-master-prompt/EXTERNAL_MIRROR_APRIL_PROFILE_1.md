# Зеркалирование: `AGENT_ERROR_TRIAGE_PROMPT` в репозитории april-profile-1

Цель: тот же **операционный** triage/fix-процесс для агента в доменном репозитории AprilProfile, с адаптацией путей и границ сервисов.

## Что сделать во внешнем репозитории

1. Скопировать содержимое `docs/AGENT_ERROR_TRIAGE_PROMPT.md` из **april-worker** (после merge задачи `034`) в аналогичный путь, принятый в april-profile-1 для agent-доков, например:
   - предпочтительно: `docs/AGENT_ERROR_TRIAGE_PROMPT.md`
   - либо `docs/agent/AGENT_ERROR_TRIAGE_PROMPT.md` — если в профиле так принято; тогда обновить все внутренние ссылки в копии.

2. В копии заменить ориентиры по сервисам:
   - вместо единственного `hub-shell` / `hub-bff` указать фактические имена: domain frontend (если есть), **AprilProfile API**, workers и т.д.;
   - сохранить упоминание **AprilHub как host**: интеграционные инциденты по-прежнему коррелируются через `requestId`/`correlationId` с логами BFF/host при необходимости.

3. Добавить ссылки из профилевых entrypoints (аналог `APRILHUB_AGENT_DEVELOPMENT.md` / карты документации / `AGENT_MASTER_PROMPT`) на новый файл.

4. Сохранить **неизменным** обязательный flow **Sentry → Loki → Prometheus** и отсылки на общую модель в april-worker, если в профиле нет дублирующего `ERROR_TELEMETRY_MODEL.md`:
   - использовать каноническую ссылку на репозиторий Hub или дублировать краткий excerpt по согласованию с задачей `039` (AprilProfile observability docs).

5. Опционально: задача/issue во внешнем трекере с ID вроде «зеркало 034 april-worker» для связности roadmap.

## Минимальный diff смысла

| april-worker | april-profile-1 |
|----------------|-----------------|
| `hub-shell`, `hub-bff` | domain UI / profile API / свои сервисы |
| `docs/architecture/ERROR_TELEMETRY_MODEL.md` | ссылка на Hub или локальный mirror после `039` |
| `tasks/034-.../EXTERNAL_MIRROR_*` | не копировать; завести свой `REPORT` по внедрению |

## Acceptance для внешней стороны

- [ ] Файл промпта доступен по стабильному пути в docs.
- [ ] Agent/onboarding документы ссылаются на промпт для incident-сессий.
- [ ] Указано, где каноническая модель корреляции (Hub `ERROR_TELEMETRY_MODEL` или локальный документ).
