# Задача: Hub Architecture/Docs Final Sync and Release Readiness (Этап 010)

## Мета
- **ID / ветка:** `010-hub-architecture-docs-release-gate`
- **Приоритет:** высокий
- **Связанные документы:** `task_list.md`, `tasks/000-aprilhub-full-service-roadmap/TASK.md`, `tasks/009-hub-deployment-hardening-dev/REPORT.md`, `docs/AGENT_ARCHITECTURE_CONTEXT.md`, `docs/architecture/README.md`, `docs/DEPLOYMENT_STRATEGY.md`, `docs/TESTING_STRATEGY.md`, `structurizr/workspace.dsl`, `docs/adr/README.md`, `docs/adr/template.md`, `docs/guides/APRILHUB_RELEASE_CHECKLIST_V1.md`

## Цель
Синхронизировать архитектурную и эксплуатационную документацию AprilHub с фактическим состоянием после этапов `001-009`, зафиксировать принятые решения (включая развилки по deploy/runtime), сформировать release-gate checklist v1 и подтвердить Definition of Done для завершения roadmap `001-010`.

## Контекст для агента
- Этапы `001-009` реализованы и задокументированы, включая deploy/rollback hardening и артефакты проверки.
- В `tasks/000.../TASK.md` для этапа `010` явно требуется синхронизация `structurizr/workspace.dsl`, `docs/architecture/*`, Docusaurus-гайдов и ADR.
- В `tasks/009.../REPORT.md` зафиксированы follow-up к `010`: формализовать политику публикации и lifecycle SHA-образов, а также закрепить release-ready runbook/checklist.
- Для завершения AprilHub roadmap необходимо устранить расхождения между кодом, контрактами и документацией без изменения принятого стека.

## Входит в объём
- Провести ревизию и синхронизацию архитектурных материалов:
  - `structurizr/workspace.dsl`,
  - `docs/architecture/APRILHUB_C3_C4.md`,
  - `docs/architecture/C4_RUNTIME_SEQUENCES.md`,
  - при необходимости `docs/architecture/INTERSERVICE_LINKS.md` и `docs/architecture/INTEGRATION_CONTRACTS.md`.
- Актуализировать документацию по dev deploy/release readiness:
  - зафиксировать policy по SHA-tag образам для `hub-bff`/`hub-shell`,
  - проверить консистентность с `docs/DEPLOYMENT_STRATEGY.md` и фактическим `deploy.sh` flow.
- Обновить пользовательские/внутренние гайды в Docusaurus-структуре (`docs/`, `docs/guides/`) там, где есть расхождения с текущей реализацией AprilHub.
- Зафиксировать существенные архитектурные решения в ADR (если в ходе этапов `001-009` появились развилки, не отражённые в текущих ADR).
- Подготовить release checklist v1 для AprilHub (гейты по docs, OpenAPI, тестам, deploy/rollback, observability) и привязать его к Definition of Done эпика `000`.
- Оформить артефакты этапа в `PLAN.md` и `REPORT.md`.

## Не входит в объём
- Реализация новых функциональных возможностей `hub-bff`/`hub-shell`.
- Production-grade hardening PostgreSQL/Redis (scope этапа `011`).
- Замена CI/CD, IAM или базового технологического стека проекта.
- Массовый рефакторинг runtime-кода, не требуемый для синхронизации документации и release-gate.

## Технические ограничения
- Следовать зафиксированному стеку из `docs/AGENT_ARCHITECTURE_CONTEXT.md`; не предлагать замену ключевых технологий.
- Архитектурные изменения отражать сначала в `structurizr/workspace.dsl`, затем в `docs/architecture/*`.
- При изменении API-контрактов синхронизировать OpenAPI в том же этапе либо явно зафиксировать обоснованный follow-up.
- Использовать процесс ADR из `docs/adr/` для значимых решений.
- Не коммитить секреты/токены/закрытые конфигурации; env-only подход сохраняется.

## Критерии готовности (acceptance)
- [x] Выполнена ревизия `structurizr/workspace.dsl` и `docs/architecture/*`; выявленные расхождения устранены и зафиксированы.
- [x] Документация по dev deploy/release (`docs/DEPLOYMENT_STRATEGY.md` и связанные гайды) согласована с фактическим flow этапа `009`, включая policy SHA-образов.
- [x] Docusaurus-разделы, связанные с AprilHub runtime/deploy/testing, актуализированы и успешно собираются.
- [x] Существенные архитектурные решения оформлены в ADR (или явно зафиксировано, что новых ADR не требуется).
- [x] Подготовлен release checklist v1 и привязан к Definition of Done для закрытия roadmap `001-010`.
- [x] Проверки документации и контрактов проходят без ошибок.
- [x] Оформлены `PLAN.md` и `REPORT.md` этапа `010` с перечнем изменений, проверок, ограничений и follow-up на `011`.

## Проверка (команды)
```bash
make openapi-lint
make docs-build
docker compose config
```

## Результат в отчёте
После выполнения оформить `REPORT.md` в этой задаче: какие архитектурные/документные артефакты синхронизированы, какие ADR/checklist добавлены или обновлены, какие команды проверки выполнены и какие остаточные риски остаются перед этапом `011`.
