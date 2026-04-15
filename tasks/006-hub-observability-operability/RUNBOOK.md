# Runbook: Hub BFF Observability Baseline (Этап 006)

## 1) Частые `401/403` в Hub BFF

### Что проверить
- `hub_bff_auth_errors_total{path,reason,status}`: рост по `invalid token` или `insufficient role`.
- Логи `event=auth_error` в `hub-bff`:
  - `correlationId`, `requestId`, `path`, `method`, `status`, `reason`.
- Конфигурацию в `hub-bff`:
  - `KEYCLOAK_ISSUER`
  - `KEYCLOAK_AUDIENCE`
  - `KEYCLOAK_JWKS_URL`

### Диагностика
1. Сверить `iss` и `aud|azp` в JWT с настройками `hub-bff`.
2. Проверить доступность JWKS endpoint Keycloak.
3. Проверить роли в `realm_access.roles` для пользователя и guard на endpoint.

### Действия
- При `invalid token`/`invalid audience`: выровнять Keycloak client/realm config и env `hub-bff`.
- При `insufficient role`: скорректировать роль в Keycloak или проверить матрицу доступа endpoint.

## 2) Диагностика degraded mode по downstream

### Что проверить
- `hub_bff_degraded_events_total{service,reason}`.
- `hub_bff_downstream_requests_total{service,path,result,attempt}`:
  - всплеск `result=timeout|transport_error|http_error|parse_error`.
- Логи:
  - `event=downstream_call`
  - `event=degraded_mode`

### Диагностика
1. Найти проблемный `service/path` по метрикам.
2. По `correlationId` связать событие в `hub-bff` с downstream-логами.
3. Проверить timeouts/retries (`HUB_BFF_DOWNSTREAM_TIMEOUT`, `HUB_BFF_DOWNSTREAM_RETRIES`).

### Действия
- Если систематический timeout: увеличить budget точечно или стабилизировать downstream.
- Если `parse_error`: проверить совместимость JSON payload/контракта.
- Если `http_error`: локализовать код/причину в downstream и устранить первопричину.

## 3) Рост latency/error-rate

### Что проверить
- `hub_bff_http_request_duration_seconds{method,path,status}` (p95/p99).
- `hub_bff_http_requests_total{method,path,status}`.
- `hub_bff_downstream_timeout_budget_exceeded_total{service,path}`.

### Диагностика
1. Выделить endpoint с ростом latency/error.
2. Проверить распределение downstream results по этому endpoint.
3. Сверить наличие ретраев и timeout budget exceeded.

### Действия
- Временно снизить fan-out pressure (если возможно) и стабилизировать самый деградирующий downstream.
- Пересмотреть timeout/retry настройки для конкретного источника.
- Зафиксировать follow-up в этапы `008/009/010` (нагрузочные baseline, alerting, deploy hardening).
