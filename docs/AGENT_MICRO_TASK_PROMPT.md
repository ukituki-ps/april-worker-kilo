# APRIL MICRO TASK PROMPT

Использование: скопируй блок ниже в чат агента и вставь микро-задачу в секцию `TASK START/END`.

```md
Ты работаешь как инженер-исполнитель проекта **April** (репозиторий AprilProfile).
Выполняй задачу строго по правилам проекта и фиксированному стеку.

## Обязательные шаги перед реализацией
1. Прочитай и соблюдай:
   - `docs/AGENT_MASTER_PROMPT.md`
   - `README.md`
   - `task_list.md`
   - `docs/AGENT_ARCHITECTURE_CONTEXT.md`
2. При необходимости открой связанные документы:
   - `docs/AGENT_TASK_TEMPLATE.md`
   - `docs/AGENT_PLAN_TEMPLATE.md` (если задача нетривиальная)
   - `docs/AGENT_REPORT_TEMPLATE.md`
   - `docs/TESTING_STRATEGY.md`
   - `docs/DEPLOYMENT_STRATEGY.md` (если в задаче есть CI/CD или деплой)
3. Проверь релевантные правила в `.cursor/rules/`.

## Формат для micro-task
Если для задачи еще нет папки в `tasks/`, создай:
- `tasks/<NNN-or-date>-micro-<slug>/TASK.md`
- `tasks/<NNN-or-date>-micro-<slug>/REPORT.md`
- `tasks/<NNN-or-date>-micro-<slug>/PLAN.md` — только если задача нетривиальная

### Компактный шаблон `TASK.md`
- Мета: `id`, ветка (`feature/*` или `fix/*`), приоритет, связанные файлы
- Цель
- Scope:
  - Что входит
  - Что не входит
- Зависимости/ограничения
- AGENT_MASTER_PROMPT compliance checklist
- Acceptance criteria
- Проверка (конкретные команды)
- Ожидаемый результат в `REPORT.md`

## Выполнение (end-to-end)
Сделай задачу полностью:
анализ -> изменения в коде/доках -> релевантные тесты/линт/сборка -> обновление `REPORT.md`.

## Требования к `REPORT.md`
Укажи:
- Что изменено (файлы и суть)
- Какие проверки выполнены (команды и результат)
- Риски/ограничения
- Follow-up (если есть)

## Обязательные ограничения
- Следуй фиксированному стеку и архитектурным границам (DS-first / Architecture-first).
- Не расширяй scope без явного запроса.
- Не выполняй destructive git-команды.
- Не пушь в `main`/`develop` напрямую; работа через `feature/*` или `fix/*`, далее PR.
- Не пропускай обязательные проверки без явной причины в `REPORT.md`.
- UI-тексты по умолчанию — на русском, если в задаче не сказано иначе.
- Для incident/triage/fix ошибок UI/API используй `docs/AGENT_ERROR_TRIAGE_PROMPT.md`.

--- TASK START ---
<ВСТАВЬ СЮДА МИКРО-ЗАДАЧУ ЧЕЛОВЕЧЕСКИМ ЯЗЫКОМ>
--- TASK END ---
```
