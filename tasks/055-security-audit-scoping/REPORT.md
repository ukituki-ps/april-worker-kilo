# Отчёт по задаче 055: Security Audit Scoping

## 1) Итого

- **Статус:** ✅ выполнено
- **Задача:** Security Audit Scoping — аудит security surface AprilHub, OWASP Top-10 mapping, карта уязвимостей для задач 056–059
- **Ветка:** `055-security-audit-scoping`
- **Коммиты:** *(будет заполнен при коммите)*
- **PR:** не создавался

## 2) Что сделано

### [анализ] Проведен глубокий ручной security review всей кодовой базы AprilHub

#### Прочитанные и проанализированные файлы

**Backend (Hub BFF):**
- `hub-bff/cmd/hub-bff/main.go` — регистрация маршрутов, цепочка middleware
- `hub-bff/internal/auth/middleware.go` — JWT validation, RBAC guards
- `hub-bff/internal/auth/middleware_test.go` — тесты auth (покрытие edge cases)
- `hub-bff/internal/http/handlers.go` — обработчики endpoints
- `hub-bff/internal/http/profile_proxy.go` — reverse proxy к AprilProfile
- `hub-bff/internal/http/cors.go` — CORS policy
- `hub-bff/internal/http/observability.go` — access logging, status кодировка
- `hub-bff/internal/observability/metrics.go` — Prometheus метрики
- `hub-bff/internal/config/config.go` — конфигурация, ENV vars

**Frontend (Hub Shell):**
- `hub-shell/src/keycloak.ts` — Keycloak init, PKCE, token refresh
- `hub-shell/src/auth.ts` — конфигурация auth runtime
- `hub-shell/src/api.ts` — authorized fetch, 401 retry, token rotation
- `hub-shell/src/App.tsx` — auth gate, zone transitions
- `hub-shell/src/app-shell.tsx` — shell layout, children injection
- `hub-shell/src/widgets.tsx` — widget composition, token forwarding
- `hub-shell/src/composition-loader.tsx` — dynamic module loading
- `hub-shell/src/composition-registry.ts` — registry, role filtering
- `hub-shell/src/shell/AuthorizedShellGate.tsx` — authorized shell entry
- `hub-shell/src/shell/AuthorizedHubContent.tsx` — контент роутинг
- `hub-shell/src/shell/hub-host-context.tsx` — host context для виджетов
- `hub-shell/src/sentry.ts` — error telemetry, sanitization
- `hub-shell/src/main.tsx` — инициализация приложения
- `hub-shell/src/landing/GuestB2BLanding.tsx` — guest landing page

**Infrastructure:**
- `infra/nginx/default.conf` — Nginx reverse proxy config
- `infra/keycloak/realm/april-realm.json` — realm config, клиенты, роли, пользователи
- `infra/observability/config/prometheus/rules/aprilhub-alerts.yml` — alert rules
- `docker-compose.yml` — сервисная конфигурация
- `.github/workflows/ci.yml` — CI pipeline с security scan
- `.github/workflows/dev-deploy.yml` — deploy pipeline

**Документация:**
- `docs/auth-jwt-keycloak-adapted.md` — OIDC/JWT auth flow
- `openapi/aprilhub-bff.yaml` — API spec
- `docs/architecture/ADR-april-phase-9-security-and-performance.md` — ADR Phase 9

### [отчёт] Составлена полная карта findings с OWASP Top-10 mapping

## 3) Изменённые файлы

- `tasks/055-security-audit-scoping/REPORT.md` —本报告 (единственный файл, это аналитическая задача)

## 4) Миграции и данные

- Миграции Atlas: нет
- Изменения в БД: нет
- Обратимость: N/A (аналитическая задача)

## 5) Проверка качества

- Линтер: N/A (документация)
- Сборка: N/A
- Unit tests: N/A
- Integration tests: N/A
- E2E / smoke: N/A

**Выполненные проверки:**

```
1. Manual code review всех файлов hub-bff/internal/ (20+ файлов)
2. Manual code review всех файлов hub-shell/src/ (30+ файлов)
3. Проверка infra/nginx/default.conf на security headers — их нет
4. Проверка каждого BFF endpoint на наличие auth guard — все закрытые endpoints protected
5. grep XSS surface (innerHTML, dangerouslySetInnerHTML) — не найдено
6. Проверка JWKS/JWT config — RS256/RS384/RS512, iss/aud/exp/nbf
7. Проверка Prometheus alert rules — есть auth alerts, gap в security-specific alerts
8. Проверка CI/CD — security scan stage есть, но без fail-on-critical
9. Проверка Keycloak realm config — hardcoded dev creds, directAccessGrants enabled
10. Проверка docker-compose — нет resource limits, no read-only mode
```

