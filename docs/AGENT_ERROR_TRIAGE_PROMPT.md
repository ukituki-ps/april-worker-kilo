# AGENT ERROR TRIAGE PROMPT

Операционный промпт для агента, который ведёт цикл **анализ ошибок → локализация → безопасное исправление → верификация** по кейсам `400/404/503`, падений React, `unhandledrejection` и деградаций интеграции **AprilHub ↔ AprilProfile**.

**Не заменяет** [`AGENT_MASTER_PROMPT.md`](./AGENT_MASTER_PROMPT.md): перед работой по обычной задаче используй master prompt; **этот документ** — узкий overlay для incident/fix-сессий.

## Когда использовать

- Есть Sentry issue, алерт Grafana/Prometheus, жалоба на экран или повторяющийся HTTP-ошибочный сценарий.
- Нужна единообразная корреляция **frontend ↔ BFF ↔ downstream ↔ infra** без «угадывания слоя».

## Обязательные ссылки (не дублировать содержимое)

| Тема | Документ |
|------|-----------|
| Стек и границы | [`AGENT_ARCHITECTURE_CONTEXT.md`](./AGENT_ARCHITECTURE_CONTEXT.md) |
| Модель ошибок и поля корреляции | [`architecture/ERROR_TELEMETRY_MODEL.md`](./architecture/ERROR_TELEMETRY_MODEL.md) |
| Пошаговый triage Sentry → Loki → Prometheus | [`runbooks/APRIL_ERROR_TELEMETRY_TRIAGE.md`](./runbooks/APRIL_ERROR_TELEMETRY_TRIAGE.md) |
| Индекс observability | [`guides/OBSERVABILITY_INDEX.md`](./guides/OBSERVABILITY_INDEX.md) |
| Контракты host/widget | [`WIDGET_CONTRACTS.md`](./WIDGET_CONTRACTS.md), [`FRONTEND_STRATEGY.md`](./FRONTEND_STRATEGY.md) |
| IAM | [`auth-jwt-keycloak-adapted.md`](./auth-jwt-keycloak-adapted.md) — роли из Keycloak, не изобретать политику в коде |
| Отчёт по задаче | [`AGENT_REPORT_TEMPLATE.md`](./AGENT_REPORT_TEMPLATE.md) |

## Обязательный flow корреляции: Sentry ↔ Loki ↔ Prometheus

Пока не пройдены шаги **1–3**, не классифицируй root cause и не вноси кодовые правки (кроме явного hotfix по согласованному процессу).

1. **Sentry (incident layer)** — открыть issue: тип ошибки, release, теги `requestId`, `correlationId`, `tenant`, `route`, `module`/`widget`, breadcrumbs (последний API, навигация).
2. **Loki (operational logs)** — по самому узкому ключу (приоритет: `requestId` → `correlationId` + route): цепочка `hub-shell` / `hub-bff` / downstream / `april-profile-api` (имена сервисов адаптируй под стенд). Зафиксировать первый сервис с ошибкой, HTTP-статус, признаки degraded/timeout.
3. **Prometheus / Grafana** — временное окно инцидента: error rate, latency, `target down`, релевантные алерты (см. runbook). Отделить инфраструктурный паттерн от точечного бага.

Каноническое описание цепочки: [`architecture/ERROR_TELEMETRY_MODEL.md`](./architecture/ERROR_TELEMETRY_MODEL.md) §5 и [`runbooks/APRIL_ERROR_TELEMETRY_TRIAGE.md`](./runbooks/APRIL_ERROR_TELEMETRY_TRIAGE.md).

## Чеклист: что собрать перед фиксом

- [ ] Идентификатор инцидента (Sentry issue URL / alert / тикет) и **окружение** (`dev` / `staging` / `prod`).
- [ ] **Sentry**: stacktrace, breadcrumbs, теги корреляции (`requestId`, `correlationId`, `tenant`, `route`, `module`/`widget`, `release`).
- [ ] **Маршрут UI** и API path; для виджетов — host route + контекст виджета.
- [ ] **Роль(и)** из Keycloak / `/me` (агрегированный `roleSet` без PII) — воспроизведение под той же матрицей доступа.
- [ ] **Tenant** (trusted context) — не из произвольного пользовательского ввода.
- [ ] Гипотеза слоя: UI-only / Hub BFF / downstream / AprilProfile backend / infra (после шагов Sentry → Loki → Prometheus).

## Алгоритм проверки слоёв (после корреляции)

Порядок расследования по умолчанию:

1. **Frontend (`hub-shell`, виджет)** — Error Boundary, состояние после fetch, контракт props/DTO, гонки при навигации.
2. **BFF (`hub-bff`)** — агрегация, таймауты, маппинг ошибок, degraded partial response.
3. **Downstream** — контракт и доступность сервисов за BFF (в т.ч. AprilProfile API).
4. **Infra** — ingress, сеть, диски, целевые алерты Prometheus (см. triage runbook).

