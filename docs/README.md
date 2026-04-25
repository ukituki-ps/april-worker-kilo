# Docs Entrypoints (AprilHub)

Этот файл даёт быстрый вход в документацию из `docs/` без поиска по всей структуре.

## Human-first

- Старт: [`../README.md`](../README.md)
- Что такое AprilHub: [`guides/APRILHUB_WHAT_IS_IT.md`](./guides/APRILHUB_WHAT_IS_IT.md)
- Как работает AprilHub: [`guides/APRILHUB_HOW_IT_WORKS.md`](./guides/APRILHUB_HOW_IT_WORKS.md)
- Как работать с проектом: [`guides/APRILHUB_TEAM_WORKFLOW.md`](./guides/APRILHUB_TEAM_WORKFLOW.md)
- Frontend strategy (host/widget): [`FRONTEND_STRATEGY.md`](./FRONTEND_STRATEGY.md)
- Контракты виджетов и host: [`WIDGET_CONTRACTS.md`](./WIDGET_CONTRACTS.md)

## Agent-first

- Архитектурный контекст и границы: [`AGENT_ARCHITECTURE_CONTEXT.md`](./AGENT_ARCHITECTURE_CONTEXT.md)
- Пошаговый процесс работы: [`AGENT_STEP_BY_STEP_PLAN.md`](./AGENT_STEP_BY_STEP_PLAN.md)
- Agent-first карта: [`guides/APRILHUB_AGENT_DEVELOPMENT.md`](./guides/APRILHUB_AGENT_DEVELOPMENT.md)
- Triage/fix ошибок UI/API (Sentry → Loki → Prometheus): [`AGENT_ERROR_TRIAGE_PROMPT.md`](./AGENT_ERROR_TRIAGE_PROMPT.md)

## Runtime / Ops / Quality

- Deploy strategy: [`DEPLOYMENT_STRATEGY.md`](./DEPLOYMENT_STRATEGY.md)
- Testing strategy: [`TESTING_STRATEGY.md`](./TESTING_STRATEGY.md)
- Observability index: [`guides/OBSERVABILITY_INDEX.md`](./guides/OBSERVABILITY_INDEX.md)
- Sentry rollout prep (AprilHub, task `035`): [`runbooks/APRILHUB_SENTRY_ROLLOUT_PREPARATION.md`](./runbooks/APRILHUB_SENTRY_ROLLOUT_PREPARATION.md)

## Architecture / Contracts

- Архитектурный индекс: [`architecture/README.md`](./architecture/README.md)
- C4 модель: `../structurizr/workspace.dsl`
- OpenAPI: [`../openapi/openapi.yaml`](../openapi/openapi.yaml), [`../openapi/aprilhub-bff.yaml`](../openapi/aprilhub-bff.yaml)
- Frontend host/widget contracts: [`FRONTEND_STRATEGY.md`](./FRONTEND_STRATEGY.md), [`WIDGET_CONTRACTS.md`](./WIDGET_CONTRACTS.md)
- ADR: [`adr/README.md`](./adr/README.md)
