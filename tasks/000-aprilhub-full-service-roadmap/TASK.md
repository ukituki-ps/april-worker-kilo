# Задача: Full AprilHub Service Roadmap (верхнеуровневый backlog)

## Мета
- **ID / ветка:** `000-aprilhub-full-service-roadmap`
- **Приоритет:** стратегический
- **Связанные документы:** `docs/architecture/APRILHUB_C3_C4.md`, `docs/architecture/C4_RUNTIME_SEQUENCES.md`, `docs/architecture/INTERSERVICE_LINKS.md`, `docs/architecture/INTEGRATION_CONTRACTS.md`, `docs/auth-jwt-keycloak-adapted.md`, `docs/TESTING_STRATEGY.md`, `docs/DEPLOYMENT_STRATEGY.md`, `structurizr/workspace.dsl`

## Цель
Зафиксировать полный верхнеуровневый список задач, после выполнения которого `AprilHub` считается полноценно готовым сервисом в рамках принятой архитектуры и процессов проекта.

## Контекст для агента
- `AprilHub` по C3/C4 состоит из `Hub Shell` и `Hub BFF API` с Keycloak-based auth, UI-композицией микрофронтов и BFF-агрегацией.
- Межсервисная интеграция в экосистеме остаётся domain-to-domain; `AprilHub` не выступает интеграционной шиной.
- Контракты в `docs/architecture/INTEGRATION_CONTRACTS.md` сейчас draft и требуют доведения до исполняемого уровня для BFF-сценариев.
- Готовность определяется не только кодом, но и тестами, наблюдаемостью, деплоем и синхронизацией документации.
- JWT-аутентификация является обязательным архитектурным ограничением и должна строго соответствовать `docs/auth-jwt-keycloak-adapted.md`.

## Верхнеуровневые задачи (эпики)

### 001. Platform Bootstrap (базовый каркас)
- `hub-bff` (Go REST) + `hub-shell` (React/TS/Vite) как рабочие модули.
- Runtime health/readiness и минимальный local/dev запуск.
- Compose profiles для app + docs, без регрессии текущего docs-only режима.
- Базовый CI для новых модулей.

### 002. Auth & RBAC (Keycloak first)
- OIDC login/logout flow в `Hub Shell`.
- Валидация JWT в `Hub BFF` через JWKS (`iss`, `aud|azp`, `exp`, `nbf`).
- Endpoint профиля (`/me` или эквивалент) и role-based guards.
- UX-стратегия 401/403 и controlled re-login.
- Явный запрет локальной "legacy" схемы auth: без backend-эндпоинтов `/auth/login` и `/auth/refresh`, lifecycle refresh-токена остаётся в Keycloak.

### 003. Hub Shell Composition Runtime
- App Shell Core, Registry, Loader, Composition Layer, Shared UX Layer.
- Fallback/error boundaries для частичных отказов виджетов.
- Роутинг и инициализация пользовательского контекста (`user`, `roles`, `orgScope`, `correlationId`).
- В рамках этапа включён дизайн-системный UX-контур (`tasks/003-aprilhub-shell-design-system/TASK.md`):
  - неавторизованная зона (guest/login gate),
  - Keycloak login/logout transitions,
  - авторизованная зона (layout + базовые состояния loading/error/forbidden).

### 004. Hub BFF Aggregation Runtime
- Entry Controller + Use-case Orchestrator + Service Adapters + Response Composer.
- Минимум 3-5 агрегированных endpoint-ов для ключевых экранов.
- Политика timeout/retry/partial response (degraded mode) для fan-out.
- Согласованный формат ошибок и correlation propagation.

### 005. Integration Contracts & OpenAPI Hardening
- Финализация `Hub BFF -> downstream` контрактов (SLA, timeout, retry, compatibility).
- Синхронизация OpenAPI с реализацией (`aprilhub-bff.yaml`).
- Версионирование контрактов и политика обратной совместимости.

### 006. Observability & Operability
- Сквозной `correlationId/requestId/sourceService` через Shell -> BFF -> downstream.
- Техлоги, метрики latency/error-rate, базовые дашборды/алерты по принятым практикам.
- Операционные runbooks по отказам auth/downstream/degraded-mode.

### 007. Data & Background Processing Readiness (при необходимости)
- Если BFF/Hub требует persistence: схема БД и миграции через принятый tooling.
- При наличии фоновых задач: очередь/воркеры и идемпотентность.
- Чёткая граница: никакой доменной оркестрации, только поддержку UI-агрегации.

### 008. Testing Completion (по TESTING_STRATEGY)
- Unit: backend/frontend критические сценарии.
- Integration: API + зависимости (включая auth path и отказоустойчивость).
- Smoke E2E: login -> загрузка hub -> ключевые агрегированные виджеты.
- Нагрузочный baseline: k6 сценарии по критическим endpoint-ам BFF.

### 009. Deployment & Rollback Hardening (по DEPLOYMENT_STRATEGY)
- Полный dev-deploy pipeline для AprilHub образов и runtime.
- `images.env`/SHA flow, smoke-after-deploy, health/readiness gates.
- Резервное копирование до миграций и рабочий rollback (образы + БД при необходимости).

### 010. Architecture/Docs Finalization & Release Gate
- Синхронизация `structurizr/workspace.dsl` и `docs/architecture/*` с фактической реализацией.
- Обновление Docusaurus-гайдов по разработке/эксплуатации AprilHub.
- Фиксация существенных решений в ADR (если появились архитектурные развилки).
- Release checklist v1 и подтверждение Definition of Done.

## Не входит в объём этого документа
- Детальная декомпозиция каждого эпика в низкоуровневые tasks/subtasks.
- Техническая реализация конкретных endpoint-ов и UI-компонентов.
- Управление внешними командами/roadmap других сервисов.

## Definition of Ready для старта реализации каждого эпика
- [ ] Есть `TASK.md` с границами scope и acceptance.
- [ ] Есть `PLAN.md` для нетривиальных задач.
- [ ] Контракты/API для эпика задокументированы в OpenAPI/architecture docs.
- [ ] Определены команды проверки и ожидаемые артефакты в `REPORT.md`.

## Definition of Done для AprilHub как полноценного сервиса
- [ ] Реализованы и приняты эпики `001-010`.
- [ ] Release checklist v1 пройден и приложен: `docs/guides/APRILHUB_RELEASE_CHECKLIST_V1.md`.
- [ ] Реализация не противоречит `docs/architecture/*` и `structurizr/workspace.dsl`.
- [ ] Контракты `Hub BFF` согласованы и отражены в OpenAPI.
- [ ] Пройдены тестовые уровни (unit/integration/smoke E2E + k6 baseline).
- [ ] Dev deployment и rollback воспроизводимы по `docs/DEPLOYMENT_STRATEGY.md`.
- [ ] Документация и ADR актуальны относительно фактического состояния сервиса.