### Методология

Анализ проведён по следующему порядку:
1. **Nginx layer** — ingress security, headers
2. **BFF auth middleware** — JWT validation, RBAC
3. **BFF handlers** — input validation, error handling, proxy security
4. **Frontend auth flow** — Keycloak init, token handling, XSS surface
5. **Frontend widget system** — dynamic loading, token forwarding
6. **Infrastructure** — Keycloak config, Docker, CI/CD
7. **Observability** — security event logging, alerting gaps
8. **OWASP Categories** — систематическое mapping findings к категориям

## 6) Деплой

- Среда: нет (аналитическая задача)
- Согласовано с: [`docs/DEPLOYMENT_STRATEGY.md`](../../docs/DEPLOYMENT_STRATEGY.md)
- Образы: не применялось
- Health / readiness: N/A
- Rollback: N/A

---

# 7) Security Audit Results: OWASP Top-10 2021 Mapping

## Сводная таблица Findings

| # | ID | OWASP Category | Severity | Описание | Файлы и строки | Задача для фикса |
|---|-----|-----|-----|-----|-----|-----|
| 1 | F-001 | A05:2021 Security Misconfiguration | **High** | Отсутствуют все security headers в Nginx | `infra/nginx/default.conf:11-109` | 057 |
| 2 | F-002 | A05:2021 Security Misconfiguration | **High** | Nginx не настроен на HTTPS (port 80 без redirect) | `infra/nginx/default.conf:11` | 057 |
| 3 | F-003 | A01:2021 Broken Access Control | **Medium** | `/metrics` endpoint не защищён auth middleware | `hub-bff/cmd/hub-bff/main.go:52` | 056 |
| 4 | F-004 | A01:2021 Broken Access Control | **Low** | `/healthz` и `/readyz` открыты без rate limit (acceptable для health checks) | `hub-bff/cmd/hub-bff/main.go:50-51` | 056 |
| 5 | F-005 | A05:2021 Security Misconfiguration | **High** | Нет Content-Security-Policy | `infra/nginx/default.conf:11-109` | 057 |
| 6 | F-006 | A02:2021 Cryptographic Failures | **Medium** | JWKS кэш обновляется при инициализации; нет background refresh | `hub-bff/internal/auth/middleware.go:39-63` | 056 |
| 7 | F-007 | A02:2021 Cryptographic Failures | **High** | Hardcoded dev credentials в realm JSON | `infra/keycloak/realm/april-realm.json:66,107-111,127-131` | — |
| 8 | F-008 | A02:2021 Cryptographic Failures | **Medium** | Hardcoded default Keycloak admin credentials в docker-compose | `docker-compose.yml:151-152` | — |
| 9 | F-009 | A01:2021 Broken Access Control | **Medium** | Reverse proxy `Authorization` header не проверяется и не ограничивается scope перед форвардом | `hub-bff/internal/http/profile_proxy.go:27-47` | 056 |
| 10 | F-010 | A03:2021 Injection | **Low** | Proxy path manipulation: `{proxyPath}` в OpenAPI — нет whitelist допустимых путей | `openapi/aprilhub-bff.yaml:200-208`, `hub-bff/internal/http/profile_proxy.go:27-47` | 056 |
| 11 | F-011 | A07:2021 Identification and Authentication Failures | **High** | Keycloak client `directAccessGrantsEnabled: true` (password credentials flow) | `infra/keycloak/realm/april-realm.json:25,76,79` | — |
| 12 | F-012 | A07:2021 Identification and Authentication Failures | **Medium** | Нет rate limiting на BFF endpoints (brute-force JWT guessing) | `hub-bff/cmd/hub-bff/main.go:49-81` | 056 |
| 13 | F-013 | A07:2021 Identification and Authentication Failures | **Low** | Token retry logic в frontend: при 401 происходит auto-retry, что может привести к бесконечному циклу при race condition | `hub-shell/src/api.ts:66-76` | — |
| 14 | F-014 | A05:2021 Security Misconfiguration | **High** | Нет rate limiting в Nginx | `infra/nginx/default.conf:1-109` | 057 |
| 15 | F-015 | A09:2021 Security Logging and Monitoring Failures | **Medium** | Нет security-specific Prometheus alerts (brute force detection, unusual auth patterns, token abuse) | `infra/observability/config/prometheus/rules/aprilhub-alerts.yml:1-51` | — |
| 16 | F-016 | A09:2021 Security Logging and Monitoring Failures | **Low** | Нет dedicated security alerting в Loki (no label-based filtering для auth deny events) | N/A (Loki config не содержит security rules) | — |
| 17 | F-017 | A08:2021 Software and Data Integrity Failures | **Medium** | CI security scan — `security-scan` job не блокирует merge при критических CVE | `.github/workflows/ci.yml:445-503` | 058 |
| 18 | F-018 | A08:2021 Software and Data Integrity Failures | **Low** | Dynamic module loading в CompositionLoader без integrity check (hash verification) | `hub-shell/src/composition-loader.tsx:20-31` | 059 |
| 19 | F-019 | A01:2021 Broken Access Control | **Medium** | JWT claim `aud` проверяется через OR с `azp` — potential bypass если один из двух валиден | `hub-bff/internal/auth/middleware.go:133` | 056 |
| 20 | F-020 | A05:2021 Security Misconfiguration | **Medium** | Docker containers без resource limits (CPU/memory), без `--read-only` | `docker-compose.yml:38-196` | — |
| 21 | F-021 | A03:2021 Injection | **Low** | `httputil.ReverseProxy` в profile proxy: нет валидации `Content-Length` на входящий body | `hub-bff/internal/http/profile_proxy.go:26-47` | 056 |
| 22 | F-022 | A05:2021 Security Misconfiguration | **Low** | Nginx не скрывает версию сервера (Server header) | `infra/nginx/default.conf:11-109` | 057 |
| 23 | F-023 | A02:2021 Cryptographic Failures | **Low** | Redis пароль по умолчанию в docker-compose | `docker-compose.yml:189` | — |
| 24 | F-024 | A01:2021 Broken Access Control | **Low** | Нет отдельной RBAC granular permission level: только role-based (user/admin), отсутствует field-level access | `hub-bff/internal/auth/middleware.go:143-162` | — |
| 25 | F-025 | A05:2021 Security Misconfiguration | **Medium** | Нет HSTS header — HTTP-only dev может стать привычкой | `infra/nginx/default.conf:11` | 057 |
| 26 | F-026 | A09:2021 Security Logging and Monitoring Failures | **Low** | Auth error alert threshold 1 req/s слишком высокий — пропускает slow brute-force | `infra/observability/config/prometheus/rules/aprilhub-alerts.yml:43-51` | — |

