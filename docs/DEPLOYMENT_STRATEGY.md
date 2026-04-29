# Стратегия деплоя (dev): GitHub Actions + self-hosted runner

Документ для агента и команды: зафиксированные решения и порядок шагов для деплоя на **dev-хост** (`DEV_HOST`). Конкретные значения — в [`guides/PROJECT_DEFAULTS.md`](./guides/PROJECT_DEFAULTS.md); при копировании шаблона замените их по [`guides/FORK_AND_CUSTOMIZE.md`](./guides/FORK_AND_CUSTOMIZE.md).

Ниже для **AprilHub** (репозиторий `ukituki-ps/april-worker`): типовой **`DEPLOY_ROOT`** на сервере — `/opt/april-worker` (см. `deploy.sh`, workflow **Deploy to dev**). Для микросервиса **AprilProfile** (отдельный репозиторий): `DEV_HOST` = `dev.profile.april.ukituki.tech`, `DEV_HOST_IP` = `192.168.1.42` (Orange Pi), **`DEPLOY_ROOT`** = `/opt/april-profile`. CI self-hosted runner размещён отдельно на `192.168.1.29`.

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

**Реализация в репозитории:** workflow **Deploy to dev** (файл `.github/workflows/dev-deploy.yml`) на **self-hosted** runner с labels **`dev`** и **`RUNNER_LABEL_EXTRA`** (для AprilProfile: `profile`) выполняет в каталоге клона **`APRIL_DEPLOY_ROOT`** `git fetch`, переход на коммит **`github.sha`** из **того же** репозитория, что и workflow (для `april-worker` клон на сервере обязан быть `ukituki-ps/april-worker`, иначе `git checkout` по SHA коммита из события workflow завершится ошибкой), затем **`SKIP_GIT_PULL=1 ./deploy.sh`**. Дефолт пути в workflow — `/opt/april-worker`; переопределение — **repository variable** `APRIL_DEPLOY_ROOT`. Ручной перезапуск того же сценария — **Actions → Deploy to dev → Run workflow** (`workflow_dispatch`).

## 2. Runner

| Решение | Значение |
|--------|----------|
| Размещение | Deploy runner на том же сервере, что обслуживает `DEV_HOST` (для AprilProfile: `dev.profile.april.ukituki.tech` / `192.168.1.42`) |
| Охват | Один runner на все репозитории |
| Администрирование | Вручную: обновления и перезапуск `actions.runner` |
| Labels | `dev`, **`RUNNER_LABEL_EXTRA`** — jobs указывают `runs-on` с этими labels (для AprilProfile: `dev`, `profile`) |

CI jobs (`.github/workflows/ci.yml`) выполняются на отдельном self-hosted runner на `192.168.1.29` с labels `self-hosted`, `ci`, `profile`.

| Решение | Значение |
|--------|----------|
| Пользователь ОС | `DEPLOY_USER` (задайте на сервере; в шаблоне часто отдельный пользователь `deploy`) |
| Docker | Доступ через группу **`docker`**, прав достаточно для деплоя |

## 3. Секреты

- **GitHub Secrets** — всё, что нужно CI (логин в ghcr, при необходимости токены).
- **На сервере** — `.env` и при необходимости отдельные env-файлы в каталоге **`DEPLOY_ROOT`** (AprilHub: путь из **`APRIL_DEPLOY_ROOT`**; AprilProfile: типично `/opt/april-profile`).

### 3.1 GitHub Packages (npm): зависимости `hub-shell` (`@ukituki-ps/*`)

- **CI (GitHub Actions):** в workflow заданы `permissions.packages: read` и **`NODE_AUTH_TOKEN`**: по умолчанию **`GITHUB_TOKEN`**, при необходимости доступа к пакетам из другого репозитория org — добавьте secret **`GPR_READ_TOKEN`** (classic PAT: `read:packages`, при приватном репозитории пакета — `repo`; для org с SSO — authorize). Workflow использует выражение `secrets.GPR_READ_TOKEN || secrets.GITHUB_TOKEN`. Токены не выводить в логи шагов.
- **Self-hosted CI runner** (`192.168.1.29`, labels `ci`, `profile`): секреты подтягиваются из настроек репозитория так же, как на GitHub-hosted; runner должен иметь исходящий доступ к `https://npm.pkg.github.com`.
- **Dev-хост / ручной `npm ci` в `hub-shell`:** экспортируйте **`NODE_AUTH_TOKEN`** в окружение или добавьте в **`.env`** в **`DEPLOY_ROOT`** (см. `.env.example`), чтобы `docker compose` передал переменную в сервис `hub-shell` (см. `docker-compose.yml`).

