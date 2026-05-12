# Политика управления уязвимостями зависимостей

## 1. Область применения

Данная политика распространяется на все зависимости проекта April Worker (AprilHub):

- **Go (hub-bff):** `hub-bff/go.mod` — Gin, JWT, Redis, PostgreSQL driver, Sentry SDK и др.
- **npm (hub-shell):** `hub-shell/package.json` — React, Mantine, @april/ui, Sentry JS SDK и др.
- **Инфраструктурные образы:** Docker-образы в `infra/` и CI-окружение.

## 2. Классификация уязвимостей

| Уровень | Описание | SLA фикса | Действие |
|---------|----------|-----------|----------|
| **Critical** | Уязвимости с прямым вектором эксплуатации (RCE, SQLi, десериализация) | Немедленно (≤ 24 ч) | Блокировка merge, экстренный фикс |
| **High** | Значительный риск (XSS, SSRF, auth bypass), CVSS ≥ 7.0 | ≤ 1 неделя | Фикс в текущем спринте |
| **Medium** | Умеренный риск, CVSS 4.0–6.9 | Следующий спринт | Планирование фикса, оценка trade-off |
| **Low** | Минимальный риск, CVSS < 4.0 | Track | Отслеживание в бэклоге |

### CVSS Reference
- CVSS 9.0–10.0 → Critical
- CVSS 7.0–8.9 → High
- CVSS 4.0–6.9 → Medium
- CVSS 0.1–3.9 → Low

## 3. Инструменты сканирования

### Go (hub-bff)
| Инструмент | Тип | Частота | Фейлит пайплайн? |
|------------|-----|---------|-------------------|
| `govulncheck ./...` | CVE scan Go modules | Каждый PR + push | Critical/High |
| `gosec ./...` | Static analysis | Каждый PR + push | Critical/High |
| `go vet ./...` | Стандартный анализ | Каждый PR + push | Да (любой finding) |

### npm (hub-shell)
| Инструмент | Тип | Частота | Фейлит пайплайн? |
|------------|-----|---------|-------------------|
| `npm audit --audit-level=critical` | CVE scan npm packages | Каждый PR + push | Critical |
| `npm audit --json` | JSON отчёт для артефакта | Каждый PR + push | Нет (артефакт) |

### Еженедельный скан
- **Сcheduled CI job:** Каждый понедельник 06:00 UTC (`0 6 * * 1`)
- Покрытие: все зависимостиGo и npm, те же инструменты
- Отчёт сохраняется как артефакт `security-scan-artifacts` (TTL 30 дней)

## 4. Процесс исключений (Exception Process)

Когда уязвимость не может быть исправлена немедленно, следует процесс исключения:

### 4.1. Критерии для исключения
- Обновление dependency ломает API или поведение production
- Патч отсутствует у vendor'а (нет релиза с фиксом)
- Уязвимость не эксплуатировима в текущей конфигурации (например, отключенный endpoint)

### 4.2. Процедура
1. Завести issue с меткой `security-exception` и ссылкой на CVE
2. Описать:
   - Что за уязвимость (CVE-ID, severity, affected package)
   - Почему нельзя зафиксить сейчас
   - Митигирующие меры (что снижает риск)
   - Сроко_review (не более 30 дней для High, 60 дней для Medium)
3. Утвердить исключение Tech Lead или Architect
4. Занести в таблицу исключений ниже (или в task list)
5. Ре-еvalвировать по истечении срока

### 4.3. Таблица действующих исключений

| CVE | Пакет | Severity | Причина исключения | Митигация | Срок ревью | Статус |
|-----|-------|----------|---------------------|-----------|------------|--------|
| — | — | — | Нет действующих исключений | — | — | — |

> **Примечание:** При появлении нового исключения заполнить строку в таблице. Отработанные исключения удалять с пометкой в issue.

## 5. Частота ревью

| Активность | Частота | Ответственный |
|------------|---------|---------------|
| CI scan (PR/push) | Автоматически | CI pipeline |
| Scheduled scan | Еженедельно (ПН) | CI pipeline |
| Обзор артефактов | Еженедельно | Dev Lead / Security Owner |
| Обновление policy | При изменении стека | Architect |
| Exception review | По сроку в issue | Tech Lead |

## 6. Интеграция с CI

- Job `security-scan` в `.github/workflows/ci.yml`
- Фейлит pipeline при Critical или High findings
- Артефакты: `security-scan-artifacts` (JSON отчёты npm, логи gosec/govulncheck)
- Branch protection: `security-scan` должен быть в required status checks для `develop` и `main`

## 7. Rollback и мониторинг

- При обнаружении Critical уязвимости в production:
  1. Уведомить команду (Slack #alerts или эквивалент)
  2. Оценить эксплуатированность в текущем деплое
  3. Если эксплуатируется — экстренный фикс + hotfix deploy
  4. Если нет — плановый фикс в рамках SLA
- Все security findings логируются в Sentry с тегом `security-scan`
- Grafana дашборд: добавить alert на количество Critical/High findings > 0

## 8. Ссылки

- ADR: [`docs/architecture/ADR-april-phase-9-security-and-performance.md`](../architecture/ADR-april-phase-9-security-and-performance.md)
- CI workflow: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)
- OpenAPI spec: [`openapi/openapi.yaml`](../../openapi/openapi.yaml)