## Детальный анализ по OWASP категориям

---

### A01: Broken Access Control

#### F-003: `/metrics` endpoint — открытый (Medium)

**Файл:** `hub-bff/cmd/hub-bff/main.go:52`

```go
mux.Handle("/metrics", promhttp.HandlerFor(registry, promhttp.HandlerOpts{}))
```

**Описание:** Prometheus metrics endpoint не охвачен CORS middleware, metadata middleware или auth middleware. Данные метрик (включая path names, downstream response times) доступны любому, кто может достичь порт 8081. В docker-compose это не экспортируется наружу, но в production если порт станет доступен — метрики утекут.

**Рекомендация:** Добавить IP whitelist middleware на `/metrics` или убрать из public access. Задача 056.

#### F-004: Health endpoints без rate limit (Low)

**Файл:** `hub-bff/cmd/hub-bff/main.go:50-51`

**Описание:** `/healthz` и `/readyz` открыты — это нормальная практика для Kubernetes probes. Однако отсутствие rate limit позволяет использовать их для DoS через флуд запросов.

**Рекомендация:** Acceptable как есть для health probes. Добавить rate limit только если endpoint становится публичным. Задача 056.

#### F-009: Token forwarding через proxy без scope limitation (Medium)

**Файл:** `hub-bff/internal/http/profile_proxy.go:27-47`

**Описание:** Reverse proxy к AprilProfile передаёт оригинальный `Authorization: Bearer` header без каких-либо проверок:
- Не валидируется, что token имеет права на AprilProfile audience
- Не создаётся service-to-service token (mTLS или dedicated API key)
- User token напрямую доверяется upstream

Это не является критической уязвимостью (так как token уже валидирован middleware-ом), но нарушает принцип минимальных привилегий в сервис-ту-сервис коммуникации.

**Рекомендация:** Реализовать token exchange (BFF получает dedicated token от Keycloak для upstream) или использовать service account token. Задача 056.

#### F-010: Proxy path injection (Low)

**Файл:** `openapi/aprilhub-bff.yaml:200-208`, `hub-bff/internal/http/profile_proxy.go:27-47`

