# Как работать с AprilHub (для команды)

Этот документ — практический маршрут для ежедневной работы в репозитории AprilHub.

## 1) Перед началом задачи

1. Проверить приоритеты и зависимости в `task_list.md` (корень репозитория).
2. Открыть задачу в `tasks/<NNN-slug>/TASK.md`.
3. Для нетривиальной задачи создать/актуализировать `PLAN.md` по шаблону `docs/AGENT_PLAN_TEMPLATE.md`.

## 2) Реализация изменений

- Не выходить за границы scope задачи.
- Не менять фиксированный стек без явного решения команды.
- Для API-изменений синхронно обновлять OpenAPI.
- Для IAM учитывать Keycloak-first модель (без дублирования политики ролей в обход Keycloak).

## 3) Проверка изменений

Минимальный mandatory gate:

```bash
make openapi-lint
cd hub-bff && go test ./...
cd hub-shell && npm ci && npm run lint && npm run test && npm run build
./scripts/smoke-aprilhub.sh
./scripts/run-k6-aprilhub.sh
```

Полные правила и triage:
- `docs/TESTING_STRATEGY.md`
- `docs/runbooks/APRILHUB_TESTING_TRIAGE.md`

## 4) Git/PR и deploy-flow

- Рабочие ветки: `feature/*` или `fix/*`.
- Merge в `develop` через PR согласно `docs/DEPLOYMENT_STRATEGY.md`.
- В PR указывать test plan, риски и ограничения.
- Прямой push в защищённые ветки не использовать.

## 5) Обязательные документы при handoff

- `TASK.md` — постановка (актуальная граница scope).
- `PLAN.md` — актуальный план для нетривиальных задач.
- `REPORT.md` — фактический результат, проверки, риски/follow-up.
- Ссылка-карта документации: [`APRILHUB_DOCUMENTATION_MAP.md`](./APRILHUB_DOCUMENTATION_MAP.md).
