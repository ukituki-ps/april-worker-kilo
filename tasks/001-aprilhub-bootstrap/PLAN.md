# План: AprilHub Bootstrap (Sprint 0)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-14
- **Статус плана:** согласован как стартовый baseline

## Исходные допущения
- Архитектурная модель `AprilHub` уже зафиксирована в `docs/architecture/APRILHUB_C3_C4.md` и `structurizr/workspace.dsl`.
- Контракты интеграции находятся в состоянии draft и требуют MVP-уточнения для Hub BFF.
- Репозиторий содержит documentation bootstrap, но не содержит runtime кода приложения.
- JWT/Auth реализация обязана соответствовать `docs/auth-jwt-keycloak-adapted.md` (OIDC+PKCE, JWKS validation, Keycloak-managed refresh).
- Работы Sprint 0 выполняются в ветке `feature/aprilhub-implementation` в рамках общей стратегии roadmap AprilHub.

## Стратегия ветвления для Sprint 0
- Базовая рабочая ветка: `feature/aprilhub-implementation`.
- Изменения по `001-aprilhub-bootstrap` вносятся напрямую в эту ветку или через короткоживущие ветки с merge обратно в неё.
- Merge в `develop` выполняется по согласованному потоку roadmap (`feature/aprilhub-implementation` -> `develop`).
- Dev-деплой остаётся привязан к merge в `develop` по `docs/DEPLOYMENT_STRATEGY.md`.

## Порядок работ (шаги)
1. **Завести каркас backend/frontend модулей**  
   Создать минимальные структуры `hub-bff` и `hub-shell`, конфиги сборки и базовые точки входа.
2. **Развернуть и инициализировать Keycloak в dev**  
   Добавить сервис `Keycloak` в compose profile `aprilhub`, подготовить bootstrap realm/client/user для локального потока OIDC.
3. **Подготовить API baseline для Hub BFF**  
   Добавить `openapi/aprilhub-bff.yaml`, endpoint-ы `/healthz`, `/readyz` и один агрегированный MVP endpoint.
   Явно зафиксировать security-схему в OpenAPI согласно `docs/auth-jwt-keycloak-adapted.md`.
4. **Встроить dev-runtime в compose**  
   Добавить profile и сервисы для запуска `hub-bff`/`hub-shell` локально с env-конфигурацией.
5. **Подключить CI проверки**  
   Добавить lint/build/test для новых модулей в GitHub Actions без поломки текущих doc-пайплайнов.
6. **Обновить документацию запуска**  
   Добавить quickstart/раздел по запуску AprilHub и базовой проверке readiness.
7. **Зафиксировать ограничения и следующий шаг**  
   Заполнить `REPORT.md` по итогам Sprint 0 и сформировать задачи Sprint 1 (бизнес-сценарии).

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | Новый модуль `hub-bff`, HTTP entrypoint, health/readiness |
| Frontend | Новый модуль `hub-shell` (React/Vite baseline) |
| БД / Atlas | Не требуется в Sprint 0 (при необходимости уточнить в Sprint 1) |
| Инфра / Compose | Новый compose profile/сервисы для runtime AprilHub, включая Keycloak |
| IAM / Keycloak | Realm/client bootstrap и dev-конфигурация OIDC/JWKS для Hub |
| Документация / OpenAPI | Новый OpenAPI для Hub BFF + обновление quickstart |
| CI/CD | Lint/build/test шаги для `hub-bff` и `hub-shell` |

## Риски и откат
- **Риск:** размытый scope MVP приведёт к затяжке bootstrap.  
  **Митигация:** фиксировать только инфраструктурный baseline и 1 агрегированный endpoint.
- **Риск:** несовместимость нового compose profile с текущим docs-режимом.  
  **Митигация:** разделить профили и не менять дефолтный docs-only запуск.
- **Риск:** нестабильный локальный auth-path из-за неполной конфигурации Keycloak (realm/client/redirect).  
  **Митигация:** зафиксировать dev bootstrap-конфиг и smoke-сценарий login в документации.
- **Риск:** неполная конкретизация интеграционных контрактов.  
  **Митигация:** зафиксировать временные значения timeout/degradation в OpenAPI/доках как MVP.
- **Риск:** случайный возврат к legacy auth-схеме (`/auth/login`, `/auth/refresh`) в backend.  
  **Митигация:** архитектурный запрет в code review и проверка соответствия `docs/auth-jwt-keycloak-adapted.md` по acceptance.
- **Откат:** изменения изолированы по новым директориям/профилям; при проблемах отключить профиль `aprilhub` и вернуть docs-only сценарий.

## Проверка после выполнения
- `make openapi-lint`
- `docker compose config`
- backend: `go test ./...` (в модуле `hub-bff`)
- frontend: `npm run lint && npm run build` (в модуле `hub-shell`)
- Smoke: успешный ответ `/healthz` и `/readyz` локально
- Smoke auth: Keycloak доступен, OIDC login успешен, Bearer token валидируется Hub BFF через JWKS
- Архитектурная сверка: отсутствуют backend endpoints `/auth/login` и `/auth/refresh`; JWT валидация реализована через JWKS.

## Примечания
- Если по ходу реализации меняется scope, обновить `TASK.md` и этот план в тот же день.
- Для архитектурных развилок уровня платформенных решений оформить ADR по правилам команды.