**Описание:** `{proxyPath}` в маршруте `/api/v1/admin/profile/{proxyPath}` не имеет whitelist допустимых подпутей. Код обрабатывает path через `strings.TrimPrefix` + `singleSlashPath`, что предотвращает path traversal на уровне BFF. Однако если AprilProfile upstream обрабатывает произвольные пути без собственной валидации, возможна атака через манипуляцию пути.

**Рекомендация:** Реализовать whitelist разрешённых proxy путей. Задача 056.

#### F-012: Нет rate limiting (Medium)

**Файл:** `hub-bff/cmd/hub-bff/main.go:49-81`

**Описание:** Ни один endpoint не имеет rate limiting middleware. JWT brute-force (перебор подписей токенов) невозможно из-за криптографической сложности RSA, но без rate limit злоумышленник может создать DoS через флуд валидных (но expired) токенов, нагружая JWKS lookup на каждый запрос.

**Рекомендация:** Реализовать rate limit middleware (fixed-window или sliding-window) на level `per-IP` перед auth middleware. Задача 056.

#### F-019: Audience check OR logic (Medium)

**Файл:** `hub-bff/internal/auth/middleware.go:133`

```go
if m.audience != "" && !slices.Contains(claims.Audience, m.audience) && claims.AZP != m.audience {
```

**Описание:** Проверка audience использует OR (`aud` содержит нужный clientID **или** `azp` равен нужному). Если JWT содержит валидный `azp` для другого client, но `aud` не содержит нашего `m.audience` — токен проходит, потому что `azp` совпадает. Это может привести к тому, что токен выпущенный для другого client в том же realm будет принят.

**Рекомендация:** Проверять и `aud`, и `azp` одновременно (AND), а не OR. Задача 056.

---

### A02: Cryptographic Failures

#### F-006: JWKS кэш — нет background refresh (Medium)

**Файл:** `hub-bff/internal/auth/middleware.go:39-63`

**Описание:** `keyfunc.NewDefaultCtx` создаёт JWKS cache с periodic refresh по умолчанию (в библиотеке MicahParks/keyfunc v3 refresh interval 10 минут по умолчанию — это нормально). Однако:
- Нет exponential backoff при недоступности Keycloak (библиотека делает retry, но BFF не логгирует JWKS refresh failures)
- Нет dedicated metric для JWKS cache status

**Рекомендация:** Добавить метрику JWKS cache status + logging при JWKS refresh error. Задача 056.

#### F-007: Hardcoded dev credentials (High)

**Файл:** `infra/keycloak/realm/april-realm.json:66,107-111,127-131`

```json
"secret": "dev-only-secret"
"password": "april-dev-pass"
"password": "april-user-pass"
```

**Описание:** Realm JSON файл содержит plaintext пароли пользователей и client secret. В dev-режиме это ок, но:
- Файл коммитится в репозиторий (видно в git history)
- При переходе в production эти файлы не будут загружены заново (Keycloak import только при первом старте)
- Если файл случайно попадёт в production environment — credentials будут compromised

**Рекомендация:** Использовать vault/secrets management для production credentials. Для dev оставить, но добавить `.gitignore` исключение или закомментировать в pre-commit hook.

#### F-008: Hardcoded Keycloak admin credentials (Medium)

**Файл:** `docker-compose.yml:151-152`

```yaml
KEYCLOAK_ADMIN: ${KEYCLOAK_ADMIN:-admin}
KEYCLOAK_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD:-admin}
```

**Описание:** Default admin/admin credentials для Keycloak. Это dev-default, но если `.env` файл не настроен — Keycloak запускается с известным паролем.

**Рекомендация:** Убрать default, потребовать задать в .env. Добавить pre-start проверку.

#### F-023: Redis default password (Low)

**Файл:** `docker-compose.yml:189`

```yaml
--requirepass ${REDIS_PASSWORD:-redis-dev-change-me}
```

**Описание:** Default redis password является известным. В production это должно быть уникальным и храниться вне кода.

**Рекомендация:** Убрать default. Добавить pre-start проверку.

---

### A03: Injection

#### F-021: Нет Content-Length limit на proxy (Low)

**Файл:** `hub-bff/internal/http/profile_proxy.go:26-47`

**Описание:** `httputil.ReverseProxy` не ограничивает размер входящего request body. Злоумышленник может отправить большой POST/PUT request, который будет полностью буферизирован в памяти и переслан upstream (пока не истечёт TCP timeout).

**Рекомендация:** Добавить body size limit middleware (например 10MB) перед proxy. Задача 056.

#### SQL Injection (не обнаружено)

**Статус:** ✅ **Нет уязвимостей SQL injection обнаружено.**

