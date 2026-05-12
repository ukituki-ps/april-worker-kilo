# aprilWorker

Микросервис экосистемы **April** (документация Docusaurus, OpenAPI, Structurizr, Docker Compose, CI, сценарий деплоя). Репозиторий создан из шаблона [april_template](https://github.com/ukituki-ps/april_template).

Один репозиторий соответствует **одному сервису** в экосистеме; backend по умолчанию описывается как **модульный монолит** (см. [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](docs/AGENT_ARCHITECTURE_CONTEXT.md)); прикладной backend/frontend добавляются по мере разработки.

## Быстрый старт

1. `cp .env.example .env` при необходимости.
2. `make docs-build`, `make openapi-lint`.
3. `make compose-up` после сборки статики — см. [`docs-site/docs/getting-started.md`](docs-site/docs/getting-started.md).

**Репозиторий:** [github.com/ukituki-ps/april-worker-kilo

**CI:** `.github/workflows/ci.yml` — проверки на PR/push на self-hosted runner `self-hosted, ci, profile` (CI host `192.168.1.29`); деплой на dev — `.github/workflows/dev-deploy.yml` (self-hosted runner `self-hosted, dev, profile`, стенд `dev.profile.april.ukituki.tech` на `192.168.1.42`; см. [`docs/DEPLOYMENT_STRATEGY.md`](docs/DEPLOYMENT_STRATEGY.md)).

## Mandatory testing gate (AprilHub P0)

Обязательные проверки для pre-merge/release кандидата:

- `make openapi-lint`
- `cd hub-bff && go test ./...`
- `cd hub-shell && npm ci && npm run check:profile-ui-semver && npm run lint && npm run test && npm run build`
- `./scripts/smoke-aprilhub.sh`
- `./scripts/run-k6-aprilhub.sh`

Политика pass/fail, CI jobs и triage-правила: [`docs/TESTING_STRATEGY.md`](docs/TESTING_STRATEGY.md), [`docs/runbooks/APRILHUB_TESTING_TRIAGE.md`](docs/runbooks/APRILHUB_TESTING_TRIAGE.md). Release gate для виджетов профиля 4a (smoke/e2e, semver, rollback): [`docs/runbooks/APRILHUB_4A_WIDGET_RELEASE_GATE.md`](docs/runbooks/APRILHUB_4A_WIDGET_RELEASE_GATE.md).

## Документация

| Документ | Содержание |
| -------- | ---------- |
| [`docs/guides/PROJECT_DEFAULTS.md`](docs/guides/PROJECT_DEFAULTS.md) | Хост, пути, labels |
| [`docs/guides/FORK_AND_CUSTOMIZE.md`](docs/guides/FORK_AND_CUSTOMIZE.md) | Чеклист при копировании шаблона (для форков) |
| [`docs/AGENT_ARCHITECTURE_CONTEXT.md`](docs/AGENT_ARCHITECTURE_CONTEXT.md) | Стек и границы |
| [`docs/DEPLOYMENT_STRATEGY.md`](docs/DEPLOYMENT_STRATEGY.md) | Деплой на dev |
| [`docs/guides/DESIGN_SYSTEM.md`](docs/guides/DESIGN_SYSTEM.md) | Дизайн-система April (`@april/tokens`, `@april/ui`) |
| [`openapi/openapi.yaml`](openapi/openapi.yaml) | OpenAPI 3.1 |

## Лицензия

См. [`LICENSE`](LICENSE): шаблон **MIT** с плейсхолдерами — замените год и правообладателя под свой проект или выберите другую лицензию.
