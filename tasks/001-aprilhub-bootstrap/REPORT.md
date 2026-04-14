## 1) Итого
- Статус: ✅ выполнено
- Задача: AprilHub Bootstrap (Sprint 0)
- Ветка: `feature/aprilhub-implementation`
- Коммиты: `не создавались`
- PR: не создавался

## 2) Что сделано
- [backend] Добавлен модуль `hub-bff` (Go) с endpoint-ами `/healthz`, `/readyz`, `/api/v1/overview` и JWT middleware через JWKS (`iss` + `aud|azp`).
- [frontend] Добавлен модуль `hub-shell` (React + TypeScript + Vite) с базовым bootstrap UI и env-конфигурацией Keycloak/API.
- [infra / compose / nginx] В `docker-compose.yml` добавлен профиль `aprilhub` с сервисами `hub-bff`, `hub-shell`, `keycloak`, `keycloak-db`; добавлен realm bootstrap в `infra/keycloak/realm/april-realm.json`.
- [docs] Добавлен `openapi/aprilhub-bff.yaml`, обновлены `Makefile` (openapi lint), `.env.example`, quickstart в `docs-site/docs/getting-started.md`.
- [ci] Обновлены `.github/workflows/ci.yml` и `.github/workflows/bootstrap-ci.yml` с проверками для `hub-bff` и `hub-shell`.
- [tasks] Обновлены статусы в `task_list.md` и acceptance-чеклист в `tasks/001-aprilhub-bootstrap/TASK.md`.

## 3) Изменённые файлы
- `.env.example`
- `.github/workflows/bootstrap-ci.yml`
- `.github/workflows/ci.yml`
- `Makefile`
- `docker-compose.yml`
- `docs-site/docs/getting-started.md`
- `hub-bff/go.mod`
- `hub-bff/go.sum`
- `hub-bff/cmd/hub-bff/main.go`
- `hub-bff/internal/auth/middleware.go`
- `hub-bff/internal/config/config.go`
- `hub-bff/internal/http/handlers.go`
- `hub-shell/index.html`
- `hub-shell/package.json`
- `hub-shell/package-lock.json`
- `hub-shell/tsconfig.json`
- `hub-shell/vite.config.ts`
- `hub-shell/src/App.tsx`
- `hub-shell/src/auth.ts`
- `hub-shell/src/main.tsx`
- `hub-shell/src/vite-env.d.ts`
- `infra/keycloak/realm/april-realm.json`
- `openapi/aprilhub-bff.yaml`
- `task_list.md`
- `tasks/001-aprilhub-bootstrap/TASK.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применялось
- Обратимость: да (изменения инфраструктурно-кодовые; откат — удалить/отключить профиль `aprilhub`)

## 5) Проверка качества
- Линтер: ok
- Сборка: ok
- Unit tests: ok
- Integration tests: fail (не запускались в рамках Sprint 0)
- E2E / smoke: ok

Команды (фактически выполненные):
```bash
make openapi-lint
docker compose config
docker compose --profile aprilhub config
cd hub-bff && go mod tidy && go test ./...
cd hub-shell && npm install
cd hub-shell && npm run lint && npm run build
docker compose --profile aprilhub up -d
curl http://localhost:8081/healthz
curl http://localhost:8081/readyz
curl -X POST http://localhost:8082/realms/april/protocol/openid-connect/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'client_id=aprilhub-shell' -d 'grant_type=password' \
  -d 'username=april-dev' -d 'password=april-dev-pass'
curl -H "Authorization: Bearer <access_token>" http://localhost:8081/api/v1/overview
docker compose --profile aprilhub down
```

## 6) Деплой
- Среда: нет
- Согласовано с: `docs/DEPLOYMENT_STRATEGY.md`
- Образы: не применялось
- Health / readiness: локально проверены `/healthz` и `/readyz` на `hub-bff` (`localhost:8081`)
- Rollback: нет

## 7) Риски и ограничения
- `hub-shell` содержит только bootstrap UI и env wiring, без полноценного OIDC adapter lifecycle в React.
- `hub-bff` реализует MVP-агрегацию stub-данных; интеграции с downstream сервисами пока не добавлены.
- Compose профиль использует dev-only значения (`admin/admin`, test user), что допустимо только для локального dev.

## 8) Что осталось
- [ ] Расширить `hub-shell` до полноценного OIDC login/logout/updateToken flow с обработкой `401`.
- [ ] Реализовать production-подход к запуску `hub-bff`/`hub-shell` (Dockerfile + immutable образы по SHA).
- [ ] Добавить unit/integration тесты по auth middleware и handler-ам `hub-bff`.
- [ ] Уточнить/доработать агрегированный endpoint и контракты под Sprint 1.
# Отчёт: AprilHub Bootstrap (Sprint 0)

## Статус
- [ ] Не начато
- [ ] В работе
- [ ] Завершено

## Что сделано
- TBD

## Проверки
- TBD

## Риски / ограничения
- TBD

## Follow-up (Sprint 1)
- TBD
