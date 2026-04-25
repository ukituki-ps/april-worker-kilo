# Agent-first разработка в экосистеме April

Документ задаёт минимальный обязательный контекст для агента/разработчика при работе с AprilHub.

## Обязательный контекст перед изменениями

1. `README.md` (корень репозитория)
2. `task_list.md` (корень репозитория)
3. `docs/AGENT_ARCHITECTURE_CONTEXT.md`
4. `docs/AGENT_STEP_BY_STEP_PLAN.md`
5. `TASK.md` в текущей папке `tasks/<NNN-slug>/`

Шаблоны для артефактов:
- План: `docs/AGENT_PLAN_TEMPLATE.md`
- Отчёт: `docs/AGENT_REPORT_TEMPLATE.md`

Инциденты и triage ошибок UI/API (корреляция Sentry → Loki → Prometheus): [`docs/AGENT_ERROR_TRIAGE_PROMPT.md`](../AGENT_ERROR_TRIAGE_PROMPT.md).

## Service map (экосистема April)

- UI и UX-композиция: `hub-shell`
- API aggregation и role-gated endpoints: `hub-bff`
- IAM / источник ролей и прав: Keycloak
- Data/runtime зависимости: PostgreSQL, Redis/Asynq
- Observability: Promtail, Loki, Grafana, Prometheus
- Workflow/automation: Temporal (в рамках фиксированного стека платформы)

Актуальные границы архитектуры: `docs/AGENT_ARCHITECTURE_CONTEXT.md`.

## Правила контекста и ограничений

- Не создавать альтернативные "source of truth" документы.
- OpenAPI, ADR, C4 и guide-документы должны оставаться связанными, а не дублированными.
- БД-схема меняется только через Atlas-процесс.
- IAM-политика не дублируется в обход Keycloak-модели.
- При спорных архитектурных изменениях предлагать фиксацию решения в ADR.

## Операционный контекст

- Deploy/dev flow: `docs/DEPLOYMENT_STRATEGY.md`
- Тестовые уровни и gate: `docs/TESTING_STRATEGY.md`
- Observability navigation: [`OBSERVABILITY_INDEX.md`](./OBSERVABILITY_INDEX.md)
- Общая карта документации: [`APRILHUB_DOCUMENTATION_MAP.md`](./APRILHUB_DOCUMENTATION_MAP.md)

## Минимальный end-to-end цикл задачи

1. Прочитать постановку и границы scope.
2. Подготовить/обновить `PLAN.md` (если задача нетривиальна).
3. Внести изменения в код/документацию.
4. Выполнить релевантные проверки.
5. Обновить `REPORT.md` с фактическими командами и статусом.
