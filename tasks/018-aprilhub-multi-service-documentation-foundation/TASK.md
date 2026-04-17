# Задача: Multi-service documentation foundation for April ecosystem (Этап 018)

## Мета
- **ID / ветка:** `018-aprilhub-multi-service-documentation-foundation`
- **Приоритет:** высокий
- **Связанные документы:** `task_list.md`, `docs/AGENT_ARCHITECTURE_CONTEXT.md`, `docs/AGENT_MASTER_PROMPT.md`, `docs/DEPLOYMENT_STRATEGY.md`, `docs/TESTING_STRATEGY.md`, `docs/architecture/README.md`, `docs/architecture/структура сервиса.md`, `docs/architecture/INTERSERVICE_LINKS.md`, `docs/architecture/INTEGRATION_CONTRACTS.md`, `docs/architecture/APRILHUB_C3_C4.md`, `docs/architecture/APRILWORKER_C3_C4.md`, `docs/architecture/C4_RUNTIME_SEQUENCES.md`, `structurizr/workspace.dsl`, `tasks/010-hub-architecture-docs-release-gate/REPORT.md`

## Цель
Подготовить единый документационный baseline для масштабирования экосистемы April (AprilHub + комплементарные сервисы): человеко-ориентированную документацию (onboarding, architecture, operations) и агент-ориентированные артефакты (правила, шаблоны, contract/index), чтобы запуск нового сервиса происходил предсказуемо, без расхождения источников истины между docs, контрактами и runtime-процессами.

## Контекст для агента
- Экосистема включает AprilHub как точку входа и набор комплементарных сервисов (`AprilWorkFlow`, `AprilNFlow`, `AprilOrgFlow`, `AprilProfil`, `AprilEDC`, `AprilReport`, `AprilWorker`) с разными границами ответственности.
- В `docs/AGENT_ARCHITECTURE_CONTEXT.md` зафиксировано правило: один репозиторий = один сервис; внутри допустим модульный монолит. Документационный baseline должен поддерживать именно эту модель масштабирования.
- В репозитории уже есть фундамент (`task_list.md`, `tasks/<NNN-slug>/`, C4/Structurizr, deployment/testing docs), но нет единой постановки, которая свяжет human-first и agent-first контуры в обязательный стандарт для следующих сервисов.
- Нужно сохранить текущие подходы (Structurizr C4, ADR, OpenAPI, task-driven workflow), не вводя параллельных "источников истины" и не ломая согласованный pipeline dev-деплоя/проверок.

## Входит в объём
- Сформировать целевую структуру документации для multi-service режима:
  - human-first: service catalog, onboarding, архитектурные границы, runbook/operations;
  - agent-first: правила выполнения, шаблоны задач, шаблоны контрактов, обязательные acceptance/checklists.
- Явно закрепить канонические источники истины:
  - архитектура и границы: `docs/architecture/*` + `structurizr/workspace.dsl` + ADR;
  - API/интеграции: OpenAPI + `docs/architecture/INTEGRATION_CONTRACTS.md`;
  - эксплуатация: `docs/DEPLOYMENT_STRATEGY.md`, runbooks, deploy artifacts.
- Определить обязательный набор артефактов для нового сервиса в экосистеме:
  - `README.md` сервиса (роль, границы, зависимости, ingress/API точки),
  - `tasks/<NNN-slug>/{TASK.md, PLAN.md, REPORT.md}`,
  - OpenAPI/контрактный артефакт,
  - операционные инструкции (deploy/rollback/smoke),
  - тестовый профиль по уровням из `docs/TESTING_STRATEGY.md`.
- Зафиксировать единый workflow трассировки изменений: задача -> код -> docs/contracts -> проверки -> отчёт.
- Зафиксировать требования к актуализации docs при вводе нового сервиса/новой интеграции (обязательные файлы для обновления).
- Оформить результаты в `PLAN.md` и `REPORT.md` каталога этапа `018`.

## Не входит в объём
- Полная переработка уже существующих документов всех предыдущих этапов `001-016`.
- Внедрение новых внешних платформ документации или миграция на другой стек.
- Массовое переписывание кода сервисов; фокус этапа `018` на документационном и процессном контуре.
- Изменение зафиксированной модели деплоя на dev (merge в `develop`, ghcr по SHA, `deploy.sh`, `images.env`).

## Технические ограничения
- Следовать фиксированному стеку и архитектурному контексту из `docs/AGENT_ARCHITECTURE_CONTEXT.md`; не предлагать замену ключевых технологий без отдельного решения.
- Для API-контрактов использовать принятый процесс OpenAPI в репозитории; не создавать дублирующий "контрактный источник истины".
- Существенные архитектурные решения фиксировать через ADR (если в рамках этапа принимаются новые договорённости).
- Изменения должны быть совместимы с `docs/DEPLOYMENT_STRATEGY.md`:
  - dev-деплой через merge в `develop`,
  - образы в `ghcr.io` с tag по `git sha`,
  - runtime source of truth для образов: `images.env`,
  - pre/post deploy проверки: backup/migrations/health/smoke/rollback.
- Тестовые требования задавать через уровни из `docs/TESTING_STRATEGY.md`: unit, integration (с Atlas-подходом), smoke E2E, k6 baseline.
- Пользовательские и внутренние инструкции оформлять в существующей структуре docs; не дублировать уже утверждённые разделы.

## Критерии готовности (acceptance)
- [ ] Определена и зафиксирована целевая структура human-first и agent-first документации для multi-service AprilHub.
- [ ] Зафиксирован единый набор источников истины (архитектура, контракты, эксплуатация) и правила их актуализации, привязанные к конкретным файлам/каталогам репозитория.
- [ ] Подготовлен baseline-шаблон для запуска нового комплементарного сервиса с обязательными документами и чек-листами (human-first + agent-first).
- [ ] Зафиксирован workflow трассировки изменений (task -> implementation -> docs/contracts -> verification -> report) и правила обязательного обновления docs при изменениях.
- [ ] В постановке учтены ограничения dev-деплоя и post-deploy quality gates из `docs/DEPLOYMENT_STRATEGY.md`.
- [ ] В постановке учтены уровни тестирования и минимальный DoD-контур из `docs/TESTING_STRATEGY.md`.
- [ ] Описаны риски, ограничения и follow-up шаги внедрения стандарта по сервисам.
- [ ] В `REPORT.md` отражены принятые решения, структура артефактов и команды/проверки, подтверждающие применимость подхода.

## Проверка (команды)
```bash
# Минимальный контур проверки после оформления артефактов этапа
rg "018-aprilhub-multi-service-documentation-foundation|source of truth|service catalog|workflow трассировки|acceptance|DEPLOYMENT_STRATEGY|TESTING_STRATEGY" task_list.md docs tasks
```

## Результат в отчёте
После выполнения оформить `REPORT.md`: какие документы/шаблоны добавлены или обновлены, какие правила зафиксированы для людей и агентов, как обеспечена связь с C4/OpenAPI/deploy/testing контурами, какие ограничения и шаги внедрения остаются.
