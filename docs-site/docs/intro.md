---
sidebar_position: 1
---

# aprilWorker

`aprilWorker` в текущем этапе развития реализует платформенный контур **AprilHub**: единый вход, auth/RBAC через Keycloak, API aggregation и операционный baseline (deploy/testing/observability).

Базовый стек и архитектурные границы фиксированы в `docs/AGENT_ARCHITECTURE_CONTEXT.md` в корне репозитория.

## Главные entrypoints

| Раздел | Содержание |
|--------|------------|
| [Быстрый старт](./getting-started.md) | Сборка сайта, OpenAPI, Docker Compose |
| [Что такое AprilHub](/guides/APRILHUB_WHAT_IS_IT) | Назначение, ценность, границы и high-level flow |
| [Как работает AprilHub](/guides/APRILHUB_HOW_IT_WORKS) | Ключевые компоненты и runtime-потоки |
| [Frontend strategy](/FRONTEND_STRATEGY) | Модель интеграции `Host-driven`/`Widget-driven`/`API/BFF-first` в AprilHub |
| [Контракты виджетов](/WIDGET_CONTRACTS) | `HostContext`, props/events и правила интеграции host ↔ widget |
| [Как работать с AprilHub](/guides/APRILHUB_TEAM_WORKFLOW) | Практический dev-flow команды: от задачи до PR |
| [Agent-first разработка](/guides/APRILHUB_AGENT_DEVELOPMENT) | Обязательный контекст, ограничения, service map |
| [Карта документации AprilHub](/guides/APRILHUB_DOCUMENTATION_MAP) | Навигация по source-of-truth документам |
| [Дизайн-система April](/guides/DESIGN_SYSTEM) | `@april/tokens`, `@april/ui`, ссылка на репозиторий DisignApril |
| [ADR](/adr/) | Architecture Decision Records |
| [Шаблон репо: форк и версии](/guides/FORK_AND_CUSTOMIZE) | Чеклист при наследовании от шаблона, версии инструментов |

Полный архитектурный и операционный baseline: `docs/AGENT_ARCHITECTURE_CONTEXT.md`, `docs/DEPLOYMENT_STRATEGY.md`, `docs/TESTING_STRATEGY.md`.