Ограничение workflow по путям/файлам: **не используется** — любой merge в `develop` ведёт к полному пайплайну.

### 3.1. GitHub Packages: приватные npm-пакеты `@april/*` (дизайн-система)

Контур **образов приложений** остаётся в **ghcr.io** по git SHA (раздел **«4. Сборка и registry»** ниже в этом документе). Отдельно для **`hub-shell`** после эпика **`049`** и задачи **`049-03`**: зависимости **`@april/tokens`** / **`@april/ui`** ставятся из **npm registry GitHub Packages** (`https://npm.pkg.github.com`, scope `@april`; см. [`ADR-april-design-system-npm-distribution.md`](./architecture/ADR-april-design-system-npm-distribution.md), [`guides/DESIGN_SYSTEM.md`](./guides/DESIGN_SYSTEM.md)).

| Где | Переменная / механизм | Заметки |
|-----|------------------------|---------|
| **GitHub Actions** (job `hub-shell`, сборка образа) | **`NODE_AUTH_TOKEN`** | Токен с правом **`read:packages`** для организации, где опубликованы пакеты (часто **`GITHUB_TOKEN`** workflow или отдельный **PAT** в **Repository secret**). Передаётся в шаги `npm ci` / `npm run build` и при **`docker build`** через **`--build-arg NODE_AUTH_TOKEN=...`** (значение не логировать). |
| **Локально / агент на runner** | тот же **`NODE_AUTH_TOKEN`** + **`hub-shell/.npmrc`** по шаблону **`.npmrc.example`** | Шаблон без секретов в git; реальный `.npmrc` с токеном — только в среде исполнения и в **`.gitignore`**, если создаётся вручную. |
| **Сервер `DEPLOY_ROOT` (dev)** | Обычно **не нужен** токен npm на сервере | Образ **`HUB_SHELL_IMAGE`** уже собран в CI с вшитым `node_modules`; сервер делает **`docker compose pull`**, а не `npm ci` для shell. Если когда-либо сборка shell переносится на сервер — на build-хосте нужны те же переменные, что в CI. |

**Чеклист при внедрении registry:** завести secret / переменные для **`NODE_AUTH_TOKEN`**, проверить **`npm view @april/ui version`** с read-доступом, убедиться, что в логах CI нет утечки токена; ротация PAT — по владельцу секретов (см. ADR, раздел об ответственности).

## 4. Сборка и registry

| Решение | Значение |
|--------|----------|
| Registry | **ghcr.io** |
| Теги образов | **Только `git sha`** (без обязательных `latest` / `dev`) |
| Multi-arch | Нет |

## 5. Каталог деплоя и compose

| Решение | Значение |
|--------|----------|
| Путь на сервере | `DEPLOY_ROOT` (AprilHub `april-worker`: `/opt/april-worker`; AprilProfile: `/opt/april-profile`) |
| Обновление исходников на сервере | **`git pull`** в этом каталоге |
| Инструмент | **`docker compose` v2** |
| Файлы | `docker-compose.yml` + overrides |

### Версии образов и источник истины

- **Теги образов (SHA)** задаются через **`.env`** и/или отдельный **`images.env`** на сервере. Compose-файлы в git ссылаются на переменные (например `HUB_BFF_IMAGE` / `HUB_SHELL_IMAGE`), а конкретные значения подставляются из этих файлов.
- **`images.env` (и при необходимости server-local override)** — **не коммитятся** в репозиторий (или коммитится только шаблон без секретов). Так `git pull` в **`DEPLOY_ROOT`** не перезаписывает задеплоенные версии образов и не требует обратных коммитов из CI.

### 5.1 Что должно быть на сервере один раз (AprilHub)

Чеклист для каталога **`DEPLOY_ROOT`** (клон `ukituki-ps/april-worker` на dev-хосте или путь из GitHub variable **`APRIL_DEPLOY_ROOT`**):

