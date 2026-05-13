# =============================================================================
# April Worker — hub-shell Dockerfile
# Multi-stage build: сборка Vite-приложения → production образ для preview.
#
# Используется для CI-сборки образа, который потом деплоится на dev/stage
# через docker compose (см. docs/DEPLOYMENT_STRATEGY.md).
#
# Перед docker build необходимо выполнить:
#   git submodule update --init --recursive
# чтобы были доступны design-system/DisignApril и vendor/april-profile.
#
# Пример сборки:
#   docker build --build-arg NODE_AUTH_TOKEN=<token> -t hub-shell:sha -f hub-shell/Dockerfile .
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: build — сборка приложения (Vite + TypeScript)
# ---------------------------------------------------------------------------
FROM node:20-alpine AS build

# NODE_AUTH_TOKEN нужен для npm ci (GPR registry, @ukituki-ps/*).
# Передаётся через --build-arg, не попадает в финальный образ.
ARG NODE_AUTH_TOKEN
ENV NODE_AUTH_TOKEN=${NODE_AUTH_TOKEN}

WORKDIR /workspace

# --- Кэш-слой: копируем lock-файлы и ставим зависимости до основного copy ---
# Это позволяет Docker кэшировать слой npm ci, пока не меняется package-lock.json.
COPY hub-shell/package.json hub-shell/package-lock.json hub-shell/.npmrc ./
COPY vendor/april-profile/frontend/packages/profile-ui/package.json ./vendor-april-profile-pkg.json
RUN npm ci

# --- Corepack + pnpm для ds-prepare ---
# ds-prepare.sh может вызвать pnpm (через corepack) для сборки DisignApril,
# хотя при использовании GPR-пакетов это обычно пропустится.
RUN corepack enable

# --- Полный copy исходников ---
# Vite требует index.html в корне workspace (entry point для rollup).
COPY hub-shell/index.html ./index.html
COPY hub-shell/src ./src
COPY hub-shell/scripts ./scripts
COPY hub-shell/public ./public
COPY hub-shell/vite.config.ts ./vite.config.ts
COPY hub-shell/tsconfig.json ./tsconfig.json

# --- Submodule: vendor/april-profile ---
# Vite alias @april/profile-ui-external -> vendor/april-profile/.../src/index.ts
# Нужен на этапе build (и для vite preview, которое делает tsc --noEmit).
COPY vendor/april-profile/frontend ./../vendor/april-profile/frontend

# --- Submodule: design-system/DisignApril ---
# ds-prepare.sh проверяет наличие directory; при GPR-пакетах сборка монорепо
# пропускается, но fallback tokens всё равно нужен.
COPY design-system/DisignApril ./../design-system/DisignApril

# --- Сборка ---
# ds:prepare → ds:check-exports → tsc --noEmit → vite build → dist/
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2: production — Vite preview server
# ---------------------------------------------------------------------------
FROM node:20-alpine AS production

# Неротевой пользователь (согласно DEPLOYMENT_STRATEGY.md и security-практикам).
ARG UID=1001
ARG GID=1001
RUN addgroup -g ${GID} -S appgroup && \
    adduser -u ${UID} -S appuser -G appgroup

WORKDIR /app

# Копируем dist/ и node_modules/ из build-стадии.
# node_modules нужен для runtime (Vite preview зависит от devDependencies
# вроде vite, @vitejs/plugin-react и всех production deps).
COPY --from=build /workspace/dist ./dist
COPY --from=build /workspace/package.json ./package.json
COPY --from=build /workspace/node_modules ./node_modules

USER appuser

EXPOSE 4173

# Healthcheck: wget на корневой путь (Vite preview server отвечает HTML).
# wget есть в alpine по умолчанию; --spider проверяет доступность без скачивания.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:4173/ || exit 1

# Vite preview — статический сервер с подключением SSR/middleware.
# --host 0.0.0.0 для доступа из контейнера наружу (docker compose, reverse proxy).
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
