# AprilHub Sentry Rollout Preparation (Task 035)

## Назначение

Runbook фиксирует подготовительный пакет для внедрения Sentry в AprilHub (`hub-shell`/`hub-bff`) без runtime-изменений кода. Реализация SDK и кодовые правки выполняются в задаче `037`.

Связанные документы:

- `docs/architecture/ERROR_TELEMETRY_MODEL.md`
- `docs/runbooks/APRIL_ERROR_TELEMETRY_TRIAGE.md`
- `docs/DEPLOYMENT_STRATEGY.md`
- `docs/TESTING_STRATEGY.md`

## 1) Env-контур для AprilHub

Обязательные переменные (в `.env.example` добавляются как шаблон без реального DSN):

| Переменная | Обязательность | Назначение | Пример для локального/CI контура |
|---|---|---|---|
| `SENTRY_DSN` | обязательно при включении SDK | DSN проекта Sentry | `https://examplePublicKey@o0.ingest.sentry.io/0` |
| `SENTRY_ENVIRONMENT` | обязательно | Окружение события (`dev`/`staging`/`prod`) | `dev` |
| `SENTRY_RELEASE` | обязательно | Релиз (git SHA/semver) | `local-dev` |
| `SENTRY_TRACES_SAMPLE_RATE` | обязательно | Доля performance traces (`0..1`) | `0.1` |
| `SENTRY_REPLAYS_SESSION_SAMPLE_RATE` | опционально (если replay включён) | Базовый session replay sampling | `0.0` |
| `SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE` | опционально (если replay включён) | Replay при ошибках | `1.0` |

Правила:

- В git хранить только шаблонные/безопасные значения.
- Реальные DSN задаются в server-local `.env`/secret store вне репозитория.
- Для CI dry-run допускается пустой `SENTRY_DSN` (SDK не инициализируется до задачи `037`).

## 2) Baseline sampling policy

Стартовая политика для первой фазы rollout:

- `SENTRY_TRACES_SAMPLE_RATE=0.1` — консервативно для снижения шума и стоимости.
- `SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0.0` — replay выключен по умолчанию.
- `SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=1.0` — если replay включён, полный захват только ошибочных сессий.

Пересмотр после релиза `037`:

1. Через 24-72 часа собрать фактический event volume.
2. Проверить полезность сигналов в triage-потоке `Sentry -> Loki -> Prometheus`.
3. При необходимости скорректировать sample rates отдельным PR без изменения бизнес-логики.

## 3) Redaction / data safety policy (frontend payload)

До включения SDK должен быть согласован deny-list полей и источников:

- Никогда не отправлять: `Authorization`, `Cookie`, `Set-Cookie`, `X-Api-Key`, `token`, `password`, `secret`, `session`.
- Исключать из telemetry произвольные пользовательские payload/body с ПДн; оставлять только технические поля (`code`, `httpStatus`, `requestId`, `correlationId`, `route`, `module/widget`).
- Для идентификации пользователя использовать технический `subject`/hash без email/ФИО.
- Проверять breadcrumbs перед отправкой: URL query и body должны быть очищены от чувствительных данных.
- Любое расширение перечня telemetry-полей проходит security-review.

## 4) Event filtering policy (noise reduction)

До rollout фиксируются правила фильтрации:

1. Игнорировать browser extension noise (`ResizeObserver loop limit exceeded`, extension scripts, adblock injection).
2. Игнорировать сетевые/abort-события без пользовательского действия (`AbortError`, canceled navigation fetch), если нет деградации UX.
3. Дедуплицировать повторяющиеся клиентские ошибки с одинаковым fingerprint в коротком окне.
4. Не репортить ожидаемые UX-cases (`401` при истечении сессии до re-auth flow), если сценарий успешно завершается.
5. Ошибки с `5xx`, `503`, runtime crash и `unhandledrejection` из продуктового кода всегда сохранять.

