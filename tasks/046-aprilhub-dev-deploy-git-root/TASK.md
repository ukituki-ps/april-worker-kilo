# Задача 046: падение Git-шага в Deploy to dev (AprilHub)

## Цель

Устранить типичную причину падения job **Deploy to dev** на этапе `git checkout`: SHA события из репозитория `april-worker` отсутствует в клоне другого репозитория из‑за неверного дефолта `APRIL_DEPLOY_ROOT`.

## Критерии приёмки

- [ ] В `.github/workflows/dev-deploy.yml` дефолт `APRIL_DEPLOY_ROOT` указывает на клон AprilHub (`/opt/april-worker`), с комментарием про обязательное совпадение remote с репозиторием workflow.
- [ ] В `docs/DEPLOYMENT_STRATEGY.md` и `docs/guides/PROJECT_DEFAULTS.md` зафиксированы значения для AprilHub vs AprilProfile.
- [ ] `REPORT.md` с классификацией и шагами верификации для оператора.