| # | Артефакт | Назначение |
|---|-----------|------------|
| 1 | **Git-клон** `april-worker`, `origin` → тот же репозиторий, что и workflow | Иначе `git checkout` по `github.sha` в **Deploy to dev** падает |
| 2 | **Docker** + **Compose v2**, пользователь runner/деплоя в группе **`docker`** | `deploy.sh` вызывает `docker compose` |
| 3 | **`.env`** в корне клона (не в git) | Скопировать из **`.env.example`**, выставить порты, Keycloak, `APRIL_PROFILE_ADMIN_URL`, домены под стенд |
| 4 | **`images.env`** в корне клона (не в git) | Минимум — файл существует (`deploy.sh` с `REQUIRE_IMAGES_ENV=1`); теги **`HUB_BFF_IMAGE`**, **`HUB_SHELL_IMAGE`** (и при необходимости **`APRIL_SHOWCASE_IMAGE`**) в **ghcr.io** только по **git SHA** — см. **`images.env.example`** |
| 5 | **`./deploy.sh` исполняемый** | При необходимости `chmod +x deploy.sh` |
| 6 | **GitHub Actions** для job **Deploy to dev** | **Secret** `APRIL_PROFILE_DEPLOY_KEY` (SSH-ключ для `git submodule` **vendor/april-profile** в `deploy.sh`); **Variable** `APRIL_DEPLOY_ROOT` = абсолютный путь к клону на runner |
| 7 | **Self-hosted runner** с метками **`dev`** и **`RUNNER_LABEL_EXTRA`** (напр. `profile`) | Совпадает с `runs-on` в `.github/workflows/dev-deploy.yml` |
| 8 | **`NODE_AUTH_TOKEN` в `.env` на dev-хосте** (опционально, если без него `hub-shell` не может выполнить `npm ci` к приватным пакетам) | PAT только `read:packages`; тот же смысл, что в CI — см. §3.1; значение не коммитить |

Автоматизация (идемпотентно, не перезаписывает существующие `.env` / `images.env`):

```bash
cd "$DEPLOY_ROOT"   # например /home/ukituki/april-worker
./scripts/bootstrap-server-deploy-once.sh
```

После первого успешного деплоя `deploy.sh` создаёт/обновляет server-local **`.deploy-state/`** (в т.ч. `images.env.last-good`); это не требует ручной подготовки заранее.

## 6. Data-layer: PostgreSQL + Redis

| Решение | Значение |
|--------|----------|
| PostgreSQL | Контейнер на том же хосте (baseline stage `011`) |
| Redis | Контейнер на том же хосте, `appendonly yes`, `requirepass`, отдельный volume (`redis_data`) |
| Резервная копия перед изменением БД | Перед миграциями и `docker compose up` **обязательно** снять дамп БД dev-стенда командой **`pg_dump`** через `scripts/db-backup.sh` |
| Миграции | Отдельный шаг **до** `docker compose up` через `scripts/run-migrations.sh` (Atlas-ready, fail-fast при явной конфигурации и отсутствии tooling) |
| Откат | При неуспехе — авто-rollback: откат `images.env` на `last-good`, запуск `scripts/rollback-migrations.sh` (если настроен), затем повторный `compose up` + health/smoke |

### Stage `011`: operational readiness artifacts

- Target-state and ownership split: [`infra/POSTGRES_REDIS_PROD_READINESS.md`](./infra/POSTGRES_REDIS_PROD_READINESS.md).
- PostgreSQL backup/restore runbook: [`runbooks/POSTGRES_BACKUP_RESTORE.md`](./runbooks/POSTGRES_BACKUP_RESTORE.md).
- Redis failure/recovery runbook: [`runbooks/REDIS_FAILURE_RECOVERY.md`](./runbooks/REDIS_FAILURE_RECOVERY.md).
- Validation scripts:
  - `scripts/validate-postgres-restore.sh`
  - `scripts/redis-resilience-check.sh`

## 7. Сеть, Nginx, домен

| Решение | Значение |
|--------|----------|
| Health / readiness | Проверка по **внутреннему порту** |
| Nginx | Единый ingress в контейнере; обновление через compose, без reload nginx на хосте |

### Единый ingress без ручных портов (stage `012`)

- Публичная точка входа dev-стенда: `http://<host>:${DOCS_HTTP_PORT}` (или домен reverse proxy).
- Маршрутизация:
  - `/` -> `hub-shell` (guest/transition/authorized UX),
  - `/api/*` -> `hub-bff`,
  - `/auth/*` -> `keycloak`,
  - `/docs/*`, `/openapi/*`, `/swagger/*` -> документация и контрактные артефакты.
- Для smoke/deploy проверок по умолчанию используется ingress URL, а не прямые порты `hub-bff`/`keycloak`.

## 8. Keycloak и остальная архитектура

- **Keycloak** — в том же compose; redirect URI при каждом деплое **не меняются**.
- **AprilNflow и прочие компоненты** из архитектуры разворачиваются самостоятельно (в compose / те же процедуры), чтобы стенд был полным.

### TLS ingress для Keycloak (обязательно для доменов с HTTPS)

Чтобы исключить mixed-content и предупреждения браузера при логине, на TLS-стендах фиксируйте схему/host для Keycloak:

