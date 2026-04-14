# Задача: AprilHub Bootstrap (Sprint 0)

## Мета
- **ID / ветка:** `001-aprilhub-bootstrap`
- **Приоритет:** высокий
- **Связанные документы:** `task_list.md`, `docs/architecture/APRILHUB_C3_C4.md`, `docs/architecture/INTEGRATION_CONTRACTS.md`, `docs/architecture/C4_RUNTIME_SEQUENCES.md`, `structurizr/workspace.dsl`

## Цель
Подготовить минимально работоспособный baseline для реализации `AprilHub`: каркас `Hub Shell` и `Hub BFF`, согласованный API-контракт MVP, базовый runtime через compose и CI-проверки, чтобы следующая итерация могла реализовывать бизнес-сценарии без блокеров инфраструктуры и архитектуры.

## Контекст для агента
- Опора на `docs/AGENT_ARCHITECTURE_CONTEXT.md` и `README.md`.
- Ключевые архитектурные ориентиры по `AprilHub`: `docs/architecture/APRILHUB_C3_C4.md`.
- Текущие интеграционные контракты имеют статус draft: `docs/architecture/INTEGRATION_CONTRACTS.md`.
- `docker-compose.yml` в текущем состоянии поднимает документацию и не содержит runtime-сервисов `AprilHub`.
- `openapi/openapi.yaml` относится к `aprilWorker` и не покрывает `Hub BFF`.
- JWT/Auth реализация в `Hub Shell` и `Hub BFF` должна соответствовать `docs/auth-jwt-keycloak-adapted.md`.

## Входит в объём
- Создать структуру каталогов для `hub-bff` (Go) и `hub-shell` (React + TypeScript + Vite).
- Добавить минимальные runtime endpoints в `hub-bff`: `/healthz`, `/readyz`.
- Подготовить OpenAPI MVP для `Hub BFF` (`openapi/aprilhub-bff.yaml`) с системными endpoint-ами и 1 агрегированным endpoint.
- Добавить базовую интеграцию auth-контекста (структуры/контракт, без полной бизнес-логики).
- Развернуть `Keycloak` в dev-compose профиле AprilHub и выполнить базовую конфигурацию для старта разработки.
- Описать и подключить compose profile для запуска runtime-контейнеров `AprilHub`.
- Подготовить `.env.example`/документированные env-переменные для `AprilHub`.
- Добавить CI шаги для lint/build/test новых модулей.
- Обновить документацию по запуску dev-сценария для `AprilHub`.

## Не входит в объём
- Реализация полноценных бизнес-экранов и production-ready UI-композиции микрофронтов.
- Полная RBAC-матрица и все интеграционные use-case `Hub BFF`.
- Полный observability stack и продвинутый tracing (кроме обязательной propagation основы).
- E2E тесты полного пользовательского пути за пределами smoke-уровня.
- Production-hardening и HA-конфигурация Keycloak.

## Технические ограничения
- Следовать стеку из `docs/AGENT_ARCHITECTURE_CONTEXT.md`: Go, React/TypeScript/Vite, Keycloak, PostgreSQL, Redis/Asynq.
- Не менять технологические границы (без замены ключевых технологий).
- Секреты не коммитить; использовать env-шаблоны.
- Для внешних контрактов придерживаться политики draft->concrete из `docs/architecture/INTEGRATION_CONTRACTS.md`.
- Сохранять разделение ответственности: UI-агрегация в `Hub BFF`, доменная оркестрация вне `AprilHub`.
- Не внедрять локальный backend-refresh flow: без `/auth/login` и `/auth/refresh`; валидация токена через JWKS, а refresh/sso — зона ответственности Keycloak.
- Keycloak должен быть конфигурирован как источник истины IAM: realm, frontend client (OIDC PKCE), audience/claims для `Hub BFF`.

## Критерии готовности (acceptance)
- [x] В репозитории присутствуют каталоги и минимальная сборка для `hub-bff` и `hub-shell`.
- [x] `Hub BFF` отвечает на `/healthz` и `/readyz` в локальном запуске.
- [x] Добавлен OpenAPI файл `openapi/aprilhub-bff.yaml` с валидной схемой MVP.
- [x] OpenAPI и реализация auth соответствуют `docs/auth-jwt-keycloak-adapted.md`.
- [x] В compose-профиле `aprilhub` поднимается `Keycloak`, создан тестовый realm/client для `Hub Shell` и `Hub BFF`.
- [x] Smoke-логин через Keycloak проходит, `Hub Shell` получает access token, `Hub BFF` принимает его через JWKS.
- [x] Compose профиль запускает runtime AprilHub (не только docs-сервисы).
- [x] CI содержит проверки для новых модулей и проходит на базовом уровне.
- [x] Обновлена документация запуска (developer quickstart) для AprilHub.

## Проверка (команды)
```bash
# уточняются после добавления модулей; минимальный целевой набор
make openapi-lint
docker compose config
# для backend/frontend модулей:
# go test ./...
# npm run lint
# npm run build
# smoke auth path:
# docker compose --profile aprilhub up -d
# проверить доступность Keycloak и успешный OIDC login для тестового пользователя
```

## Результат в отчёте
После выполнения оформить `REPORT.md` в этой задаче: перечислить изменённые файлы, команды проверки, ограничения MVP и follow-up задачи Sprint 1.
