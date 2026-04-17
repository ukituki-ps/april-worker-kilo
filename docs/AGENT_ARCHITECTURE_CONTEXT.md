# Архитектурный контекст для агента

## Стек (фиксировано)

- **Backend**: Go, REST, modular monolith
- **Workflow Engine**: Temporal (Go SDK, Workflow as Code)
- **Frontend**: React + TypeScript + Vite
- **UI Kit**: Mantine; дизайн-система April — пакеты **`@april/tokens`**, **`@april/ui`** ([репозиторий DisignApril](https://github.com/ukituki-ps/DisignApril), см. [`guides/DESIGN_SYSTEM.md`](./guides/DESIGN_SYSTEM.md))
- **Process Editor**: React Flow (`@xyflow/react`)
- **IAM**: Keycloak (RBAC источник ролей/прав)
- **DB**: PostgreSQL 17
- **Queue**: Redis + Asynq
- **Notifications**: собственный микросервис AprilNflow (Go + React Flow)
- **Observability**: Promtail + Loki + Grafana, Prometheus (operating model: [`guides/OBSERVABILITY_MULTI_STAND_OPERATING_MODEL.md`](./guides/OBSERVABILITY_MULTI_STAND_OPERATING_MODEL.md), index: [`guides/OBSERVABILITY_INDEX.md`](./guides/OBSERVABILITY_INDEX.md))
- **Нагрузочное тестирование**: k6 (сценарии API, baseline; детали в [`./TESTING_STRATEGY.md`](./TESTING_STRATEGY.md))
- **Documentation**: Structurizr (C4 Model) + Docusaurus + ADR + OpenAPI
- **Infra**: Debian 13, Docker Compose, Nginx reverse proxy

Граница: **один репозиторий = один сервис**; внутри репозитория допустим **модульный монолит** (не путать с «микросервисом на каждый модуль»).

Версии инструментов и образов — в [`guides/VERSIONS.md`](./guides/VERSIONS.md). Форк репозитория под новый сервис — [`guides/FORK_AND_CUSTOMIZE.md`](./guides/FORK_AND_CUSTOMIZE.md).

## Архитектурные документы (для агента)

Канонический набор архитектурных материалов расположен в `docs/architecture/`:

- [`architecture/README.md`](./architecture/README.md)
- [`architecture/структура сервиса.md`](./architecture/структура%20сервиса.md)
- [`architecture/INTERSERVICE_LINKS.md`](./architecture/INTERSERVICE_LINKS.md)
- [`architecture/INTEGRATION_CONTRACTS.md`](./architecture/INTEGRATION_CONTRACTS.md)
- [`architecture/APRILHUB_C3_C4.md`](./architecture/APRILHUB_C3_C4.md)
- [`architecture/APRILWORKER_C3_C4.md`](./architecture/APRILWORKER_C3_C4.md)
- [`architecture/C4_RUNTIME_SEQUENCES.md`](./architecture/C4_RUNTIME_SEQUENCES.md)

Модель C4 в Structurizr: `structurizr/workspace.dsl`.