1. В `.env` на сервере задайте `KC_HOSTNAME=https://<ваш-домен>`.
2. В `docker-compose.yml` для `keycloak` должны быть включены:
   - `KC_PROXY_HEADERS=xforwarded`
   - `KC_HOSTNAME_STRICT=false`
   - `KC_HOSTNAME_STRICT_HTTPS=false`
3. В ingress/reverse proxy обязательно пробрасывайте:
   - `X-Forwarded-Proto=https`
   - `X-Forwarded-Host=<ваш-домен>`
   - `X-Forwarded-Port=443`
4. После изменения переменных/конфига выполните `docker compose up -d --force-recreate keycloak nginx-docs`.

Проверка: `issuer` в `/.well-known/openid-configuration` должен быть `https://<ваш-домен>/auth/realms/<realm>`.

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

Release-gate checklist для завершения AprilHub roadmap `001-010`: [`guides/APRILHUB_RELEASE_CHECKLIST_V1.md`](./guides/APRILHUB_RELEASE_CHECKLIST_V1.md).

## 11. Операционка

Для central observability контура (multi-service + multi-stand) используйте:

- [`guides/OBSERVABILITY_INDEX.md`](./guides/OBSERVABILITY_INDEX.md)
- [`guides/OBSERVABILITY_MULTI_STAND_OPERATING_MODEL.md`](./guides/OBSERVABILITY_MULTI_STAND_OPERATING_MODEL.md)
- [`runbooks/OBSERVABILITY_STACK_DEPLOY.md`](./runbooks/OBSERVABILITY_STACK_DEPLOY.md)
- [`runbooks/OBSERVABILITY_STACK_ONBOARDING.md`](./runbooks/OBSERVABILITY_STACK_ONBOARDING.md)

- Ручной redeploy на сервере: из каталога клона (**`DEPLOY_ROOT`**, для AprilProfile: `/opt/april-profile`) выполнить **`./deploy.sh`** (обёртка над шагами ниже; см. `--help` и переменные `SKIP_*` / `AUTO_ROLLBACK` / `REQUIRE_IMAGES_ENV`).
- Артефакты деплоя (`compose config`, `compose ps`, smoke/rollback логи, commit SHA) сохраняются в `.deploy-artifacts/deploy-<timestamp>` и подхватываются workflow как artifacts.
- Уведомления (Telegram, Slack, email): не используются.

## 12. Порядок шагов для агента (скелет pipeline)

1. Job на runner с labels `self-hosted`, `dev`, **`RUNNER_LABEL_EXTRA`** (для AprilProfile: `profile`), ref = commit после merge в `develop`.
2. Сборка и тесты (как принято в репо).
3. Сборка образов, push в ghcr.io с тегом по **git sha**.
4. На сервере: `cd` в **`DEPLOY_ROOT`** → **`./deploy.sh`** (внутри: preflight + `git pull`, `make openapi-lint`, `scripts/db-backup.sh`, `scripts/run-migrations.sh`, `make docs-build`, `docker compose pull` → `up -d`, health/readiness, ingress-check `/` c блокировкой 5xx, `scripts/smoke-after-deploy.sh`, фиксация `last-good`). Дополнительно `deploy.sh` отслеживает изменения lock-файлов фронтенда (`hub-shell/package-lock.json`, `design-system/DisignApril/pnpm-lock.yaml`) и делает `docker compose up -d --force-recreate` для соответствующего сервиса (`hub-shell` / `april-showcase`), чтобы гарантировать повторную установку зависимостей после merge. Либо те же шаги вручную: `git pull` → п.5–9.
5. Обновить **`images.env`** / `.env` под новые SHA образов (часто делает CI перед вызовом деплоя или вручную до/после `git pull`).
6. **Обязательно** снять дамп БД dev-стенда: **`pg_dump`** (до миграций и поднятия compose) — в скрипте деплоя: исполняемый **`scripts/db-backup.sh`**, если добавлен в репозиторий.
7. Выполнить проверку restore-пути PostgreSQL: **`scripts/validate-postgres-restore.sh`** (на последнем backup или указанном dump-файле).
8. Выполнить baseline recovery-check Redis: **`scripts/redis-resilience-check.sh`**.
9. Миграции (отдельная команда **до** `up`) — **`scripts/run-migrations.sh`**, если добавлен.
10. `docker compose pull` → `docker compose up -d` (с overrides) — входит в **`deploy.sh`**.
11. Health по внутреннему URL/порту → smoke: endpoint → логин → E2E (`scripts/smoke-after-deploy.sh`).
12. Успех: обновить **images.env** как зафиксированный good (если ещё не записан), поставить/сдвинуть **git tag** успешного деплоя, загрузить артефакты (логи, `docker compose ps`, commit).
13. Провал: auto-rollback (`images.env.last-good` + `scripts/rollback-migrations.sh` при наличии) + повторные health/smoke; fail job при повторном провале.