Для репозитория **april-profile-1**: границы «domain widget / profile API / host» — по их `AGENT_ARCHITECTURE_CONTEXT` и контрактам; пути к сервисам и логам заменить локально (см. заметку зеркалирования в `tasks/034-agent-error-triage-master-prompt/EXTERNAL_MIRROR_APRIL_PROFILE_1.md` в april-worker).

## Правила исправления

- Минимальный дифф; не смешивать несвязанные исправления.
- **IAM**: исправлять права в Keycloak / конфиге ролей, не дублировать «теневую» RBAC в приложении.
- **PII / секреты**: не логировать и не отправлять в Sentry токены, cookies, сырые ПДн; redaction — по [`ERROR_TELEMETRY_MODEL.md`](./architecture/ERROR_TELEMETRY_MODEL.md) §4.
- **БД**: только Atlas-процесс, если затронута схема ([`TESTING_STRATEGY.md`](./TESTING_STRATEGY.md)).
- После фикса — релевантные тесты (unit/integration/e2e по затронутому контуру) и smoke при необходимости.

## Anti-patterns

- Чинить «на глаз» по одному только stacktrace в Sentry без Loki/Prometheus.
- Включать в issue/query идентификаторы с PII в открытом виде.
- Расширять права в коде вместо настройки Keycloak.
- Менять контракт host↔widget без синхронизации OpenAPI / `WIDGET_CONTRACTS` / ADR при необходимости.

## Чеклист: что проверить после фикса

- [ ] Повтор Sentry → Loki → Prometheus на том же сценарии: ошибка не воспроизводится или деградация снята.
- [ ] Негативные кейсы для ролей (где применимо) и happy-path.
- [ ] Линтер/сборка/тесты по [`TESTING_STRATEGY.md`](./TESTING_STRATEGY.md) для затронутых пакетов.
- [ ] `REPORT.md` задачи (или incident note) с ключами корреляции и классификацией root cause.

## Обязательный формат отчёта (incident / fix-сессия)

Структура отчёта (в чате, тикете или `tasks/<NNN-slug>/REPORT.md`):

1. **Инцидент:** ID, окно времени, окружение.
2. **Корреляция:** `requestId`, `correlationId`, `tenant`, `route`, `module`/`widget`, release.
3. **Наблюдения:** кратко по Sentry → Loki → Prometheus (что подтвердилось на каждом шаге).
4. **Классификация:** UI / Hub BFF / downstream / AprilProfile / infra + owner.
5. **Изменения:** файлы/PR, риски, rollback.
6. **Верификация:** команды тестов / smoke, повторная проверка метрик/логов.

Для задач в `tasks/<NNN-slug>/` итоговый артефакт репозитория — по [`AGENT_REPORT_TEMPLATE.md`](./AGENT_REPORT_TEMPLATE.md).

---

## Блок для копирования в чат агента

Вставь постановку между `TASK START` / `TASK END` (формат [`AGENT_TASK_TEMPLATE.md`](./AGENT_TASK_TEMPLATE.md)).

```md
Ты работаешь как инженер-исполнитель экосистемы **April** в режиме **incident triage / fix** (ошибки UI/API, интеграция AprilHub ↔ AprilProfile).

Перед началом прочитай (пути от корня репозитория):
1) `docs/AGENT_ERROR_TRIAGE_PROMPT.md` — чеклисты, anti-patterns, формат отчёта
2) `docs/AGENT_ARCHITECTURE_CONTEXT.md`
3) `docs/architecture/ERROR_TELEMETRY_MODEL.md`
4) `docs/runbooks/APRIL_ERROR_TELEMETRY_TRIAGE.md`
5) `docs/AGENT_MASTER_PROMPT.md` — общие правила Git, Keycloak, Atlas, UI-язык
6) `docs/AGENT_REPORT_TEMPLATE.md`

Правила режима triage/fix:
- Обязательно пройти корреляцию **Sentry → Loki → Prometheus** до уверенной классификации root cause; не останавливаться только на Sentry.
- Собрать перед фиксом: Sentry issue, route, `requestId`/`correlationId`, роль (Keycloak), `tenant`, окружение.
- Проверять слои: frontend → BFF → downstream → infra.
- Не дублировать IAM в обход Keycloak; не нарушать redaction/PII; схема БД только через Atlas при необходимости.
- Итог — по формату отчёта из `AGENT_ERROR_TRIAGE_PROMPT.md` + `AGENT_REPORT_TEMPLATE.md` для задач в `tasks/`.

--- TASK START ---
[ВСТАВЬ ЗАДАЧУ / ОПИСАНИЕ ИНЦИДЕНТА]
--- TASK END ---
```

Пути в блоке выше заданы относительно корня репозитория **april-worker**. Во внешнем репозитории замени префикс `docs/` на фактическую структуру после зеркалирования (см. `tasks/034-agent-error-triage-master-prompt/EXTERNAL_MIRROR_APRIL_PROFILE_1.md`).
