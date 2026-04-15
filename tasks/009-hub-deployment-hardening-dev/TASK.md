# Задача: Hub Deployment Hardening for Dev (Этап 009)

## Мета
- **ID / ветка:** `009-hub-deployment-hardening-dev`
- **Приоритет:** высокий
- **Связанные документы:** `task_list.md`, `tasks/000-aprilhub-full-service-roadmap/TASK.md`, `tasks/008-hub-testing-completion/REPORT.md`, `docs/DEPLOYMENT_STRATEGY.md`, `docs/TESTING_STRATEGY.md`, `docs/AGENT_ARCHITECTURE_CONTEXT.md`, `.github/workflows/dev-deploy.yml`, `deploy.sh`, `images.env.example`

## Цель
Довести dev-deploy контур AprilHub до воспроизводимого и безопасного baseline: обеспечить управляемый flow версий образов через `images.env`, обязательные преддеплойные проверки и backup перед миграциями, smoke-after-deploy, а также рабочий rollback на last-good состояние без выхода за пределы dev-окружения.

## Контекст для агента
- Этапы `001-008` закрыли baseline платформы, auth/runtime/contracts/observability и тестовый контур AprilHub.
- По `docs/DEPLOYMENT_STRATEGY.md` deploy на dev должен идти через SHA-based образы, `deploy.sh`, health/readiness gates, smoke и rollback.
- В roadmap этап `009` является обязательным release-gate перед финальной синхронизацией документации этапа `010`.
- Этап `011` выделен отдельно для production-grade PostgreSQL/Redis; в `009` не переносим infra-программу production scope.

## Входит в объём
- Актуализировать и зафиксировать dev deployment flow для AprilHub:
  - сборка/доставка образов с SHA tags,
  - обновление версий через `images.env` (без правки tracked compose-файлов под каждый релиз),
  - единый entrypoint деплоя (`deploy.sh` + согласованные скрипты).
- Внедрить обязательные pre-deploy safety шаги:
  - backup БД перед миграциями и `docker compose up`,
  - запуск миграций отдельным этапом до подъёма runtime,
  - fail-fast при нарушении порядка шагов.
- Усилить post-deploy quality gates:
  - health/readiness проверки по внутреннему контуру,
  - smoke-after-deploy (API endpoint + auth/login + минимальный E2E путь),
  - фиксация deploy-артефактов (логи, `docker compose ps`, commit/SHA).
- Реализовать и проверить rollback-процедуру dev:
  - откат `images.env` к previous/last-good SHA,
  - согласованный rollback миграций (если применимо),
  - повторные health/smoke после отката.
- Синхронизировать документацию и task-артефакты этапа:
  - обновить `docs/DEPLOYMENT_STRATEGY.md` при расхождениях с фактическим pipeline,
  - оформить `PLAN.md`/`REPORT.md` этапа `009` по результатам работ.

## Не входит в объём
- Production rollout и эксплуатация production-окружений.
- Полный HA/failover hardening PostgreSQL/Redis (это scope этапа `011`).
- Расширение бизнес-функциональности `hub-bff`/`hub-shell`, не связанное с deploy reliability.
- Замена текущего GitHub Actions + self-hosted runner процесса на иной CI/CD стек.

## Технические ограничения
- Следовать `docs/DEPLOYMENT_STRATEGY.md`: `develop` deploy flow, SHA-only теги, `images.env`, smoke-after-deploy и rollback policy.
- Не коммитить секреты, пароли и токены; использовать env-шаблоны и server-side переменные.
- Не менять архитектурные границы AprilHub и auth-модель Keycloak-first.
- Изменения схемы БД допускаются только через принятый migration tooling (Atlas/согласованный процесс) с проверяемым откатом.
- Все проверки должны быть воспроизводимы локально/на dev runner и документированы командами.

## Критерии готовности (acceptance)
- [x] Подготовлен и согласован `PLAN.md` этапа `009` с пошаговым сценарием deploy/rollback.
- [x] Реализован рабочий flow обновления образов через `images.env` и SHA tags без ручной правки version-пинов в tracked compose-конфигурации.
- [x] Перед миграциями и деплоем выполняется backup БД; процедура задокументирована и проверена.
- [x] Post-deploy gates (health/readiness + smoke API/auth/E2E) выполняются автоматически или строго по регламенту и дают воспроизводимый результат.
- [x] Проверен rollback на last-good состояние (образы + миграции при необходимости) с подтверждённым восстановлением работоспособности.
- [x] Dev deploy pipeline/скрипты синхронизированы с `docs/DEPLOYMENT_STRATEGY.md` и не конфликтуют с текущими CI проверками.
- [x] В `REPORT.md` зафиксированы фактические изменения пайплайна, результаты прогонов, ограничения и follow-up на этапы `010/011`.

## Проверка (команды)
```bash
# обязательные baseline-проверки перед/после deploy
make openapi-lint
cd hub-bff && go test ./...
./scripts/smoke-aprilhub.sh

# deploy flow (пример; уточняется в реализации)
./deploy.sh

# валидация образов и рантайма
docker compose ps
```

## Результат в отчёте
После выполнения оформить `REPORT.md` в этой задаче: какие шаги deploy/rollback внедрены и подтверждены, какие артефакты CI/dev получены, какие ограничения и остаточные риски остаются перед этапами `010` и `011`.
