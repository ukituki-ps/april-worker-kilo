# Администратор: Git и dev-сервер

Пошаговый план для первичной настройки доступа к репозиторию и dev-стенда. Значения хоста, пользователя и каталога задайте в [`guides/PROJECT_DEFAULTS.md`](./guides/PROJECT_DEFAULTS.md); при копировании шаблона — [`guides/FORK_AND_CUSTOMIZE.md`](./guides/FORK_AND_CUSTOMIZE.md). Детали деплоя — [`DEPLOYMENT_STRATEGY.md`](./DEPLOYMENT_STRATEGY.md). Для central observability (multi-stand) — [`guides/OBSERVABILITY_MULTI_STAND_OPERATING_MODEL.md`](./guides/OBSERVABILITY_MULTI_STAND_OPERATING_MODEL.md) и [`guides/OBSERVABILITY_INDEX.md`](./guides/OBSERVABILITY_INDEX.md).

## 1. Git и GitHub

1. Создайте SSH-ключ (ed25519): `ssh-keygen -t ed25519 -C "your_email@example.com"`.
2. Добавьте **public** ключ в GitHub.
3. Клонируйте репозиторий: `git clone git@github.com:<org>/<repo>.git`.
4. Ветки: разработка в `feature/*` или `fix/*`, merge в `develop` через PR; при branch protection — не пушить напрямую в `main`/`develop`.

## 2. Сервер Debian 13 (`DEV_HOST`)

1. **DNS:** A-запись `DEV_HOST` (`dev.profile.april.ukituki.tech`) → `192.168.1.42` (Orange Pi).
2. **Пользователь ОС:** **`DEPLOY_USER`** с входом по SSH-ключу.
3. **Firewall:** **22/tcp**, **80/tcp**, **443/tcp**; дополнительные порты (например для Structurizr Lite) — по политике сети.
4. **Docker:** Docker Engine и Compose v2; пользователь деплоя в группе `docker`.
5. **Каталог:** `sudo mkdir -p <DEPLOY_ROOT> && sudo chown $USER:$USER <DEPLOY_ROOT>`; клон репозитория в **`DEPLOY_ROOT`**. Выкладка: **`./deploy.sh`** в этом каталоге.
6. **Секреты:** `.env`, `images.env` на сервере не коммитить; шаблоны — в репозитории.

## 3. GitHub Actions runner для deploy (self-hosted на `DEV_HOST`)

Цель: deploy-runner с labels **`self-hosted`**, **`dev`**, **`RUNNER_LABEL_EXTRA`** и клон в **`DEPLOY_ROOT`**, откуда workflow вызывает **`deploy.sh`** (см. `.github/workflows/dev-deploy.yml`).

1. **ПО:** Docker + Compose v2, Node.js 18+, npm, `git`, `curl`; пользователь в группе **`docker`**.
2. **Доступ к GitHub:** deploy key или credentials для `git fetch` на сервере.
3. **Каталог деплоя:** **`DEPLOY_ROOT`**, ветка `develop`, **`deploy.sh`**, локальный **`.env`**.
4. **Runner:** [actions/runner](https://github.com/actions/runner/releases), `./config.sh`, labels **`dev`** и **`RUNNER_LABEL_EXTRA`** (для AprilProfile: `profile`).
5. При необходимости — скрипт донастройки (создание каталога, systemd для runner) — по политике команды.
6. **Проверка:** runner **Idle** в GitHub; после merge в **`develop`** запускается **Deploy to dev**.
7. Путь к клону: variable **`APRIL_DEPLOY_ROOT`** в настройках репозитория, если не совпадает с умолчанием в workflow.

## 4. GitHub Actions runner для CI (self-hosted на `192.168.1.29`)

CI workflow `.github/workflows/ci.yml` выполняется на отдельном runner-хосте `192.168.1.29` с labels **`self-hosted`**, **`ci`**, **`profile`**.

1. Установите `actions/runner` и зарегистрируйте runner в репозитории/организации с labels `ci,profile`.
2. Убедитесь, что на хосте есть Docker, Node.js 20+, Go и доступ к интернету для установки зависимостей.
3. Проверьте статус runner в GitHub (**Idle**) и запуск CI на PR/push.
4. Runner service не должен запускаться под `root`: все CI-команды выполняются от пользователя runner (`runner-user`/`ukituki`).
5. Чтобы избежать `EACCES` на `actions/checkout` из-за root-owned артефактов (`.pnpm-store`, `node_modules`, `dist`), запускайте санитацию workspace под root:
   - `bash scripts/sanitize-ci-workspace.sh`
   - либо с явным шаблоном: `bash scripts/sanitize-ci-workspace.sh "/home/ukituki/actions-runner-april-worker-ci-*/_work/april-worker/april-worker"`
6. Рекомендуется повесить `scripts/sanitize-ci-workspace.sh` на `cron`/`systemd timer` (например, раз в 5-15 минут) на CI-хосте.

### Локальные кэши CI

Для self-hosted CI используются shared-кэши:

- `GOMODCACHE=/var/cache/aprilhub/go/pkg/mod`
- `GOCACHE=/var/cache/aprilhub/go/build`
- `npm_config_cache=/var/cache/aprilhub/npm`

Базовая подготовка на хосте:

- `mkdir -p /var/cache/aprilhub/go/pkg/mod /var/cache/aprilhub/go/build /var/cache/aprilhub/npm`
- `sudo chown -R "$(id -u):$(id -g)" /var/cache/aprilhub`

### Локальные registry mirror'ы

Для ускорения `docker pull` и Buildx:

- DockerHub mirror: `127.0.0.1:5000`
- GCR mirror: `127.0.0.1:5001`

Поднять mirror-контейнеры:

- `mkdir -p /home/ukituki/.cache/registry-mirror/docker /home/ukituki/.cache/registry-mirror/gcr`
- `docker rm -f dockerhub-mirror gcr-mirror >/dev/null 2>&1 || true`
- `docker run -d --restart unless-stopped --name dockerhub-mirror -p 127.0.0.1:5000:5000 -e REGISTRY_PROXY_REMOTEURL=https://registry-1.docker.io -v /home/ukituki/.cache/registry-mirror/docker:/var/lib/registry registry:2`
- `docker run -d --restart unless-stopped --name gcr-mirror -p 127.0.0.1:5001:5000 -e REGISTRY_PROXY_REMOTEURL=https://gcr.io -v /home/ukituki/.cache/registry-mirror/gcr:/var/lib/registry registry:2`

В workflow прогрев кэшей и mirror'ов выполняет `.github/workflows/ci-cache-warmup.yml` (по `cron` и вручную).

### Диагностика ownership-проблем

Проверить root-owned артефакты в workspace runner:

- `find /home/ukituki/actions-runner-april-worker-ci-*/_work -user root -print`

Если root-owned файлы появляются снова, в первую очередь проверьте шаги `docker run`/`docker compose` с bind mount: контейнеры, пишущие в workspace, должны запускаться с UID/GID текущего runner-пользователя.

## 5. Проверка документации на dev

После выкладки статики и `docker compose up` проверьте сайт, `/swagger/`, при необходимости порт Structurizr Lite.