### Auto-observability onboarding (multi-stand)

`deploy.sh` поддерживает post-deploy onboarding стенда в central observability через `scripts/observability-onboard-stand.sh`.

Основные переменные:

- `OBS_AUTO_ONBOARD=1` — включить авто-onboarding.
- `OBS_CENTRAL_HOST=<ip|dns>` — central observability host (обязательно при включении).
- `OBS_CENTRAL_USER=<user>` — SSH-пользователь central host (по умолчанию текущий пользователь).
- `OBS_CENTRAL_OBS_PATH=<path>` — путь к `infra/observability` на central host (по умолчанию `/opt/april/infra/observability`).
- `OBS_STAND_HOST=<ip|dns>` — адрес текущего стенда (по умолчанию `hostname -I`).
- `OBS_STAND_NAME=<name>` — идентификатор стенда (по умолчанию `stand-<OBS_STAND_HOST>`).
- `OBS_SERVICE_NAME=<service>` — service label для metrics target (по умолчанию `hub-bff`).
- `OBS_METRICS_PORT=<port>` — порт `/metrics` (по умолчанию `HUB_BFF_PORT` или `8081`).
- `OBS_ENV_NAME=<env>` — env label (по умолчанию `dev`).
- `OBS_SETUP_LOCAL_PROMTAIL_AGENT=1` — развернуть/обновить локальный `promtail-agent` на текущем стенде.
- `OBS_LOKI_PUSH_URL=<url>` — push URL Loki для `promtail-agent` (по умолчанию `http://<OBS_CENTRAL_HOST>:3100/loki/api/v1/push`).
- `SKIP_OBSERVABILITY_ONBOARD=1` — явный пропуск шага onboarding.

Важно для metrics onboarding:

- `OBS_STAND_HOST:OBS_METRICS_PORT` должен быть достижим с central observability host.
- Для `hub-bff` это обычно требует публикации порта на стенде (например `ports: - "${HUB_BFF_PORT:-8081}:8081"` в compose или эквивалентный routing/firewall path).
- Если `/metrics` недоступен локально на стенде (`127.0.0.1:<OBS_METRICS_PORT>/metrics`), onboarding создаст target, но он будет `DOWN`.

## 13. Документация (Docusaurus, OpenAPI, Structurizr) на dev

Цель — **те же команды**, что локально (`make docs-build`, `make openapi-lint`, `docker compose config`), плюс выкладка артефактов на сервер.

### Локально и в CI

- На **pull request** и **push** в `main` / `develop`: workflow **CI** (`.github/workflows/ci.yml`) на self-hosted runner (`self-hosted`, `ci`, `profile`, хост `192.168.1.29`) выполняет `make openapi-lint` и `make docs-build` (без деплоя).
- Сборка сайта: из корня репозитория `make docs-build` (внутри: `npm ci` + `npm run build` в `docs-site/`).
- Проверка OpenAPI: `make openapi-lint` (Redocly, конфиг `redocly.yaml`).
- Просмотр через Compose: после `make docs-build` — `docker compose up -d`; Nginx работает как unified ingress: `hub-shell` на `/`, docs на `/docs/`, OpenAPI на `/openapi/`, Swagger UI на `/swagger/`; Structurizr Lite — отдельный порт (см. `.env.example`).

### На dev-хосте (`DEV_HOST`, для AprilProfile: `dev.profile.april.ukituki.tech`)

1. После `git pull` в **`DEPLOY_ROOT`** — **`./deploy.sh`** (включает `make docs-build`; нужны Node.js 18+ и npm на сервере, либо собрать статику в CI и скопировать артефакт — по договорённости) или вручную `make docs-build`.
2. Поднять/обновить сервисы — шаг `docker compose up -d` внутри **`deploy.sh`** с тем же `docker-compose.yml` (публично достаточно ingress-порта Nginx; TLS остаётся на внешнем reverse proxy/edge).
3. Проверить в браузере: shell на `https://<host>/`, docs на `https://<host>/docs/`, `https://<host>/openapi/openapi.yaml`, `https://<host>/swagger/`; при открытом в firewall порте — Structurizr Lite на согласованном порту.

Когда появятся образы приложений и отдельный compose-профиль, документацию можно вынести в тот же compose-стек или оставить отдельным профилем `docs` — важно зафиксировать один способ в этом документе при первом полном деплое.

Первичная настройка Git и сервера: [`ADMIN_DEV_SERVER.md`](./ADMIN_DEV_SERVER.md).
