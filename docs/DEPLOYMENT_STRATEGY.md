# Стратегия деплоя (dev): GitHub Actions + self-hosted runner

Документ для агента и команды: зафиксированные решения и порядок шагов для деплоя на **dev-хост** (`DEV_HOST`). Конкретные значения — в [`guides/PROJECT_DEFAULTS.md`](./guides/PROJECT_DEFAULTS.md); при копировании шаблона замените их по [`guides/FORK_AND_CUSTOMIZE.md`](./guides/FORK_AND_CUSTOMIZE.md).

Ниже для микросервиса **aprilWorker**: `DEV_HOST` = `dev.example.com`, **`DEPLOY_ROOT`** = `/opt/april-worker`.

## 1. Репозиторий и триггеры

| Решение | Значение |
|--------|----------|
| Репозиторий | Один (монорепозиторий) |
| Ветка деплоя на dev | `develop` |
| Когда деплоим | Только после merge PR в `develop` |

### Рабочая ветка для AprilHub (до завершения roadmap)

- Для реализации полного roadmap `AprilHub` (`task_list.md`, эпики `001-010`) используется выделенная долгоживущая ветка: `feature/aprilhub-implementation`.
- Все изменения, относящиеся к `Hub Shell`, `Hub BFF`, интеграционным контрактам и сопровождающей документации AprilHub, вносятся в эту ветку до закрытия roadmap.
- Текущий поток слияний: feature/task branches (при необходимости) -> `feature/aprilhub-implementation` -> `develop`.
- Dev-деплой остаётся неизменным: публикация в dev по-прежнему выполняется после merge в `develop`.

**Практика для GitHub Actions:** workflow запускается на **`push` в `develop`** (merge PR даёт такой push). Чтобы исключить прямой push в `develop`, на GitHub включается **branch protection** для `develop` (запрет прямых push, обязательный PR). Тогда событие `push` в `develop` по смыслу соответствует «приняли PR».

**Реализация в репозитории:** workflow **Deploy to dev** (файл `.github/workflows/dev-deploy.yml`) на **self-hosted** runner с labels **`dev`** и **`RUNNER_LABEL_EXTRA`** (для april-worker: `worker`) выполняет в каталоге клона (**`DEPLOY_ROOT`**, для april-worker: `/opt/april-worker`) `git fetch`, переход на коммит **`github.sha`**, затем **`SKIP_GIT_PULL=1 ./deploy.sh`**. Путь к клону можно переопределить **repository variable** `APRIL_DEPLOY_ROOT`. Ручной перезапуск того же сценария — **Actions → Deploy to dev → Run workflow** (`workflow_dispatch`).

## 2. Runner

| Решение | Значение |
|--------|----------|
| Размещение | Тот же сервер, что обслуживает `DEV_HOST` (для april-worker: `dev.example.com`) |
| Охват | Один runner на все репозитории |
| Администрирование | Вручную: обновления и перезапуск `actions.runner` |
| Labels | `dev`, **`RUNNER_LABEL_EXTRA`** — jobs указывают `runs-on` с этими labels (для april-worker: `dev`, `worker`) |

| Решение | Значение |
|--------|----------|
| Пользователь ОС | `DEPLOY_USER` (задайте на сервере; в шаблоне часто отдельный пользователь `deploy`) |
| Docker | Доступ через группу **`docker`**, прав достаточно для деплоя |

## 3. Секреты

- **GitHub Secrets** — всё, что нужно CI (логин в ghcr, при необходимости токены).
- **На сервере** — `.env` и при необходимости отдельные env-файлы вне репозитория в каталоге **`DEPLOY_ROOT`** (для april-worker: `/opt/april-worker`).

Ограничение workflow по путям/файлам: **не используется** — любой merge в `develop` ведёт к полному пайплайну.

## 4. Сборка и registry

| Решение | Значение |
|--------|----------|
| Registry | **ghcr.io** |
| Теги образов | **Только `git sha`** (без обязательных `latest` / `dev`) |
| Multi-arch | Нет |

## 5. Каталог деплоя и compose

