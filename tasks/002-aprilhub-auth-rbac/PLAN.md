# План: AprilHub Auth + RBAC (Sprint 1)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-14
- **Статус плана:** согласован

## Исходные допущения
- Этап `001` завершён: есть рабочие модули `hub-bff` и `hub-shell`, compose profile `aprilhub`, dev Keycloak realm/client/user bootstrap.
- Текущий JWT middleware в `hub-bff` уже умеет базовую валидацию через JWKS и требует доведения до полного контракта auth.
- Источник IAM и ролей — только Keycloak; локальная legacy-схема auth в backend запрещена.
- OpenAPI-файл `openapi/aprilhub-bff.yaml` существует и расширяется в рамках этого этапа.
- Работа ведётся в ветке `feature/aprilhub-implementation` в рамках roadmap `001-010`.

## Порядок работ (шаги)
1. **Уточнить auth-контракт и роли MVP**
   Синхронизировать набор ролей/claims и целевой endpoint профиля с `docs/auth-jwt-keycloak-adapted.md` и постановкой `002`.
2. **Доработать backend auth middleware**
   Закрыть обязательные проверки JWT (`iss`, `aud|azp`, `exp`, `nbf`), унифицировать ответы `401/403`, подготовить role guard middleware.
3. **Добавить endpoint текущего пользователя**
   Реализовать `GET /api/v1/me` (или согласованный эквивалент) с нормализованным профилем и ролями из токена.
4. **Подключить role guards к защищённым endpoint-ам**
   Применить guards минимум для двух ролей на API-уровне, проверить негативные сценарии доступа.
5. **Реализовать OIDC flow в Hub Shell**
   Подключить login/logout, инициализацию auth-state и передачу Bearer token в API-клиент.
6. **Реализовать UX-поведение для 401/403**
   Добавить controlled re-login без бесконечных retry, обработку access denied и очистку session state.
7. **Обновить OpenAPI и документацию**
   Отразить security-схему, `/me`, 401/403 и примеры ответов в `openapi/aprilhub-bff.yaml`; актуализировать quickstart/auth smoke.
8. **Полноценное тестирование и corner cases**
   Добавить/обновить unit + integration + smoke-наборы для auth/RBAC и покрыть негативные/пограничные сценарии токенов, ролей и frontend retry-логики.
9. **Фиксация результата**
   Оформить `REPORT.md` с ограничениями MVP, матрицей corner cases и follow-up для этапов `003/004`.

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | JWT middleware, role guards, endpoint `/api/v1/me`, формат auth-ошибок |
| Frontend | OIDC login/logout flow, auth state, API-клиент с Bearer и 401/403 strategy |
| БД / Atlas | Не требуется (без схемных изменений) |
| Инфра / Compose | Возможна минимальная корректировка env для auth-flow; профиль `aprilhub` сохраняется |
| IAM / Keycloak | Уточнение realm/client/claims mapping для ролей MVP (без production-hardening) |
| Документация / OpenAPI | Расширение `openapi/aprilhub-bff.yaml`, обновление quickstart/auth smoke |
| Тестирование | Unit/integration/smoke сценарии auth/RBAC + матрица corner cases |
| CI/CD | Расширение проверок для новых auth unit/integration/smoke тестов |

## Риски и откат
- **Риск:** рассинхрон frontend и backend по обработке `401`/`403`.  
  **Митигация:** единый контракт ошибок в OpenAPI и согласованный smoke-сценарий.
- **Риск:** неверная интерпретация audience/azp claims из Keycloak.  
  **Митигация:** явные тесты с валидным/невалидным токеном и проверка against discovery/JWKS.
- **Риск:** случайное добавление legacy endpoint-ов `/auth/login` или `/auth/refresh`.  
  **Митигация:** запрет в acceptance и code review gate.
- **Риск:** деградация UX из-за циклических retry при истёкшем токене.  
  **Митигация:** single-retry guard и принудительный controlled re-login.
- **Откат:** изменения локализованы в `hub-bff`/`hub-shell` и OpenAPI; при проблемах вернуть предыдущую рабочую точку и оставить auth-path на уровне этапа `001`.

## Проверка после выполнения
- Backend:
  - `cd hub-bff && go test ./...`
- Frontend:
  - `cd hub-shell && npm run lint && npm run build`
  - `cd hub-shell && npm run test` (если добавлен тестовый раннер)
- Контракты и runtime:
  - `make openapi-lint`
  - `docker compose --profile aprilhub config`
  - `docker compose --profile aprilhub up -d`
- Smoke auth:
  - login в Keycloak dev-user
  - получить access token
  - `GET /api/v1/me` с валидным токеном → `200`
  - защищённый endpoint с невалидным/просроченным токеном → `401`
  - endpoint с недостаточной ролью → `403`
- Corner cases:
  - запрос без Bearer token → `401`
  - token с неверным `iss` → `401`
  - token с неверным `aud|azp` → `401`
  - token с `nbf` в будущем → `401`
  - token после `exp` → `401`
  - frontend после `401` выполняет controlled re-login и не уходит в бесконечный retry

## Примечания
- При изменении scope этапа `002` обновлять одновременно `TASK.md` и этот `PLAN.md`.
- Если в ходе реализации появится архитектурная развилка по auth/RBAC, зафиксировать предложение для ADR.
- Обновления плана: 2026-04-14 — шаги выполнены, результаты зафиксированы в `REPORT.md`.
