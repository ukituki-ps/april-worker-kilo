# Задача: AprilHub Auth + RBAC (Sprint 1)

## Мета
- **ID / ветка:** `002-aprilhub-auth-rbac`
- **Приоритет:** высокий
- **Связанные документы:** `task_list.md`, `tasks/000-aprilhub-full-service-roadmap/TASK.md`, `tasks/001-aprilhub-bootstrap/REPORT.md`, `docs/auth-jwt-keycloak-adapted.md`, `docs/architecture/APRILHUB_C3_C4.md`, `openapi/aprilhub-bff.yaml`

## Цель
Реализовать рабочий auth/runtime-контур AprilHub поверх bootstrap-базы: полноценный OIDC login/logout flow в `hub-shell`, JWT-проверку в `hub-bff` по JWKS (с проверками `iss`, `aud|azp`, `exp`, `nbf`), endpoint профиля текущего пользователя и role-based guards, чтобы перейти к этапам компоновки shell и бизнес-агрегации без пробелов в IAM.

## Контекст для агента
- Базовый runtime для `hub-shell` и `hub-bff` уже создан в `001-aprilhub-bootstrap`.
- IAM-источник истины — Keycloak; схема должна строго соответствовать `docs/auth-jwt-keycloak-adapted.md`.
- В `hub-bff` уже есть базовый middleware JWT и защищённый endpoint; требуется доведение до полноценного auth-контракта.
- `openapi/aprilhub-bff.yaml` создан как MVP и требует расширения auth-операциями (`/me` и связанные ответы/ошибки).
- Ветка реализации AprilHub до завершения roadmap: `feature/aprilhub-implementation`.

## Входит в объём
- Реализовать в `hub-shell` OIDC login/logout flow (через Keycloak), включая bootstrap auth-state и controlled re-login.
- Добавить в `hub-shell` обработку `401/403` по стратегии из `docs/auth-jwt-keycloak-adapted.md`.
- Довести JWT middleware `hub-bff`: обязательные проверки claims (`iss`, `aud|azp`, `exp`, `nbf`), единообразные 401/403 ответы.
- Добавить endpoint текущего пользователя (`GET /api/v1/me` или согласованный эквивалент) в `hub-bff`.
- Добавить role guards для минимум двух уровней доступа (например `user`, `admin`) на API-уровне.
- Обновить `openapi/aprilhub-bff.yaml` под фактическую auth-реализацию и ошибки 401/403.
- Обновить env-переменные и developer docs по локальному auth-smoke сценарию.
- Добавить/обновить unit/integration проверки auth path в `hub-bff` и smoke-проверки для `hub-shell`.
- Добавить полноценный набор тестов функциональности auth/RBAC, включая corner cases (негативные и пограничные сценарии токенов, ролей, сессии и retry-логики).

## Не входит в объём
- Полная RBAC-матрица всех бизнес-сценариев и всех downstream-endpoint-ов.
- Реализация shell-composition runtime (`003`) и расширенной BFF-агрегации (`004`).
- Production-hardening Keycloak (HA, внешние IdP federation, advanced policies).
- Полный E2E регресс пользовательского пути beyond smoke.

## Технические ограничения
- Стек строго по `docs/AGENT_ARCHITECTURE_CONTEXT.md` (Go + React/TS/Vite + Keycloak).
- Не добавлять backend-endpoint-ы `/auth/login` и `/auth/refresh`; refresh lifecycle остаётся в Keycloak.
- Роли/права не дублировать в обход Keycloak; код использует claims токена.
- Секреты не коммитить; только env-шаблоны и dev-значения для локального запуска.
- Изменения API обязательно синхронизировать с `openapi/aprilhub-bff.yaml` в том же изменении.
- Изменения БД не требуются; если появятся — только через Atlas по `docs/TESTING_STRATEGY.md`.

## Критерии готовности (acceptance)
- [x] `hub-shell` выполняет login/logout через Keycloak OIDC и корректно инициализирует auth-state.
- [x] При истечении/невалидности токена реализовано controlled re-login поведение без бесконечных retry.
- [x] `hub-bff` валидирует JWT через JWKS с проверками `iss`, `aud|azp`, `exp`, `nbf`.
- [x] Реализован endpoint `GET /api/v1/me` (или согласованный эквивалент) с корректным профилем пользователя.
- [x] Role guards работают минимум для двух ролей и возвращают `403` при недостаточных правах.
- [x] В коде отсутствуют legacy backend-flow endpoint-ы `/auth/login` и `/auth/refresh`.
- [x] `openapi/aprilhub-bff.yaml` отражает auth-схему, endpoint профиля и 401/403 контракты.
- [x] Документация запуска/проверки auth path обновлена и воспроизводима локально.
- [x] CI-проверки новых/изменённых модулей проходят на базовом уровне.
- [x] Реализован и пройден полный тестовый набор auth/RBAC (unit + integration + smoke), включая corner cases.
- [x] Зафиксирован чеклист corner cases с ожидаемыми результатами и фактическим статусом в `REPORT.md`.

## Проверка (команды)
```bash
# backend
cd hub-bff && go test ./...

# frontend
cd hub-shell && npm run lint && npm run build

# (если добавлены отдельные тестовые скрипты)
# cd hub-shell && npm run test

# contracts and runtime
make openapi-lint
docker compose --profile aprilhub config
docker compose --profile aprilhub up -d

# smoke auth
# 1) login в Keycloak тестовым пользователем
# 2) получить access token
# 3) вызвать /api/v1/me и защищённый endpoint с валидным/невалидным token
# 4) проверить корректные статусы 200 / 401 / 403
# 5) corner cases:
#    - отсутствует Bearer token -> 401
#    - токен с неверным iss -> 401
#    - токен с неверным aud|azp -> 401
#    - просроченный token -> 401
#    - token с nbf в будущем -> 401
#    - доступ с недостаточной ролью -> 403
#    - после 401 на frontend выполняется controlled re-login без бесконечного retry
```

## Результат в отчёте
После выполнения оформить `REPORT.md` в этой задаче: перечислить изменённые файлы, фактические команды проверки, ограничения по RBAC MVP и follow-up задачи для этапов `003` и `004`.