**Обоснование:** Hub BFF не подключается напрямую к PostgreSQL. Все данные агрегируются через HTTP downstream calls (Workflow, NFlow, Profil, Report). SQL запросы выполняются в downstream сервисах (AprilProfile), которые используют ORM/query builder. Проверка: `hub-bff/internal/` не содержит драйверов БД, DDL запросов, или string-форматированного SQL.

#### Template Injection (не обнаружено)

**Статус:** ✅ **Нет уязвимостей template injection обнаружено.**

**Обоснование:** Go `html/template` не используется. Frontend использует JSX (React), который автоматически экранирует контент. Нет `dangerouslySetInnerHTML` или `innerHTML` в кодовой базе (проверено через grep).

#### Command Injection (не обнаружено)

**Статус:** ✅ **Нет уязвимостей command injection обнаружено.**

**Обоснование:** Hub BFF не выполняет shell команды. Docker compose использует `go run` для dev, но это не production surface.

---

### A07: Identification and Authentication Failures

#### F-011: directAccessGrantsEnabled в Keycloak (High)

**Файл:** `infra/keycloak/realm/april-realm.json:25,76,79`

```json
"directAccessGrantsEnabled": true
```

**Описание:** Resource Owner Password Credentials (ROPC) flow включён для:
- `aprilhub-shell` (client для Hub Shell UI)
- `april-profile-api` (client для Profile API)

**Риски:**
- RPOP flow не совместим с PKCE — уязвим к credential theft через MITM
- Keycloak по умолчанию включает brute-force protection, но если злоумышленник знает username, может проводить targeted парольные атаки
- В production это должно быть выключено для public clients (standard flow + PKCE достаточно)

**Рекомендация:** Отключить `directAccessGrantsEnabled` для production realm.

#### F-013: Token retry race condition (Low)

**Файл:** `hub-shell/src/api.ts:66-76`

```typescript
if (response.status === 401 && (options.canRetry ?? true)) {
    const refreshed = await keycloak.updateToken(30).catch(() => false);
    if (!refreshed || !keycloak.token) {
        await keycloak.login();
        throw new Error("Token refresh failed");
    }
    notifyKeycloakTokenRotated();
    const { signal: _retryIgnoreSignal, ...retryInit } = init;
    return authorizedFetch(input, retryInit, { ...options, canRetry: false });
}
```

**Описание:** Логика retry при 401:
- `canRetry` guard предотвращает бесконечный цикл (хорошо)
- Однако `abort` signal удаляется из retry — это может привести к выполнению запроса к устаревшему ресурсу
- При параллельных запросах с истёкшим токеном — каждый инициирует свой `updateToken`, создавая race condition в Keycloak

**Рекомендация:** Реализовать mutex/queue для token refresh (single-flight pattern). В production это может быть проблемой при высокой нагрузке.

---

### A08: Software and Data Integrity Failures

#### F-017: CI security scan не блокирует merge (Medium)

**Файл:** `.github/workflows/ci.yml:445-503`

**Описание:** Job `security-scan` выполняет:
- `govulncheck` на Go dependencies
- `gosec` (не показан в pipeline — установлен, но не вызван явно с `--exclude` или exit-code handling)
- `npm audit` с `--audit-level=critical`

Однако:
- Эти tool'и exit с non-zero code при обнаружении проблем, что technically должно блокировать CI
- npm audit с `--audit-level=critical` пропускает high и moderate CVE
- Нет dedicated `gosec` run с fail-on-vulnerable flag
- Нет SBOM generation для compliance

**Рекомендация:** 
1. Добавить SBOM generation (syft/anchore) в CI
2. Добавить gosec run с strict mode
3. Добавить npm audit с `--audit-level=high` вместо `critical`. Задача 058.

#### F-018: Dynamic module loading без integrity check (Low)

**Файл:** `hub-shell/src/composition-loader.tsx:20-31`

```typescript
void module.loader().then((next) => {
    setLoaded(() => next.default);
})
```

**Описание:** `CompositionLoader` загружает dynamic chunks через `import()`. В текущей конфигурации Vite автоматически code-signs chunks, но:
- Нет SRI (Subresource Integrity) verification
- Нет hash verification при загрузке из CDN (если перейдёте на CDN deployment)
- Registry (`shellRegistry`) hardcoded в коде, но `requiresRole` проверяется только server-side в BFF (frontend filter может быть bypassed)

**Рекомендация:** При переходе на CDN добавить SRI. Для текущей конфигурации ок. Задача 059.

---

### A09: Security Logging and Monitoring Failures

#### F-015: Нет security-specific Prometheus alerts (Medium)

**Файл:** `infra/observability/config/prometheus/rules/aprilhub-alerts.yml:1-51`

