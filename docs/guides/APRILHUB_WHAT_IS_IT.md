# Что такое AprilHub

`AprilHub` — это точка входа в экосистему April для пользователей и команд разработки.
На уровне продукта AprilHub объединяет гостевой доступ, авторизацию через Keycloak и рабочую (authorized) зону.
На уровне платформы AprilHub связывает UI (`hub-shell`), backend API-агрегацию (`hub-bff`) и инфраструктурные сервисы наблюдаемости, тестирования и деплоя.

## Зачем нужен AprilHub

- Дать единый вход в сервисы April через согласованный UX и IAM-модель.
- Централизовать API-доступ к runtime-интеграциям через `hub-bff`.
- Обеспечить единый operational baseline (deploy, тесты, observability) для развития следующих сервисов.

## Границы системы

- **Внутри AprilHub:** `hub-shell`, `hub-bff`, Keycloak-интеграция, контракты API, обязательный testing gate.
- **Рядом с AprilHub:** PostgreSQL/Redis, observability stack, AprilNflow и другие сервисы April (по интеграционным контрактам).
- **Вне scope текущего репозитория:** разработка чужих сервисов, не связанных с задачами этого репозитория.

Актуальный фиксированный стек и границы — в `docs/AGENT_ARCHITECTURE_CONTEXT.md`.

## High-level flow

1. Пользователь открывает единый ingress (Nginx).
2. `hub-shell` показывает guest/authorized UX и управляет auth переходами.
3. Авторизация/роли обеспечиваются Keycloak (OIDC/JWT + RBAC).
4. `hub-bff` проверяет токен, применяет role gates и агрегирует данные для фронтенда.
5. Observability и quality-gate подтверждают стабильность изменений перед merge/release.

Детали потоков: [`APRILHUB_HOW_IT_WORKS.md`](./APRILHUB_HOW_IT_WORKS.md).
