# ОТЧЁТ — 057-security-csp-headers

**Статус:** ✅ Выполнено
**Дата завершения:** 13.05.2026

## Что реализовано

### 1. Nginx security headers

Обновлён `infra/nginx/aprilhub.conf`:
- **Глобальные хедеры** (server block):
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (HSTS)
  - `X-Content-Type-Options: nosniff` (MIME sniffing protection)
  - `X-XSS-Protection: 0` (disabled, OWASP рекомендует CSP вместо)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: geolocation=(), microphone=(), camera=()`

- **По зонам:**
  - `/auth`: `X-Frame-Options: DENY`
  - `/api/`: `X-Frame-Options: DENY`, `Content-Security-Policy: default-src 'none'`
  - `/` (Hub Shell): CSP с whitelist self + Keycloak + Sentry, `report-uri /api/v1/csp-report`

### 2. CSP violation report endpoint

Создан `hub-bff/internal/http/csp_report.go`:
- POST `/api/v1/csp-report` — без auth (браузеры шлют violation reports unauthenticated)
- Принимает CSP violation report (W3C report format)
- Логирует в slog с correlationId/requestId
- Возвращает 202 Accepted

### 3. Prometheus метрики CSP violations

Обновлён `hub-bff/internal/observability/metrics.go`:
- Добавлена метрика `hub_bff_csp_violations_total{uri, disposition}`
- Метод `ObserveCSPViolation(uri, disposition string)` в Recorder interface

### 4. Тесты

**Файл:** `hub-bff/internal/http/csp_report_test.go`
- `TestCSReport_POST_accepted` — valid CSP report → 202
- `TestCSReport_GET_not_allowed` — GET → 405
- `TestCSReport_invalid_body_bad_request` — invalid JSON → 400
- `TestCSReport_empty_body_bad_request` — empty body → 400

## Изменённые файлы

| Файл | Действие |
|---|---|
| `infra/nginx/aprilhub.conf` | Обновлён (security headers + CSP) |
| `hub-bff/internal/http/csp_report.go` | Новый |
| `hub-bff/internal/http/csp_report_test.go` | Новый |
| `hub-bff/internal/observability/metrics.go` | Добавлена CSP violation метрика |
| `hub-bff/cmd/hub-bff/main.go` | Добавлен CSP report endpoint |

## Результаты проверки

```bash
cd hub-bff && go build ./...  # ✅ Компилируется
cd hub-bff && go test ./...   # ✅ Все тесты проходят
```

## Дальнейшее

- В production режиме CSP report-uri нужно обновить на финальный домен
- Мониторить CSP violations в Grafana дашборде после деплоя