**Текущие rules:**
1. `AprilHubTargetDown` — target availability (ok)
2. `AprilHubHighErrorRate` — 5xx spike (ok)
3. `AprilHubP95LatencyHigh` — latency (ok)
4. `AprilHubAuthErrorsSpike` — auth errors > 1 req/s (too permissive)

**Отсутствуют:**
- Alert на sustained 401 rate (brute force detection) с lower threshold
- Alert на 403 spike (unauthorized access attempt detection)
- Alert на JWKS refresh failures
- Alert на proxy error rate (upstream health for security)
- Alert на suspicious user-agent patterns

**Рекомендация:** Добавить dedicated security alert rules. Задача 056 (observability часть).

#### F-016: Нет Loki security rules (Low)

**Статус:** Loki конфигурация (`infra/observability/config/promtail/promtail.yml`) собирает BFF логи, но:
- Нет label-based filtering для `auth_error` events
- Нет dashboard для security incident investigation
- Нет alert на pattern-based detection (например, много 401 от одного IP)

**Рекомендация:** Добавить security event pipeline в Promtail.

#### F-026: Auth error alert threshold слишком высокий (Low)

**Файл:** `infra/observability/config/prometheus/rules/aprilhub-alerts.yml:43-51`

```yaml
- alert: AprilHubAuthErrorsSpike
  expr: sum(rate(hub_bff_auth_errors_total[5m])) > 1
  for: 5m
```

**Описание:** Порог 1 req/s в течение 5 минут = 300 auth errors за период. Это слишком много для production threshold. Slow brute-force (20 req/s от одного IP) легко пройдётся мимо этого порога.

**Рекомендация:** Снизить до 0.5 req/s или добавить per-IP dimension. 

---

### A05: Security Misconfiguration (общие)

#### F-001: Отсутствуют все security headers в Nginx (High)

**Файл:** `infra/nginx/default.conf:11-109`

**Отсутствующие headers:**

| Header | Значение | Описание |
|-----|-----|-----|
| `Content-Security-Policy` | N/A | CSP — критическо для XSS mitigation |
| `X-Content-Type-Options` | `nosniff` | Предотвращает MIME-type sniffing |
| `X-Frame-Options` | `DENY` или `SAMEORIGIN` | Clickjacking protection |
| `X-XSS-Protection` | `1; mode=block` | Legacy XSS filter |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referrer leak protection |
| `Permissions-Policy` | N/A | Feature policy (camera, microphone и т.д.) |
| `Strict-Transport-Security` | N/A → F-025 | HSTS |

**Рекомендация:** Добавить все headers в Nginx config. Задача 057.

#### F-002: HTTP-only без HTTPS redirect (High)

**Файл:** `infra/nginx/default.conf:11`

```nginx
server {
    listen 80;
    server_name _;
```

**Описание:** Nginx слушает только порт 80 (HTTP). Нет HTTPS termination, нет auto-redirect с HTTP→HTTPS. Это dev конфигурация. Однако:
- Tokens передаются в cleartext на internal network
- Dev server использует HTTP → привычка не переходить на HTTPS для prod

**Рекомендация:** Для production: добавить HTTPS termination. Задача 057.

#### F-005: Нет Content-Security-Policy (High)

**Файл:** `infra/nginx/default.conf:11-109`

**Описание:** CSP — наиболее эффективный механизм защиты от XSS. AprilHub использует:
- Внешние скрипты (Keycloak SDK с CDN или local)
- Dynamic module loading (code splitting)
- DS компоненты из `@april/ui`

Without CSP, если какой-либо компонент будет compromised → XSS payload может быть injected.

**Рекомендация:** Implement CSP with `script-src` allowlist. Задача 057.

#### F-014: Нет rate limiting в Nginx (High)

**Файл:** `infra/nginx/default.conf:1-109`

**Описание:** Nginx не имеет `limit_req` или `limit_conn` directives. Любой клиент может отправлять неограниченное количество запросов.

**Рекомендация:** Добавить rate limiting:
- `/auth/*` — низкий limit (OIDC flow)
- `/api/*` — средний limit
- `/healthz`, `/readyz` — высокий limit (health checks). Задача 057.

#### F-020: Docker без resource limits (Medium)

**Файл:** `docker-compose.yml:38-196`

**Описание:** Ни один контейнер не имеет `deploy.resources.limits`. Это позволяет:
- OOM DoS если один сервис утекает памятью
- Resource starvation если один сервис потребляет все ресурсы

**Рекомендация:** Добавить memory и CPU limits для всех services.