| Решение | Значение |
|--------|----------|
| Путь на сервере | `DEPLOY_ROOT` (для april-worker: `/opt/april-worker`) |
| Обновление исходников на сервере | **`git pull`** в этом каталоге |
| Инструмент | **`docker compose` v2** |
| Файлы | `docker-compose.yml` + overrides |

### Версии образов и источник истины

- **Теги образов (SHA)** задаются через **`.env`** и/или отдельный **`images.env`** на сервере. Compose-файлы в git ссылаются на переменные (например `IMAGE_TAG_BACKEND=${BACKEND_SHA}`), а конкретные значения подставляются из этих файлов.
- **`images.env` (и при необходимости server-local override)** — **не коммитятся** в репозиторий (или коммитится только шаблон без секретов). Так `git pull` в **`DEPLOY_ROOT`** не перезаписывает задеплоенные версии образов и не требует обратных коммитов из CI.

## 6. База данных и миграции

| Решение | Значение |
|--------|----------|
| PostgreSQL | Контейнер на том же хосте |
| Резервная копия перед изменением БД | Перед миграциями и `docker compose up` **обязательно** снять дамп БД dev-стенда командой **`pg_dump`** через `scripts/db-backup.sh` |
| Миграции | Отдельный шаг **до** `docker compose up` через `scripts/run-migrations.sh` (Atlas-ready, fail-fast при явной конфигурации и отсутствии tooling) |
| Откат | При неуспехе — авто-rollback: откат `images.env` на `last-good`, запуск `scripts/rollback-migrations.sh` (если настроен), затем повторный `compose up` + health/smoke |

## 7. Сеть, Nginx, домен

| Решение | Значение |
|--------|----------|
| Health / readiness | Проверка по **внутреннему порту** |
| Nginx | В контейнере; обновление через compose, не reload nginx на хосте |

## 8. Keycloak и остальная архитектура

- **Keycloak** — в том же compose; redirect URI при каждом деплое **не меняются**.
- **AprilNflow и прочие компоненты** из архитектуры разворачиваются самостоятельно (в compose / те же процедуры), чтобы стенд был полным.

## 9. Качество после деплоя

После успешного `up`:

1. Один endpoint (smoke API).
2. Логин (через Keycloak / согласованный сценарий).
3. E2E (минимальный прогон).

**Артефакты в CI:** логи релевантных шагов, вывод `docker compose ps`, версия **commit** (и при необходимости digest образов).

## 10. Отказоустойчивость и «last good»

| Решение | Значение |
|--------|----------|
| Авто-rollback при failed healthcheck | Да |
| Downtime на dev | Допустим |

### Где хранить успешный релиз (согласованная модель)

1. **Git tag** — метка успешного деплоя на **commit** (например `deploy/dev-last-good` перемещается на последний зелёный commit, или используется отдельный префикс тегов по окружениям). По тегу однозначно восстанавливается код и ожидаемые версии в git.
2. **Теги образов на сервере** — **источник истины в рантайме**: файл **`images.env`** (и при необходимости server-local override), обновляемый пайплайном при успешном деплое. Так не нужно править закоммиченный `docker-compose.yml` при каждом релизе и нет конфликта с `git pull`.
3. `deploy.sh` поддерживает server-local состояние: `.deploy-state/images.env.previous` и `.deploy-state/images.env.last-good`.

При rollback: откатить **images.env** к предыдущим SHA, при необходимости выполнить откат миграций, затем `compose pull` / `up`, снова health + smoke.

## 11. Операционка

- Ручной redeploy на сервере: из каталога клона (**`DEPLOY_ROOT`**, для april-worker: `/opt/april-worker`) выполнить **`./deploy.sh`** (обёртка над шагами ниже; см. `--help` и переменные `SKIP_*` / `AUTO_ROLLBACK` / `REQUIRE_IMAGES_ENV`).
- Артефакты деплоя (`compose config`, `compose ps`, smoke/rollback логи, commit SHA) сохраняются в `.deploy-artifacts/deploy-<timestamp>` и подхватываются workflow как artifacts.
- Уведомления (Telegram, Slack, email): не используются.

