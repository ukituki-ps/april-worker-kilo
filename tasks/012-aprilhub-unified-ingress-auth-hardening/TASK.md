# Задача: Unified Ingress + Auth UX Hardening (Этап 012)

## Мета
- **ID / ветка:** `012-aprilhub-unified-ingress-auth-hardening`
- **Приоритет:** высокий
- **Связанные документы:** `task_list.md`, `tasks/000-aprilhub-full-service-roadmap/TASK.md`, `docs/DEPLOYMENT_STRATEGY.md`, `docs/AGENT_ARCHITECTURE_CONTEXT.md`, `tasks/002-aprilhub-auth-rbac/REPORT.md`, `tasks/003-aprilhub-shell-design-system/REPORT.md`

## Цель
Убрать операционную зависимость от ручного обращения к разным портам в AprilHub runtime и довести пользовательский auth-flow (guest -> Keycloak -> authorized/forbidden) до стабильного сценария через единый публичный вход Nginx.

## Контекст для агента
- На этапах `002` и `003` auth/RBAC и UX зоны уже реализованы на уровне MVP, но runtime-сценарий всё ещё завязан на разные host-port (`hub-shell`, `hub-bff`, `keycloak`).
- `docker-compose.yml` и `.env.example` сейчас ориентированы на прямые обращения к `localhost:<port>`.
- `infra/nginx/default.conf` обслуживает docs/openapi/swagger, но не является единым ingress для runtime сервисов AprilHub.
- Для dev-эксплуатации нужен единый base URL без необходимости «помнить порты».

## Входит в объём
- Спроектировать и реализовать unified ingress через Nginx для runtime AprilHub:
  - `/` -> `hub-shell`,
  - `/api/` -> `hub-bff`,
  - auth-префикс для Keycloak (`/auth/` или эквивалент по согласованию).
- Согласовать env-конфигурацию frontend/backend с ingress-моделью:
  - убрать жесткую привязку к `localhost:8081/8082` в runtime-пути,
  - привести redirect/logout URL Keycloak к единому публичному хосту/префиксам.
- Обновить compose и smoke-сценарии под работу через единый вход.
- Обновить документацию деплоя и проверки (включая auth smoke path).

## Не входит в объём
- Полная production hardening TLS/cert rotation и внешняя edge-инфраструктура за пределами текущего compose baseline.
- Редизайн UI или расширение бизнес-функциональности beyond auth/infra scope.
- Замена Keycloak или изменение принятых IAM принципов (RBAC source of truth остаётся Keycloak).

## Технические ограничения
- Следовать зафиксированному стеку: React/TS/Vite + Go REST + Keycloak + Nginx + Docker Compose.
- Не коммитить секреты и реальные credentials.
- Не ломать существующие docs маршруты (`/openapi/`, `/swagger/`) без обновления документации.
- Изменения OpenAPI не требуются, если API-контракты не меняются.

## Критерии готовности (acceptance)
- [x] Через один публичный endpoint доступны `hub-shell`, API (`/api/...`) и Keycloak auth flow.
- [x] UX сценарии `guest`, `transition`, `authorized`, `forbidden` проходят через ingress без ручного указания портов.
- [x] Frontend/backend env не содержат обязательной зависимости от прямых host-port Keycloak/BFF в пользовательском сценарии.
- [x] Smoke проверки покрывают unified ingress path для login + защищённых endpoint.
- [x] Обновлены `docs/DEPLOYMENT_STRATEGY.md` и связанные task-документы (`PLAN.md`, `REPORT.md`).

## Проверка (команды)
```bash
# конфигурация compose и nginx
docker compose --profile aprilhub config

# smoke runtime/auth через единый ingress
./scripts/smoke-aprilhub.sh
./scripts/smoke-after-deploy.sh
```

## Результат в отчёте
После реализации оформить `REPORT.md` с перечислением runtime/env/nginx изменений, фактических проверок (команды и результат), ограничений и follow-up по TLS/production ingress.
