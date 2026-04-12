# aprilWorker

Микросервис экосистемы **April** (документация Docusaurus, OpenAPI, Structurizr, Docker Compose, CI, сценарий деплоя). Репозиторий создан из шаблона [april_template](https://github.com/ukituki-ps/april_template).

## Быстрый старт

1. `cp .env.example .env` при необходимости.
2. `make docs-build`, `make openapi-lint`.
3. `make compose-up` после сборки статики — см. [`docs-site/docs/getting-started.md`](docs-site/docs/getting-started.md).

**Репозиторий:** [github.com/ukituki-ps/april-worker](https://github.com/ukituki-ps/april-worker)

**CI:** `.github/workflows/ci.yml` — проверки на PR/push; деплой на dev — `.github/workflows/dev-deploy.yml` (self-hosted runner с labels `dev`, `worker`; см. [`docs/DEPLOYMENT_STRATEGY.md`](docs/DEPLOYMENT_STRATEGY.md)).

## Документация

| Документ | Содержание |
| -------- | ---------- |
| [`docs/guides/PROJECT_DEFAULTS.md`](docs/guides/PROJECT_DEFAULTS.md) | Хост, пути, labels |
| [`docs/guides/FORK_AND_CUSTOMIZE.md`](docs/guides/FORK_AND_CUSTOMIZE.md) | Чеклист при копировании шаблона (для форков) |
| [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](docs/AGENT_ARCHITECTURE_CONTEXT.md) | Стек и границы |
| [`docs/DEPLOYMENT_STRATEGY.md`](docs/DEPLOYMENT_STRATEGY.md) | Деплой на dev |
| [`openapi/openapi.yaml`](openapi/openapi.yaml) | OpenAPI 3.1 |

## Лицензия

_(по решению владельца репозитория)_
