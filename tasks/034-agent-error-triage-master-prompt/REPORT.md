## 1) Итого

- Статус: ✅ выполнено
- Задача: отдельный агентный промпт triage/fix для ошибок UI/API с корреляцией Sentry → Loki → Prometheus
- Ветка: `feature/034-agent-error-triage-master-prompt`
- Коммиты: сообщение `docs(034): agent error triage prompt and doc navigation` на ветке `feature/034-agent-error-triage-master-prompt` (актуальный SHA: `git rev-parse --short HEAD`)
- PR: не создавался

## 2) Что сделано

- [docs] Добавлен операционный промпт [`docs/AGENT_ERROR_TRIAGE_PROMPT.md`](../../docs/AGENT_ERROR_TRIAGE_PROMPT.md): входы инцидента, обязательный сбор контекста (Sentry, route, `requestId`, роль Keycloak, `tenant`), алгоритм слоёв frontend → BFF → downstream → infra, правила и anti-patterns, формат отчёта, чеклисты «до/после фикса», копируемый блок для чата.
- [docs] Зафиксирован обязательный flow **Sentry → Loki → Prometheus** со ссылками на [`docs/architecture/ERROR_TELEMETRY_MODEL.md`](../../docs/architecture/ERROR_TELEMETRY_MODEL.md) и [`docs/runbooks/APRIL_ERROR_TELEMETRY_TRIAGE.md`](../../docs/runbooks/APRIL_ERROR_TELEMETRY_TRIAGE.md).
- [docs] Обновлены ссылки: [`docs/AGENT_MASTER_PROMPT.md`](../../docs/AGENT_MASTER_PROMPT.md), [`docs/AGENT_TASK_TEMPLATE.md`](../../docs/AGENT_TASK_TEMPLATE.md), [`docs/README.md`](../../docs/README.md), [`docs/guides/APRILHUB_AGENT_DEVELOPMENT.md`](../../docs/guides/APRILHUB_AGENT_DEVELOPMENT.md), [`docs/guides/APRILHUB_DOCUMENTATION_MAP.md`](../../docs/guides/APRILHUB_DOCUMENTATION_MAP.md), [`docs/guides/OBSERVABILITY_INDEX.md`](../../docs/guides/OBSERVABILITY_INDEX.md), [`docs/guides/OBSERVABILITY_AGENT_PLAYBOOK.md`](../../docs/guides/OBSERVABILITY_AGENT_PLAYBOOK.md).
- [docs] План задачи: [`PLAN.md`](./PLAN.md).
- [docs] Внешняя заметка для зеркала в `april-profile-1`: [`EXTERNAL_MIRROR_APRIL_PROFILE_1.md`](./EXTERNAL_MIRROR_APRIL_PROFILE_1.md).

## 3) Изменённые и новые файлы

- `docs/AGENT_ERROR_TRIAGE_PROMPT.md` (новый)
- `docs/AGENT_MASTER_PROMPT.md`
- `docs/AGENT_TASK_TEMPLATE.md`
- `docs/README.md`
- `docs/guides/APRILHUB_AGENT_DEVELOPMENT.md`
- `docs/guides/APRILHUB_DOCUMENTATION_MAP.md`
- `docs/guides/OBSERVABILITY_INDEX.md`
- `docs/guides/OBSERVABILITY_AGENT_PLAYBOOK.md`
- `tasks/034-agent-error-triage-master-prompt/PLAN.md` (новый)
- `tasks/034-agent-error-triage-master-prompt/EXTERNAL_MIRROR_APRIL_PROFILE_1.md` (новый)
- `tasks/034-agent-error-triage-master-prompt/REPORT.md` (этот файл)
- `tasks/034-agent-error-triage-master-prompt/TASK.md` (acceptance)

## 4) Миграции и данные

- Миграции Atlas: нет
- Обратимость: да (revert коммита)

## 5) Проверка качества

- Линтер: не применялся (только Markdown)
- Сборка: не запускалась (изменения не в `docs-site/` исходниках приложения)
- Unit tests: не применялось

Команды (фактически выполненные):

```bash
# Рекомендуемая быстрая проверка при следующем изменении docs-site:
# make docs-build
```

## 6) Деплой

- Среда: нет
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md) — не требовался

## 7) Риски и ограничения

- Фактическая интеграция Sentry в коде — задачи `035–038`; промпт предполагает наличие issue/тегов по мере внедрения.
- Во внешнем `april-profile-1` пути к документам нужно выровнять вручную по [`EXTERNAL_MIRROR_APRIL_PROFILE_1.md`](./EXTERNAL_MIRROR_APRIL_PROFILE_1.md).

## 8) Пример применения промпта (краткий сценарий)

**Инцидент:** в Sentry — `unhandledrejection` на маршруте виджета профиля; в тегах есть `requestId=req-abc`, `route=/app/profile`, `tenant=t1`, роль `april_user`.

1. **Sentry:** подтвердить stacktrace (адаптер fetch vs parsing), breadcrumbs — последний вызов к BFF `/api/...`.
2. **Loki:** запрос с `|= "requestId=req-abc"` по сервисам `hub-bff` / `april-profile-api`; обнаружен ответ `503` от downstream с таймаутом агрегации.
3. **Prometheus/Grafana:** в окне инцидента — рост `503` и latency у BFF или target down у profile — классификация «downstream/infra» vs «точечный баг контракта».
4. **Фикс:** только после классификации (например увеличение таймаута — осознанное изменение политики; или исправление URL/контракта в адаптере) + тесты агрегации/e2e.
5. **Отчёт:** шесть пунктов из раздела «Обязательный формат отчёта» в [`AGENT_ERROR_TRIAGE_PROMPT.md`](../../docs/AGENT_ERROR_TRIAGE_PROMPT.md).

## 9) Что сделать зеркально в april-profile-1

- Выполнить чеклист в [`EXTERNAL_MIRROR_APRIL_PROFILE_1.md`](./EXTERNAL_MIRROR_APRIL_PROFILE_1.md): скопировать промпт, адаптировать имена сервисов и entrypoints, сохранить ссылку на каноническую модель корреляции в april-worker или на локальный документ после задачи `039`.
