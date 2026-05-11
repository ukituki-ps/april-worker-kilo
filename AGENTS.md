# April Worker (AprilHub) — Agent Context

## Язык общения

ВСЕГДА отвечай на русском языке: сообщения в чат, комментарии, commit messages, отчёты и планы. Исключение: имена файлов, переменные, ошибки — оставляй как есть.

## Before starting a task

1. Read `README.md` — product overview and quick start
2. Read `task_list.md` — current priorities and boundaries
3. Read `docs/AGENT_ARCHITECTURE_CONTEXT.md` — fixed stack and decision boundaries
4. Read `docs/DEPLOYMENT_STRATEGY.md` — merge policy, deploy workflow

## Fixed Stack

**Hub Frontend:** React + TypeScript + Vite, Mantine, @april/ui (design-system from DisignApril)
**Hub BFF:** Go, REST
**Infra:** Debian 13, Docker Compose, Nginx reverse proxy
**IAM:** Keycloak (RBAC, OIDC/OAuth)
**Observability:** Promtail + Loki + Grafana, Prometheus, Sentry (this repo defines the AprilHub observability stack shared by ecosystem services)
**Documentation:** Structurizr (C4), Docusaurus, ADR, OpenAPI

Do not replace these technologies without explicit request.

## Project Structure

- `hub-shell/` — React Vite app, Mantine UI, AprilHub shell
- `hub-bff/` — Go backend, API aggregation, auth proxy
- `infra/` — observability configs (Loki, Grafana, Alertmanager, Promtail)
- `design-system/DisignApril/` — git submodule (DS source, local dev showcase)
- `scripts/` — deployment, smoke tests, k6 load tests
- `docs/` — architecture, deployment, testing strategy
- `docs/runbooks/` — testing triage, release gates
- `tasks/` — task folders (`NNN-slug/`) with TASK.md, PLAN.md, REPORT.md
- `docs/architecture/` — ADRs

## Code Conventions

### TypeScript / React (hub-shell)
- Strict TypeScript as in project `tsconfig`
- Functional components and hooks
- UI: Mantine; DS components: @april/ui via registry (GitHub Packages)
- Naming: consistency with existing folders (`src/shell/`, `src/widgets/`)
- Accessibility and semantics per product requirements

### Go (hub-bff)
- Run `gofmt` / `goimports` before commit
- Explicit error handling with `%w`
- `context.Context` first argument
- Public API: Go-style comments
- Interfaces on consumer side; mocks for test deps

### DS-First Policy
1. Check `@april/ui` for available components before building custom UI
2. Custom UI only when DS lacks needed API — document reason in TASK.md/REPORT.md

### Comments
- Comment non-obvious code: invariants, integration constraints
- No commented-out dead code
- Language: follow existing codebase convention per module
- UX text by default in Russian unless task specifies otherwise

### Security
- Secrets never in code; RBAC through Keycloak
- NODE_AUTH_TOKEN via env, not committed

## Git Workflow

- Do not push directly to protected branches (`main`, `develop`)
- Work in `feature/*` or `fix/*` branches
- Merge via PR with clear commit messages, test plan, and risks

## Task Execution

1. Check `task_list.md` before starting new work
2. Only take tasks with completed dependencies
3. Mark task as in-progress on start, done on completion
4. For non-trivial tasks: create `PLAN.md` per `docs/AGENT_PLAN_TEMPLATE.md`
5. Deliver end-to-end: analysis → code → tests → docs (if relevant) → commit
6. Run relevant tests before closing a task
7. Final report per `docs/AGENT_REPORT_TEMPLATE.md` saved as `tasks/<NNN-slug>/REPORT.md`
8. Large tasks: break into subtasks if estimate exceeds a few hours

## Testing & Build Commands

```bash
# Mandatory pre-merge quality gate (from README.md)
make openapi-lint
cd hub-bff && go test ./...
cd hub-shell && npm ci && npm run check:profile-ui-semver && npm run lint && npm run test && npm run build
./scripts/smoke-aprilhub.sh
./scripts/run-k6-aprilhub.sh

# Individual
make docs-build
make compose-up    # after docs-build
make compose-down
```

Testing policy and triage: `docs/TESTING_STRATEGY.md`, `docs/runbooks/APRILHUB_TESTING_TRIAGE.md`
Widget release gate: `docs/runbooks/APRILHUB_4A_WIDGET_RELEASE_GATE.md`

## Deployment

Follow `docs/DEPLOYMENT_STRATEGY.md`:
- Merge to `develop` via PR
- Images by git SHA in ghcr.io
- Dev server: self-hosted runner
- Rollback per DEPLOYMENT_STRATEGY; document failure reason in REPORT.md

## Documentation

- Stack and boundaries: `docs/AGENT_ARCHITECTURE_CONTEXT.md`
- DS integration (registry): `docs/guides/DESIGN_SYSTEM.md`
- DS ADR: `docs/architecture/ADR-april-design-system-npm-distribution.md`
- Deployment: `docs/DEPLOYMENT_STRATEGY.md`
- Observability: `docs/guides/OBSERVABILITY_INDEX.md`
- OpenAPI: `openapi/openapi.yaml`
- Testing strategy: `docs/TESTING_STRATEGY.md`
- Triage: `docs/runbooks/APRILHUB_TESTING_TRIAGE.md`