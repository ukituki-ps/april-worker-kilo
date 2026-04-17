# Тестовая стратегия AprilHub (v1, фактический контур)

Документ фиксирует обязательный quality gate (локально и в CI) и отдельно выделяет planned-слой. Стек и границы решений — в [AGENT_ARCHITECTURE_CONTEXT.md](./AGENT_ARCHITECTURE_CONTEXT.md), текущий CI — в [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

## 1. Принципы

- **Один источник истины по P0-проверкам:** этот документ + `.github/workflows/ci.yml`.
- **Merge/release gate опирается на exit code и формальные thresholds:** без ручного "вроде зелёно".
- **Atlas-only для схемы БД:** при добавлении integration-слоя миграции только через Atlas.
- **RBAC/аутентификация через Keycloak:** тесты не обходят keycloak-first модель.

## 2. Mandatory слой (P0, блокирует merge/release)

### 2.1 CI quality gate

Обязательные jobs в `.github/workflows/ci.yml`:

1. `openapi-compatibility`
2. `quality` (OpenAPI lint + docs build)
3. `hub-bff` (`go test ./...`)
4. `hub-shell` (`lint + test + build`)
5. `aprilhub-smoke` (`./scripts/smoke-aprilhub.sh`)
6. `aprilhub-k6-baseline` (`./scripts/run-k6-aprilhub.sh`)

Правило: любой `failed` / `cancelled` статус в этом списке — блокировка merge/release-кандидата до исправления причины и повторного зелёного прогона.

### 2.2 Локальный pre-merge прогон

```bash
make openapi-lint
cd hub-bff && go test ./...
cd hub-shell && npm ci && npm run lint && npm run test && npm run build
./scripts/smoke-aprilhub.sh
./scripts/run-k6-aprilhub.sh
```

Рекомендуется запускать команды в указанном порядке: сначала быстрые checks (lint/unit/build), затем runtime smoke/k6.

### 2.3 Pass/fail baseline для smoke

- Скрипт: `scripts/smoke-aprilhub.sh`.
- `pass`: exit code `0`, все встроенные assertions пройдены (ingress health, Keycloak OIDC, shell/showcase entrypoints, auth/RBAC checks, aggregation metadata checks).
- `fail`: любой ненулевой exit code, timeout readiness, отсутствие ожидаемых HTTP-кодов/маркеров.
- Артефакт CI: `artifacts/smoke/smoke.log` (upload как `aprilhub-smoke-artifacts`).

### 2.4 Pass/fail baseline для k6

- Скрипт: `scripts/run-k6-aprilhub.sh`, сценарий `k6/aprilhub-baseline.js`.
- `pass`: exit code `0` и соблюдение thresholds, зашитых в k6-сценарии.
- `fail`: ненулевой exit code, неуспешный warm-up, нарушение хотя бы одного threshold.
- Артефакты CI:
  - `artifacts/k6/k6.log`
  - `artifacts/k6/summary.json` (через `K6_SUMMARY_EXPORT`)
  - upload как `aprilhub-k6-artifacts`.

### 2.5 Triage/runbook для обязательных job

- Основной runbook: [`docs/runbooks/APRILHUB_TESTING_TRIAGE.md`](./runbooks/APRILHUB_TESTING_TRIAGE.md).
- Минимум для инцидента: зафиксировать failing job, ссылку на run, ключевые строки из артефактов, первопричину и corrective action.

## 3. Planned слой (P1/P2, не блокирует этап 019)

Следующие направления зафиксированы как развитие контура и относятся к этапу `020`:

- **Playwright smoke/regression** для пользовательских flow.
- **Integration suite на Testcontainers** (PostgreSQL/Redis/Keycloak) с Atlas migrations.
- **Расширенный k6 профиль** (длиннее, больше VUs, дополнительные endpoint mix и SLI-метрики).
- **Quality metrics/reporting слой** (история baseline, тренды деградации, авто-алерты).

До перевода пункта в mandatory необходимо:

1. Добавить воспроизводимый локальный сценарий.
2. Включить в CI как отдельный job.
3. Зафиксировать однозначный pass/fail и артефакты.

## 4. Связь с release gate

- Для release-ready кандидата этапа `019` обязательны все пункты mandatory-слоя.
- Planned-слой не блокирует merge в `feature/*`/`fix/*` и дальнейший PR в `develop`, пока явно не переведён в mandatory отдельным решением команды.