#### F-022: Nginx Server header не скрыт (Low)

**Файл:** `infra/nginx/default.conf:11-109`

**Описание:** Отсутствует `server_tokens off;`. Nginx отдаёт версию в response header `Server: nginx/x.x.x`.

**Рекомендация:** Добавить `server_tokens off;` в server config. Задача 057.

#### F-025: Нет HSTS (Medium)

**Файл:** `infra/nginx/default.conf:11`

**Описание:** При HTTPS deployment (см. F-002) не может быть HSTS. Это нужно подготовить заранее.

**Рекомендация:** Добавить `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;` при переходе на HTTPS. Задача 057.

---

### CSRF Analysis

**Файл:** `hub-bff/internal/http/cors.go:1-25`

**Статус:** ✅ **CSRF риск низкий.**

**Обоснование:**
1. **BFF использует Bearer token auth** (не cookie-based session). CSRF требует cookie-attached credentials. Bearer tokens не отправляются автоматически браузером.
2. **CORS middleware** не включает `Access-Control-Allow-Credentials: true` — значит cross-origin запросы не могут нести credentials.
3. **Logout через Keycloak** — это redirect к Keycloak endpoint, не CSRF-уязвим (Keycloak сам защищает через state param в OIDC flow).

**Ограничения:**
- Если в future BFF перейдёт на cookie-based auth — нужен CSRF middleware
- Keycloak logout redirect URL (`PostLogOutUrl` в Keycloak config) не настроен в realm JSON — если не настроен, после logout user может перенаправиться на arbitrary URL.

**Рекомендация:** Настроить `PostLogOutUrl` в Keycloak client config.

---

### XSS Analysis

**Статус:** ✅ **XSS surface минимальна.**

**Позитивные факторы:**
1. **Нет `dangerouslySetInnerHTML`** — проверено через grep во всём hub-shell/src/
2. **Нет `innerHTML`** — проверено через grep
3. **React авто-экранирование** — все user data рендерятся через JSX children/props
4. **Widget data** из API — JSON-parsed, не HTML-injected
5. **CSP отсутствует** (F-005) — это mitigation gap, но не vulnerability

**Риски:**
1. **Dynamic module loading (F-018):** если malicious code попадает в Vite build pipeline → XSS через compromised bundle
2. **Widget iframe embedding:** виджеты рендерятся как React компоненты (не iframe), что снижает XSS surface. Однако если AprilProfile upstream возвращает HTML в JSON field, который рендерится — возможен stored XSS. Это нужно проверить в AprilProfile upstream.
3. **Hash-based routing** — `getLocationFromHash()` парсит `window.location.hash`. Hash не может содержать XSS payload для React (он обрабатывается как plain string для route matching).

**Рекомендация:** Добавить CSP header (F-005) как ultimate XSS mitigation.

---

### SSE Endpoint Security

**Статус:** ⚠️ **SSE endpoint не обнаружен в текущей кодовой базе.**

TASK.md упоминает `/sse` endpoint для async notifications. Однако:
- Нет регистрацией маршрута `/sse` в `hub-bff/cmd/hub-bff/main.go`
- Нет SSE реализации в `hub-bff/internal/http/`
- Нет упоминания `/sse` в `openapi/aprilhub-bff.yaml`
- Нет SSE client кода в `hub-shell/src/`

**Возможные объяснения:**
1. SSE endpoint планировался, но не реализован (ещё в backlog)
2. SSE endpoint реализован в другом сервисе (AprilNflow)
3. SSE endpoint реализован через WebSocket вместо SSE

**Влияние на аудит:** Если SSE endpoint будет добавлен в будущем, нужно обеспечить:
- JWT authentication (с тем же middleware)
- Rate limit на подключение
- Data leakage prevention (содержимое SSE не должно содержать sensitive PII)
- Timeout для SSE connections (предотвращать open socket DoS)

**Рекомендация:** При реализации `/sse` endpoint включить его в security review повторно.

---

### RBAC Gaps Analysis

**Файл:** `hub-bff/cmd/hub-bff/main.go:49-81`

**Текущее покрытие:**

| Endpoint | Required Roles | OK? |
|-----|-----|-----|
| `/healthz` | none (public) | ✅ |
| `/readyz` | none (public) | ✅ |
| `/metrics` | **none** | ❌ F-003 |
| `/api/v1/overview` | user, admin | ✅ |
| `/api/v1/aggregation/dashboard` | user, admin | ✅ |
| `/api/v1/aggregation/home` | user, admin | ✅ |
| `/api/v1/aggregation/summary` | user, admin | ✅ |
| `/api/v1/me` | user, admin | ✅ |
| `/api/v1/admin/ping` | admin | ✅ |
| `/api/v1/admin/profile/{proxyPath}` | admin | ✅ |

