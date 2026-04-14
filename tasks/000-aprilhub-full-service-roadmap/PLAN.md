# План: Full AprilHub Service Roadmap

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-14
- **Статус плана:** согласован

## Исходные допущения
- Стек и архитектурные границы фиксированы в `docs/AGENT_ARCHITECTURE_CONTEXT.md`.
- C3/C4 целевая модель `AprilHub` уже описана в `docs/architecture/APRILHUB_C3_C4.md`.
- Контракты интеграции частично draft и уточняются по мере реализации.
- JWT/Auth для AprilHub жёстко следует `docs/auth-jwt-keycloak-adapted.md`.
- Для полного цикла `AprilHub` используется выделенная ветка `feature/aprilhub-implementation` до закрытия эпиков `001-010`.

## Стратегия ветвления для roadmap AprilHub
- Базовая рабочая ветка roadmap: `feature/aprilhub-implementation`.
- Изменения по эпикам `001-010` вносятся напрямую в эту ветку или через короткоживущие feature-ветки с merge обратно в неё.
- Интеграция в `develop` выполняется после закрытия roadmap (или согласованных крупных инкрементов) через PR.
- Dev-деплой остаётся привязан к merge в `develop` по `docs/DEPLOYMENT_STRATEGY.md`.

## Порядок реализации эпиков
1. `001` Platform Bootstrap
2. `002` Auth & RBAC
3. `003` Hub Shell Composition Runtime (в т.ч. дизайн-системный UX для guest/Keycloak/authorized зон)
4. `004` Hub BFF Aggregation Runtime
5. `005` Integration Contracts & OpenAPI Hardening
6. `006` Observability & Operability
7. `007` Data & Background Processing Readiness (conditional)
8. `008` Testing Completion
9. `009` Deployment & Rollback Hardening
10. `010` Architecture/Docs Finalization & Release Gate

## Зависимости между эпиками
- `002` зависит от инфраструктурных артефактов `001`.
- `003` и `004` запускаются параллельно после базовой auth-подсистемы; дизайн-системная подзадача `tasks/003-aprilhub-shell-design-system/` выполняется как часть `003`.
- `005` закрывается совместно с `004` (контракты и реализация должны быть синхронны).
- `008` идёт итеративно, финализация после `004-006`.
- `009` выполняется после готовности runtime и тестового baseline.
- `010` закрывает релизный цикл и выравнивает документацию.
- Для `002`, `005`, `008`, `010` обязательна проверка соответствия `docs/auth-jwt-keycloak-adapted.md` (без legacy refresh/login backend-flow).

## Риски
- Расхождение реализации и C4-модели при параллельной разработке Shell/BFF.
- Недооценка времени на контрактное выравнивание с downstream сервисами.
- Смещение сроков из-за недоформализованного degraded-mode поведения.
- Отступление от Keycloak-first auth схемы и появление несовместимых API в backend.

## Митигации
- Обязательная синхронизация OpenAPI + `docs/architecture/*` в рамках каждого эпика.
- Явные acceptance-критерии по partial response и timeout-policy для BFF.
- Раннее включение smoke e2e и k6 baseline до финализации деплоя.
- Gate в code review: запрет `/auth/login` и `/auth/refresh` в backend AprilHub, JWT verify только через JWKS.

## Проверка прогресса
- Обновление `task_list.md` по завершению каждого эпика.
- Для каждого эпика: `TASK.md` + (при необходимости) `PLAN.md` + `REPORT.md`.
- Контрольная точка готовности сервиса: соответствие Definition of Done из `TASK.md`.
- На контрольных точках: явная сверка с `docs/auth-jwt-keycloak-adapted.md` и фиксация результата в `REPORT.md`.
