# TASK 4: Production CI/CD Infrastructure — REPORT.md

## Статус
✅ Выполнено

## Что реализовано

### 1. Dockerfiles

#### hub-bff/Dockerfile
- **Stage 1 (builder):** golang:1.24-alpine, кэширующий слой (go.mod → go mod download), static build CGO_ENABLED=0, trimmed binary
- **Stage 2 (production):** alpine:3.20, ca-certificates + wget, non-root user (1001:1001), healthcheck `/healthz` на порту 8081
- **Размер:** ~8MB (статический бинарник)
- **Smoke-test:** ✅ binary загружает конфиг, требует KEYCLOAK_URL/KEYCLOAK_REALM

#### hub-shell/Dockerfile
- **Stage 1 (build):** node:20-alpine, npm ci (GPR packages через NODE_AUTH_TOKEN), ds:prepare, ds:check-exports, tsc --noEmit, vite build → dist/
- **Stage 2 (production):** node:20-alpine, non-root user (1001:1001), Vite preview runtime, healthcheck wget на 4173
- **Fix:** добавлен `COPY hub-shell/index.html ./index.html` (Vite rollup entry point)
- **Smoke-test:** ✅ `vite preview` отдаёт HTML с правильной разметкой (lang="ru", April title)

### 2. docker-compose.prod.yml
- Override для hub-bff: image из `HUB_BFF_IMAGE` (images.env), без bind-mount, без dev command
- Override для hub-shell: image из `HUB_SHELL_IMAGE`, без bind-mount, dev-переменные (HMR) удалены
- Новый сервис `nginx-aprilhub`: production Nginx reverse proxy, port 80 → hub-shell, `/api/` → hub-bff, `/auth/` → Keycloak
- Профиль `aprilhub` — совместим с ключевым `--profile aprilhub`

### 3. infra/nginx/aprilhub.conf
- Production Nginx config без HMR/WebSocket upgrade headers
- Locations: `/auth/` → keycloak:8080 (stripped prefix), `/api/` → hub-bff:8081, `/healthz`, `/readyz`, `/` fallback → hub-shell:4173
- Без `resolver 127.0.0.11` (Docker DNS resolved при старте, не cache issue)

### 4. deploy.sh updates
- `MODE=production` включает `docker-compose.prod.yml` overlay
- Production mode пропускает: submodules sync, bind-mount repair, ds:prepare, frontend lock-recreate, git-tree-bff-recreate
- nginx reload: в dev → `nginx-docs`, в production → `nginx-aprilhub`
- Generic `reload_nginx_if_running` функция для обоих nginx сервисов
- Hard fail если production mode и нет `images.env`

### 5. dev-deploy.yml updates
- Двух-job pipeline: `build-and-push` (CI runner, labels `self-hosted,ci,profile`) → `deploy` (dev runner, labels `self-hosted,dev,profile`)
- Job outputs: `hub_bff_tag`, `hub_sHELL_tag` передаются через `$GITHUB_OUTPUT`
- Deploy job: git checkout SHA, update `images.env` с новыми тегами, docker pull, `MODE=production ./deploy.sh`
- GHCR login в обоих job'ах (`secrets.GHCR_PAT`)
- Cache dirs для Go/npm на self-hosted runner

### 6. .dockerignore
- Дополнительно исключён: `.github/`, `scripts/`, `tasks/`, `vendor/april-profile/backend/`, `Dockerfile` root-level
- .gitignore: добавлены `tasks/REPORT.md`, `hub-bff/Dockerfile.report.md`

## Коммит
`3d96e99` — `feat: production CI/CD infrastructure — Dockerfiles, compose overlay, deploy.sh MODE=production`

## Smoke-тесты локально
| Образ | Build | Runtime | Размер |
|-------|-------|---------|--------|
| hub-bff:test | ✅ PASS | ✅ binary loads config | ~8MB |
| hub-shell:test | ✅ PASS (index.html fix) | ✅ HTML served on 4173 | ~185MB |
| compose config --services | ✅ 9 services | - | - |
| deploy.sh syntax check | ✅ bash -n OK | - | - |

## Зависимости
- TASK 9 (Deployment hardening) — completed upstream
- Репозиторий сервера (`/home/ukituki/april-worker`) — требует синхронизации (git pull, recreate compose)

## Риски
1. **Self-hosted runner labels:** `deploy` job требует `self-hosted,dev,profile` — runner на serverDev должен быть зарегистрирован с этими labels
2. **SSH deploy keys:** `secrets.APRIL_PROFILE_DEPLOY_KEY` и `secrets.DISIGNAPRIL_DEPLOY_KEY` нужны для submodule checkout в deploy job
3. **GPR read token:** `secrets.GPR_READ_TOKEN` или `secrets.GITHUB_TOKEN` нужен для hub-shell build (private @ukituki-ps/* packages)