## 5) Rollout checklist (implementation task 037)

Перед merge PR реализации `037`:

- [ ] Env-переменные добавлены в runtime-конфиг и задокументированы (`.env.example` + runbook).
- [ ] Реализован `beforeSend`/аналог с redaction policy из раздела 3.
- [ ] Реализован filtering policy из раздела 4.
- [ ] Добавлены correlation-теги: `requestId`, `correlationId`, `tenant`, `route`, `module/widget`, `release`.
- [ ] Прогнаны mandatory проверки из `README.md` и `docs/TESTING_STRATEGY.md`.
- [ ] Приложены артефакты PR: скриншоты Sentry issue (без секретов), выдержки Loki query по `requestId`, метрики/алерты Prometheus или их отсутствие.
- [ ] В `tasks/037-*/REPORT.md` зафиксированы риски, fallback и owner.

## 6) Smoke checks (после реализации 037)

Сценарий smoke после включения SDK:

1. Убедиться, что приложение стартует с заданными Sentry env без runtime-fail.
2. Инициировать безопасную тестовую ошибку в dev (только на стенде, без PII).
3. Проверить появление issue в Sentry с тегами `environment`, `release`, `route`, `requestId`.
4. Проверить корреляцию по `requestId` в Loki и отсутствие инфраструктурных алертов в Prometheus для ложного инцидента.
5. Подтвердить, что фильтр отсекает extension noise/ожидаемые abort events.

Пример dry-run команд для текущего этапа (без SDK и без реального DSN):

```bash
# Проверка env-шаблона
rg "SENTRY_DSN|SENTRY_ENVIRONMENT|SENTRY_RELEASE|SENTRY_TRACES_SAMPLE_RATE" .env.example

# Проверка, что runbook и индексы содержат ссылки на rollout-документ
rg "APRILHUB_SENTRY_ROLLOUT_PREPARATION" docs
```

## 7) Rollback policy (для релиза 037)

Если после включения Sentry возникает деградация:

1. Отключить SDK через env-флаг (пустой `SENTRY_DSN` или feature flag реализации `037`).
2. Задеплоить rollback согласно `docs/DEPLOYMENT_STRATEGY.md` (образы по SHA, health/smoke после отката).
3. Проверить восстановление UX и отсутствие новых runtime error spikes.
4. Зафиксировать инцидент в `REPORT.md` с причиной и корректирующими действиями.

## 8) Ownership

- **Feature implementation owner (`037`):** команда AprilHub frontend (`hub-shell`) с ревью платформенной команды.
- **Observability owner:** platform/observability (валидирует корреляцию Sentry -> Loki -> Prometheus).
- **Security owner:** проверка redaction policy и отсутствия PII в telemetry.

## 9) Runtime implementation mapping (`037`)

Текущая реализация в `hub-shell`:

- Инициализация SDK и глобальные runtime hooks:
  - `hub-shell/src/sentry.ts`
  - `hub-shell/src/main.tsx`
- Capture для `CompositionErrorBoundary`:
  - `hub-shell/src/composition-error-boundary.tsx`
  - `hub-shell/src/composition-layer.tsx`
- HTTP telemetry-слой и capture `400/404/503/5xx`:
  - `hub-shell/src/api.ts`
  - интеграция в widgets/profile API calls:
    - `hub-shell/src/widgets.tsx`
    - `hub-shell/src/profile-widget.tsx`

Что проверять после deploy:

1. В Sentry появляются runtime/HTTP события с тегами `requestId`, `correlationId`, `tenant`, `route`, `module/widget`.
2. В breadcrumbs/контексте нет `Authorization`, `Cookie`, `token`, `password`, `secret`.
3. Шум от `ResizeObserver`/extension/abort-case не создаёт инциденты.
4. По `requestId` инцидент коррелируется в Loki и подтверждается/опровергается в Prometheus по `APRIL_ERROR_TELEMETRY_TRIAGE`.
