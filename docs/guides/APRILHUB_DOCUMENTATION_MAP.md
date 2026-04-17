# AprilHub Documentation Map

Цель этого документа — дать единые entrypoints по документации AprilHub для двух аудиторий:

- **human-first**: быстро понять, что такое AprilHub, как он работает и как вносить изменения;
- **agent-first**: быстро восстановить архитектурный и операционный контекст без догадок.

## С чего начать

1. `README.md` (корень репозитория) — краткое назначение репозитория и обязательный testing gate.
2. `docs/AGENT_ARCHITECTURE_CONTEXT.md` — фиксированный стек и границы решений.
3. Для AprilHub narrative:
   - [`APRILHUB_WHAT_IS_IT.md`](./APRILHUB_WHAT_IS_IT.md)
   - [`APRILHUB_HOW_IT_WORKS.md`](./APRILHUB_HOW_IT_WORKS.md)
   - [`APRILHUB_TEAM_WORKFLOW.md`](./APRILHUB_TEAM_WORKFLOW.md)
   - [`APRILHUB_AGENT_DEVELOPMENT.md`](./APRILHUB_AGENT_DEVELOPMENT.md)

## Где искать информацию по доменам

| Нужная информация | Документ-источник |
| --- | --- |
| Архитектурные границы и C4 | `docs/architecture/README.md`, `structurizr/workspace.dsl` |
| Интеграции и контракты | `docs/architecture/INTEGRATION_CONTRACTS.md`, `/openapi/openapi.yaml`, `/openapi/aprilhub-bff.yaml` |
| Deployment/dev flow | `docs/DEPLOYMENT_STRATEGY.md` |
| Тестовый контур | `docs/TESTING_STRATEGY.md`, `docs/runbooks/APRILHUB_TESTING_TRIAGE.md` |
| Observability | [`OBSERVABILITY_INDEX.md`](./OBSERVABILITY_INDEX.md), [`OBSERVABILITY_MULTI_STAND_OPERATING_MODEL.md`](./OBSERVABILITY_MULTI_STAND_OPERATING_MODEL.md) |
| ADR решения | `/adr/` |

## Обязательный минимум для нового участника

- Понять платформу: [`APRILHUB_WHAT_IS_IT.md`](./APRILHUB_WHAT_IS_IT.md)
- Разобраться в потоках: [`APRILHUB_HOW_IT_WORKS.md`](./APRILHUB_HOW_IT_WORKS.md)
- Пройти рабочий цикл изменений: [`APRILHUB_TEAM_WORKFLOW.md`](./APRILHUB_TEAM_WORKFLOW.md)
- Для агентной/инженерной работы с full context: [`APRILHUB_AGENT_DEVELOPMENT.md`](./APRILHUB_AGENT_DEVELOPMENT.md)
