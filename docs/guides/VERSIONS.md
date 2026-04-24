---
sidebar_position: 3
---

# Версии инструментов и зависимостей

Сводка для команды и агентов; **источник истины** для языков и пакетов — файлы манифестов в репозитории (`docs-site/package.json`, в будущем `go.mod`). Обновляйте эту таблицу при осознанном повышении major-версий.

| Компонент | Версия / диапазон | Где зафиксировано |
| --------- | ------------------- | ----------------- |
| Node.js | >= 18 (рекомендуется 20.x LTS для CI) | `docs-site/package.json` → `engines.node` |
| Docusaurus | 3.7.0 | `docs-site/package.json` → `@docusaurus/*` |
| React / React DOM | ^19.0.0 | `docs-site/package.json` |
| TypeScript | ~5.6.2 | `docs-site/package.json` |
| Redocly CLI | 1.25.0 | `Makefile` → цель `openapi-lint` |
| OpenAPI spec | 3.1.0 | `openapi/openapi.yaml` |
| Nginx (доки) | 1.27-alpine | `docker-compose.yml` |
| Swagger UI | v5.17.14 | `docker-compose.yml` |
| Structurizr Lite | 2024.03.03 | `docker-compose.yml` |
| Debian | 13 | целевой хост dev (`docs/AGENT_ARCHITECTURE_CONTEXT.md`) |
| PostgreSQL | 17 | целевой стек (`docs/AGENT_ARCHITECTURE_CONTEXT.md`) |
| Docker Compose | v2 | `docs/DEPLOYMENT_STRATEGY.md` |
| April Design System (`@april/tokens`, `@april/ui`) | по semver в consumer | [DisignApril](https://github.com/ukituki-ps/DisignApril) → `packages/*/package.json`; см. [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) |

### Backend / frontend приложения

После появления **Go** и клиентского приложения добавьте сюда строки с версией **Go**, основными библиотеками (Temporal SDK и т.д.) и зафиксируйте их в `VERSIONS.md` или перенесите автоматическую выгрузку из CI.

## CI sync artifact (microservices)

Ниже матрица для синхронизации версий между микросервисами и CI.  
Если обновляете версию в одном месте, проверьте и обновите все связанные точки фиксации.

| Артефакт | Версия | Где зафиксировано | Где синхронизировать |
| -------- | ------ | ----------------- | -------------------- |
| Go runtime (hub-bff) | `1.24.x` / `go1.24.4` toolchain | `hub-bff/go.mod`, `.github/workflows/ci.yml`, `.github/workflows/bootstrap-ci.yml`, `.github/workflows/ci-cache-warmup.yml` | Все workflow с `actions/setup-go` + `go.mod` |
| `oasdiff` (OpenAPI compatibility) | `v1.13.6` | `.github/workflows/ci.yml`, `.github/workflows/ci-cache-warmup.yml` | Оба workflow должны иметь одинаковый pinned tag |
| pnpm (design-system) | `pnpm@9.15.9` | `design-system/DisignApril/package.json` (`packageManager`) | `hub-shell/scripts/ds-prepare.sh`, `ci-cache-warmup` step `corepack pnpm --version` |
| Node runtime (hub-shell jobs) | `20` | `.github/workflows/ci.yml`, `.github/workflows/bootstrap-ci.yml` | Все Node-based job'ы + docker runtime checks |
| Docker mirror namespace | `${APRIL_DOCKER_MIRROR}`, `${APRIL_GCR_MIRROR}` | `.github/workflows/ci.yml`, `.github/workflows/bootstrap-ci.yml`, `.github/workflows/ci-cache-warmup.yml` | Добавлять новые часто используемые образы в warmup |

### Проверка после обновления версий

1. Прогнать `CI Cache Warmup` вручную (`workflow_dispatch`) и убедиться, что прогреты новые зависимости.
2. Проверить в следующем `CI` run отсутствие неожиданных `Corepack is about to download ...` и `switching to go...`.
3. При изменении major-версий добавить запись в release checklist: `docs/guides/APRILHUB_RELEASE_CHECKLIST_V1.md`.