## 12. Порядок шагов для агента (скелет pipeline)

1. Job на runner с labels `self-hosted`, `dev`, **`RUNNER_LABEL_EXTRA`** (для april-worker: `worker`), ref = commit после merge в `develop`.
2. Сборка и тесты (как принято в репо).
3. Сборка образов, push в ghcr.io с тегом по **git sha**.
4. На сервере: `cd` в **`DEPLOY_ROOT`** → **`./deploy.sh`** (внутри: preflight + `git pull`, `make openapi-lint`, `scripts/db-backup.sh`, `scripts/run-migrations.sh`, `make docs-build`, `docker compose pull` → `up -d`, health/readiness, `scripts/smoke-after-deploy.sh`, фиксация `last-good`). Либо те же шаги вручную: `git pull` → п.5–9.
5. Обновить **`images.env`** / `.env` под новые SHA образов (часто делает CI перед вызовом деплоя или вручную до/после `git pull`).
6. **Обязательно** снять дамп БД dev-стенда: **`pg_dump`** (до миграций и поднятия compose) — в скрипте деплоя: исполняемый **`scripts/db-backup.sh`**, если добавлен в репозиторий.
7. Миграции (отдельная команда **до** `up`) — **`scripts/run-migrations.sh`**, если добавлен.
8. `docker compose pull` → `docker compose up -d` (с overrides) — входит в **`deploy.sh`**.
9. Health по внутреннему URL/порту → smoke: endpoint → логин → E2E (`scripts/smoke-after-deploy.sh`).
10. Успех: обновить **images.env** как зафиксированный good (если ещё не записан), поставить/сдвинуть **git tag** успешного деплоя, загрузить артефакты (логи, `docker compose ps`, commit).
11. Провал: auto-rollback (`images.env.last-good` + `scripts/rollback-migrations.sh` при наличии) + повторные health/smoke; fail job при повторном провале.

## 13. Документация (Docusaurus, OpenAPI, Structurizr) на dev

Цель — **те же команды**, что локально (`make docs-build`, `make openapi-lint`, `docker compose config`), плюс выкладка артефактов на сервер.

### Локально и в CI

- На **pull request** и **push** в `main` / `develop`: workflow **CI** (`.github/workflows/ci.yml`) на GitHub-hosted runner выполняет `make openapi-lint` и `make docs-build` (без деплоя).
- Сборка сайта: из корня репозитория `make docs-build` (внутри: `npm ci` + `npm run build` в `docs-site/`).
- Проверка OpenAPI: `make openapi-lint` (Redocly, конфиг `redocly.yaml`).
- Просмотр через Compose: после `make docs-build` — `docker compose up -d`; Nginx раздаёт `docs-site/build`, пути `/openapi/`, `/swagger/`; Structurizr Lite — отдельный порт (см. `.env.example`).

### На dev-хосте (`DEV_HOST`, для april-worker: `dev.example.com`)

1. После `git pull` в **`DEPLOY_ROOT`** — **`./deploy.sh`** (включает `make docs-build`; нужны Node.js 18+ и npm на сервере, либо собрать статику в CI и скопировать артефакт — по договорённости) или вручную `make docs-build`.
2. Поднять/обновить сервисы — шаг `docker compose up -d` внутри **`deploy.sh`** с тем же `docker-compose.yml` (порты и TLS — за reverse proxy/Nginx на хосте или в отдельном контейнере; TLS не хранить в репозитории).
3. Проверить в браузере: главная страница документации (статика Docusaurus), `https://<host>/openapi/openapi.yaml`, `https://<host>/swagger/`, при открытом в firewall порте — Structurizr Lite на согласованном порту.

Когда появятся образы приложений и отдельный compose-профиль, документацию можно вынести в тот же compose-стек или оставить отдельным профилем `docs` — важно зафиксировать один способ в этом документе при первом полном деплое.

Первичная настройка Git и сервера: [`ADMIN_DEV_SERVER.md`](./ADMIN_DEV_SERVER.md).
