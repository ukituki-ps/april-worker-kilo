## 1) Итого
- Статус: ✅ выполнено
- Задача: Исполнение внешней задачи 021 (AprilHub BFF proxy admin routes + OIDC)
- Ветка: `feature/task-023-external-021-profile-proxy` -> `develop`
- Коммиты: `84034cb` (feature), `892f464` (merge commit в `develop`)
- PR: https://github.com/ukituki-ps/april-worker-kilo

## 2) Что сделано
- [backend] Добавлен admin proxy маршрут `GET/POST/PUT/PATCH/DELETE /api/v1/admin/profile/*` в `hub-bff` через reverse proxy до upstream AprilProfile.
- [backend] Маршрут подключён под существующим Keycloak RBAC guard (`admin`), без изменения модели IAM и без добавления второго OIDC-клиента.
- [backend] Добавлена env-конфигурация `APRIL_PROFILE_ADMIN_URL` (fallback на `APRIL_PROFIL_URL`) и fallback-ответ `503`, если upstream не задан.
- [backend/tests] Добавлены unit-тесты на path rewrite и проброс `Authorization`, `X-Correlation-Id`, `X-Request-Id`, `X-Tenant-Id`.
- [docs/openapi] Обновлены `openapi/aprilhub-bff.yaml`, `.env.example`, `docs-site/docs/getting-started.md`, добавлены task-story документы для задачи 021.

## 3) Изменённые файлы
- `hub-bff/internal/config/config.go`
- `hub-bff/cmd/hub-bff/main.go`
- `hub-bff/internal/http/profile_proxy.go`
- `hub-bff/internal/http/profile_proxy_test.go`
- `.env.example`
- `openapi/aprilhub-bff.yaml`
- `docs-site/docs/getting-started.md`
- `docs-site/docs/task-story-021-phase-4-aprilhub-bff-proxy-admin-routes-oidc.md`
- `docs-site/docs/task-stories-overview.md`
- `tasks/023-aprilhub-execute-external-task-021-april-profile-1/PLAN.md`
- `tasks/023-aprilhub-execute-external-task-021-april-profile-1/REPORT.md`

## 4) Миграции и данные
- Миграции Atlas: нет
- Какие таблицы/индексы изменены: не применимо
- Обратимость: да; откат через удаление proxy-маршрута и env-конфигурации

## 5) Проверка качества
- Линтер: ok
- Сборка: ok (компиляция в составе `go test`)
- Unit tests: ok
- Integration tests: ok (в составе `cd hub-bff && go test ./...`)
- E2E / smoke: локально не запускались; CI smoke job (`AprilHub runtime smoke`) выполнен успешно после `rerun failed jobs`
- CI:
  - `bootstrap-ci` (run `24835157863`) — success
  - `CI` (run `24835157865`) — success
  - `Deploy to dev` (run `24835157885`) — success

Команды (фактически выполненные):
```bash
gofmt -w hub-bff/internal/http/profile_proxy.go hub-bff/internal/http/profile_proxy_test.go
cd hub-bff && go test ./...
make openapi-lint
```

## 6) Деплой
- Среда: dev (`dev.april.ukituki.tech`, `dev.profile.april.ukituki.tech`)
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)
- Образы: применены через workflow `Deploy to dev` (SHA `892f464`)
- Health / readiness:
  - `https://dev.profile.april.ukituki.tech/healthz` -> `{"status":"ok"}`
  - `https://dev.profile.april.ukituki.tech/readyz` -> `{"database":"ok","redis":"ok","status":"ready"}`
  - `https://dev.april.ukituki.tech/healthz` -> `{"status":"ok"}`
  - `https://dev.april.ukituki.tech/readyz` -> `{"status":"ready", ...}`
- Rollback: нет

## 7) Риски и ограничения
- Для рабочего вызова требуется корректный `APRIL_PROFILE_ADMIN_URL` и доступность upstream Profile из сети Hub.
- В рамках задачи не выполнялась end-to-end проверка against реальный dev Profile стенд (только unit/openapi контур).

## 8) Что осталось
- [x] Создать commit(s) и PR в `april-worker` при подтверждении владельцем.
- [x] Выполнить smoke/deploy проверки на dev-стенде и зафиксировать результат.
- [x] Отчёт продублирован во внешнем репозитории: `april-profile-1/tasks/021-phase-4-aprilhub-bff-proxy-admin-routes-oidc/REPORT.md`.
