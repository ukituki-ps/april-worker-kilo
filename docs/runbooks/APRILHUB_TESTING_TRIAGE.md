# AprilHub Testing Triage Runbook (P0)

Runbook для обязательных testing jobs этапа `019`: `aprilhub-smoke` и `aprilhub-k6-baseline`.

## 1. Когда использовать

- CI job `aprilhub-smoke` завершился `failed`/`cancelled`.
- CI job `aprilhub-k6-baseline` завершился `failed`/`cancelled`.
- Локальный pre-merge прогон `./scripts/smoke-aprilhub.sh` или `./scripts/run-k6-aprilhub.sh` нестабилен/флаки.

## 2. Быстрый алгоритм triage

1. Определить failing job и шаг (startup, auth, assertions, thresholds).
2. Скачать артефакты:
   - smoke: `aprilhub-smoke-artifacts` -> `smoke.log`
   - k6: `aprilhub-k6-artifacts` -> `k6.log`, `summary.json`
3. Классифицировать причину: environment, инфраструктура, контракт, функциональная регрессия.
4. Запустить локально тот же скрипт для воспроизведения.
5. Внести фикс или rerun только при подтверждённом flaky-инциденте.
6. Зафиксировать первопричину и действие в отчёте задачи/PR.

## 3. Smoke: типовые причины и действия

### Симптом: timeout на `/healthz` или OIDC discovery

- Проверить логи шагов запуска compose в `smoke.log`.
- Убедиться, что поднялись `keycloak-db`, `keycloak`, `hub-bff`, `hub-shell`, `nginx-docs`.
- Проверить readiness endpoint-ы вручную:
  - `curl -fsS http://localhost:${DOCS_HTTP_PORT:-8080}/healthz`
  - `curl -fsS http://localhost:${DOCS_HTTP_PORT:-8080}/auth/realms/april/.well-known/openid-configuration`
- Если сервис не стартует: смотреть `docker compose logs <service>` и исправлять root cause, а не увеличивать таймауты без анализа.

### Симптом: падение на Keycloak login page checks

- Проверить, что realm `april` и клиент `aprilhub-shell` корректно загружены.
- Проверить, что тема логина содержит ожидаемые CSS/ru-строки (скрипт проверяет это явно).
- Если ломается после изменений UI/темы, обновить ассерт и согласовать с дизайн-требованиями.

### Симптом: 401/403 mismatch на API checks

- 401 на защищённом endpoint с токеном: проверить выдачу токена и issuer/audience claims.
- 403 на `/api/v1/admin/ping` должен оставаться ожидаемым для `april-dev` (это контроль RBAC).
- Проверить изменения middleware auth/RBAC в `hub-bff`.

## 4. k6: типовые причины и действия

### Симптом: `token is empty` или warm-up fail

- Проверить доступность Keycloak token endpoint внутри docker network.
- Проверить валидность тестовых учётных данных (`april-dev` / `april-dev-pass`) в dev realm.
- Проверить, что `hub-bff` отвечает `200` на `/api/v1/me` с токеном.

### Симптом: threshold violation

- Открыть `summary.json` и определить конкретный threshold/метрику.
- Если нарушен `http_req_failed`, сначала диагностировать функциональные ошибки endpoint-ов.
- Если нарушены latency thresholds:
  - исключить инфраструктурный шум (cold start, host contention),
  - проверить недавние изменения в `hub-bff`/ингрессе/Keycloak path,
  - сравнить с последним зелёным baseline.
- Нельзя "лечить" падение только ослаблением thresholds без согласованного решения команды.

## 5. Критерий rerun без фикса

Допускается единичный rerun без кода только если выполнены оба условия:

1. Явный признак flaky-инцидента инфраструктуры (например transient Docker/network issue).
2. Предыдущий и следующий прогон на том же commit зелёные.

Если повторно падает тот же шаг — обязательна диагностика и фикс.

## 6. Что прикладывать в REPORT/PR

- failing job + step;
- выдержки из `smoke.log` / `k6.log` / `summary.json`;
- установленная первопричина;
- сделанный фикс или обоснование rerun;
- результат повторного прогона.