**Гранулярность RBAC:**

Текущая модель: binary `user`/`admin`. Это соответствует Keycloak realm roles:
- `user` — базовый доступ
- `admin` — admin endpoints + proxy

**Заметки:**
- Роли `manager` и `moderator`, упомянутые в `docs/auth-jwt-keycloak-adapted.md`, не используются в коде
- Нет field-level access (все user/admin видят всё что может показать aggregation)
- Нет tenant-scoped RBAC (future phase)

**Рекомендация:** После 056: рассмотреть granular permissions для manager/moderator roles.

---

## 8) Сводка по задачам 056–059

### Задача 056: Rate Limiting на BFF endpoints

| Finding | Severity | Описание |
|-----|-----|-----|
| F-003 | Medium | `/metrics` без auth — IP whitelist |
| F-004 | Low | health endpoints rate limit |
| F-006 | Medium | JWKS refresh monitoring |
| F-009 | Medium | Token exchange для upstream |
| F-010 | Low | Proxy path whitelist |
| F-012 | Medium | Rate limit middleware |
| F-015 | Medium | Security-specific Prometheus alerts |
| F-019 | Medium | Audience check AND logic |
| F-021 | Low | Body size limit |

### Задача 057: Security Headers

| Finding | Severity | Описание |
|-----|-----|-----|
| F-001 | High | Все security headers в Nginx |
| F-002 | High | HTTPS redirect |
| F-005 | High | CSP header |
| F-014 | High | Nginx rate limiting |
| F-022 | Low | server_tokens off |
| F-025 | Medium | HSTS header |

### Задача 058: Dependency Vulnerability Scan

| Finding | Severity | Описание |
|-----|-----|-----|
| F-017 | Medium | CI security scan не блокирует merge |
| F-018 | Low | Dynamic module integrity |

### Задача 059: Penetration Testing

| Finding | Severity | Описание |
|-----|-----|-----|
| Все findings выше | — | Ручное тестирование key flows |

---

## 9) Риски и ограничения

### Архитектурные риски

1. **Single trust boundary — Keycloak:** вся auth модель зависит от единственного IdP. При недоступности Keycloak (F09-012) вся платформа недоступна. Нет fallback auth.
2. **Token forwarding без exchange:** user JWT напрямую передаётся upstream сервисам. Если один из upstream compromised — все токены утекают.
3. **No tenant isolation:** RBAC не scoped по tenant. Фазы 10–12 (multi-tenant hardening) критичны для production readiness.
4. **HTTP-only dev environment:** привычка работать без HTTPS может привести к тому, что HTTPS + HSTS будут забыты при production deploy.

### Ограничения аудита

1. **Сканирование статического кода:** не выполнялся dynamic security test (DAST) или runtime analysis
2. **SSE endpoint не найден:** audit coverage для SSE incomplete — нужен follow-up при реализации
3. **Downstream services не в scope:** AprilProfile, AprilWorkflow, AprilNflow не анализировались — это отдельные repos
4. **Dev-only конфигурация:** многие findings (hardcoded creds, HTTP-only) являются dev-artefacts, не production risk
5. **Docker internals:** Nginx images (upstream) могут иметь vulnerabilities — нужен vulnerability scan на сами container images

### Рекомендации приоритизации

**P0 (критично перед production):**
1. F-001: Security headers (задача 057)
2. F-002: HTTPS termination (задача 057)
3. F-012: Rate limiting (задача 056)
4. F-007: Dev credentials cleanup
5. F-019: Audience check fix (задача 056)

**P1 (важно перед multi-tenant):**
1. F-009: Token exchange (задача 056)
2. F-017: CI security scan strict mode (задача 058)
3. F-015: Security-specific alerts

**P2 (nice to have):**
1. F-003: Metrics IP whitelist
2. F-016: Loki security rules
3. F-020: Docker resource limits
4. F-022: Server tokens off
5. F-023: Redis default password

## 10) Что осталось

- [ ] Penetration testing (задача 059) — не входит в scope 055
- [ ] Vulnerability scan automation improvement (задача 058) — не входит в scope 055
- [ ] Rate limiting implementation (задача 056) — не входит в scope 055
- [ ] Security headers implementation (задача 057) — не входит в scope 055
- [ ] SSE endpoint audit — endpoint не найден, нужен follow-up при реализации
- [ ] Downstream services audit (AprilProfile, AprilWorkflow) — другой репозиторий
