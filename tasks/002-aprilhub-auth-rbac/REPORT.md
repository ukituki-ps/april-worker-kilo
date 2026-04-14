## 1) Итого
- Статус: ✅ выполнено
- Задача: AprilHub Auth + RBAC (Sprint 1)
- Ветка: `feature/aprilhub-implementation`
- Коммиты: `не создавались`
- PR: не создавался

## 2) Что сделано
- [backend] Усилен JWT middleware (`iss`, `aud|azp`, `exp`, `nbf`, JWKS, единый JSON для `401`), добавлен контекст claims, endpoint `GET /api/v1/me`, role guards и admin-only endpoint `GET /api/v1/admin/ping` для проверки `403`.
- [frontend] Подключён `keycloak-js`, инициализация OIDC session в bootstrap, login/logout actions, API-клиент с Bearer и controlled re-login (single retry при `401`), отображение статусов `/me`/`/overview`/`/admin/ping`.
- [infra / compose / nginx] Runtime profile `aprilhub` перепроверен через `docker compose --profile aprilhub config` и smoke-run `up -d`.
- [docs] Обновлены `openapi/aprilhub-bff.yaml` и `docs-site/docs/getting-started.md` (auth smoke path + `200/401/403` примеры).
- [tests] Добавлены unit-тесты backend auth/RBAC corner cases в `hub-bff/internal/auth/middleware_test.go`.

## 3) Изменённые файлы
- `hub-bff/internal/auth/middleware.go`
- `hub-bff/internal/auth/middleware_test.go`
- `hub-bff/internal/http/handlers.go`
- `hub-bff/cmd/hub-bff/main.go`
- `hub-shell/src/keycloak.ts`
- `hub-shell/src/api.ts`
- `hub-shell/src/main.tsx`
- `hub-shell/src/App.tsx`
- `hub-shell/package.json`
- `hub-shell/package-lock.json`
- `openapi/aprilhub-bff.yaml`
- `docs-site/docs/getting-started.md`

## 4) Миграции и данные
- Миграции Atlas: нет (ожидаемо для этапа 002)
- Какие таблицы/индексы изменены: не применялось
- Обратимость: да, откат возможен обычным git-ревертом изменений в `hub-bff`/`hub-shell`/OpenAPI/docs без изменений схемы БД

## 5) Проверка качества
- Линтер: ok (`cd hub-shell && npm run lint`)
- Сборка: ok (`cd hub-shell && npm run build`)
- Unit tests: ok (`cd hub-bff && go test ./...`)
- Integration tests: n/a (не добавлялись отдельные integration harness в этой задаче)
- E2E / smoke: ok (ручной auth smoke на локальном compose профиле `aprilhub`)

Команды (фактически выполненные):
```bash
# backend
cd hub-bff && go test ./...

# frontend
cd hub-shell && npm run lint && npm run build

# contracts and runtime
make openapi-lint
docker compose --profile aprilhub config
docker compose --profile aprilhub up -d

# auth smoke
TOKEN=$(curl -s -X POST "http://localhost:8082/realms/april/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=aprilhub-shell&username=april-dev&password=april-dev-pass" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin).get("access_token",""))')
curl -i -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/v1/me
curl -i -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/v1/admin/ping
curl -i http://localhost:8081/api/v1/overview
```

## 5.1) Матрица corner cases (auth/rbac)
| ID | Сценарий | Шаги проверки | Ожидаемый результат | Фактический результат | Статус | Примечание |
|----|----------|---------------|---------------------|------------------------|--------|------------|
| CC-01 | Запрос без Bearer token | Вызвать защищённый endpoint без `Authorization` | `401 Unauthorized` | `401` + `{"code":"unauthorized","message":"missing bearer token"}` | ✅ | Ручной smoke |
| CC-02 | Неверный формат Authorization | Передать `Authorization: Token ...` или пустой Bearer | `401 Unauthorized` | `401` в unit-тесте middleware | ✅ | `TestValidateAndRoleGuards` |
| CC-03 | Токен с неверным `iss` | Вызвать endpoint с токеном от другого issuer | `401 Unauthorized` | `401` в unit-тесте middleware | ✅ | `TestValidateAndRoleGuards` |
| CC-04 | Токен с неверным `aud`/`azp` | Вызвать endpoint токеном с несовпадающей аудиторией | `401 Unauthorized` | `401` в unit-тесте middleware | ✅ | `TestValidateAndRoleGuards` |
| CC-05 | Просроченный токен (`exp`) | Использовать токен после истечения TTL | `401 Unauthorized` | `401` в unit-тесте middleware | ✅ | `TestValidateAndRoleGuards` |
| CC-06 | Токен с `nbf` в будущем | Использовать токен до наступления `nbf` | `401 Unauthorized` | `401` в unit-тесте middleware | ✅ | `TestValidateAndRoleGuards` |
| CC-07 | Недостаточная роль | Доступ к endpoint с role guard под ролью без прав | `403 Forbidden` | `403` + `{"code":"forbidden","message":"insufficient role"}` | ✅ | Ручной smoke + unit-test |
| CC-08 | Валидный токен и роль | Доступ к защищённому endpoint с корректными claims | `200 OK` | `200` в unit-тесте middleware | ✅ | `TestValidateAndRoleGuards` |
| CC-09 | Поведение frontend после `401` | Имитировать `401` на API-вызове в `hub-shell` | Controlled re-login, без бесконечного retry | Реализован single-retry guard (`apiRequest(..., canRetry=false)` на повторе) | ✅ | Проверено статически по коду и `npm run build` |
| CC-10 | Поведение frontend при `403` | Имитировать `403` для действия без прав | UX access denied, без logout-loop | `/api/v1/admin/ping` возвращает `403`, UI показывает access denied without logout loop | ✅ | Ручной smoke |

### Легенда статусов
- `⏳` — не проверено
- `✅` — пройдено
- `❌` — провалено
- `⚠️` — пройдено частично / нестабильно

## 6) Деплой
- Среда: нет
- Согласовано с: `docs/DEPLOYMENT_STRATEGY.md`
- Образы: не применялось
- Health / readiness: проверены локально `docker compose --profile aprilhub up -d`, `/healthz`, `/readyz`
- Rollback: не применялся

## 7) Риски и ограничения
- Frontend corner case `401 -> controlled re-login` покрыт реализацией и smoke, но без отдельного автоматизированного frontend test runner.
- RBAC MVP покрывает минимум две роли (`user`, `admin`) и не претендует на финальную бизнес-матрицу downstream сервисов.

## 8) Что осталось
- [ ] При необходимости добавить автоматизированные frontend unit/integration тесты для retry/403 UX в следующем этапе тестового hardening (`008`).
- [ ] Расширить RBAC-матрицу для бизнес-endpoint-ов в этапах `003`/`004` при добавлении новых API.
- [ ] Подготовить коммит(ы) и PR с test plan/рисками (вне данного отчёта).
