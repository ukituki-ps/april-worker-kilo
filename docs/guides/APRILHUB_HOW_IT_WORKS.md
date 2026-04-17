# Как работает AprilHub

Документ описывает базовую связку компонентов и основные runtime-потоки без дублирования source-of-truth документов.

## Ключевые компоненты

- `hub-shell` (React + Vite): UI-композиция guest/authorized зон, навигация и UX переходов.
- `hub-bff` (Go): REST API, аутентификация и RBAC-проверки на основе токена, агрегирование данных.
- Keycloak: источник identity, ролей и прав (OIDC/OAuth2 flow).
- Observability stack: Promtail + Loki + Grafana + Prometheus.
- Runtime зависимости: Redis/Asynq (queue), PostgreSQL (данные по мере развития модулей).

Подробности по стеку: `docs/AGENT_ARCHITECTURE_CONTEXT.md`.

## Основные потоки

### 1) Гостевой и авторизационный UX

1. Пользователь приходит через ingress (`/` -> `hub-shell`).
2. Для защищенных сценариев shell переводит пользователя в auth flow Keycloak (`/auth/*`).
3. После логина shell использует access token для вызова BFF API.

### 2) Backend и role-gated API

1. Запросы на `/api/*` маршрутизируются в `hub-bff`.
2. `hub-bff` валидирует токен и роли из Keycloak-контекста.
3. В зависимости от роли и endpoint-а:
   - возвращает профиль/агрегацию;
   - или отклоняет запрос корректным HTTP-кодом (`401`/`403`).

Контракты API и endpoint-ы фиксируются в OpenAPI:
- `/openapi/openapi.yaml`
- `/openapi/aprilhub-bff.yaml`

### 3) Наблюдаемость и эксплуатация

- Метрики, логи и dashboards связываются через observability stack.
- Деплой и post-deploy проверки синхронизированы со стратегией:
- `docs/DEPLOYMENT_STRATEGY.md`
  - [`OBSERVABILITY_INDEX.md`](./OBSERVABILITY_INDEX.md)

## Где смотреть детали архитектуры

- C4/архитектурный индекс: `docs/architecture/README.md`
- Runtime sequence-сценарии: `docs/architecture/C4_RUNTIME_SEQUENCES.md`
- Межсервисные связи: `docs/architecture/INTERSERVICE_LINKS.md`
