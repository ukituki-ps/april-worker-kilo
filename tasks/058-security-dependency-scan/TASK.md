# Задача 058: Dependency Vulnerability Scan

## Мета
- **ID / ветка:** `058-security-dependency-scan`
- **Приоритет:** высокий (Phase 9 — Security трек, нет зависимостей)
- **ADR:** [`docs/architecture/ADR-april-phase-9-security-and-performance.md`](../../docs/architecture/ADR-april-phase-9-security-and-performance.md)

## Цель
Автоматизировать сканирование уязвимостей в зависимостях Go (hub-bff) и npm (hub-shell), интегрировать в CI pipeline, зафиксировать mitigation policy для известных CVE.

## Контекст для агента
- Go dependencies: `hub-bff/go.mod` — Gin, JWT, Redis, PostgreSQL driver, Sentry SDK
- npm dependencies: `hub-shell/package.json` — React, Mantine, @april/ui, Sentry JS SDK
- CI: GitHub Actions `.github/workflows/ci.yml` — уже есть, security jobs добавить

## Входит в объём

### Go (hub-bff)
- [ ] `go vet ./...` — статический анализ (уже есть, проверить что в CI)
- [ ] `govulncheck ./...` — CVE scan для Go modules
- [ ] `gosec ./...` — security issue scanner (static analysis)
- [ ] CI job: `security-go-scan` в `.github/workflows/ci.yml`
  - Запускается на PR и push в develop
  - Фейлит при Critical/High finding'ах
  - Отчёт в PR comment (если есть findings)

### npm (hub-shell)
- [ ] `npm audit --audit-level=critical` — CVE scan для npm packages
- [ ] `npm audit --json` — JSON отчёт для CI
- [ ] CI job: `security-npm-audit` в `.github/workflows/ci.yml`
  - Фейлит при Critical finding'ах
  - Warning/Info отчёт — вывод в CI log
  - `npm audit --fix` для auto-fix безопасных vulnerabilities

### CI Integration
- [ ] Новый job `security-scan` в `ci.yml`:
  - Запускается на PR к develop/main
  - Фейлит pipeline при Critical/High findings
  - Post comment в PR с суммарным отчётом
- [ ] Branch protection: require `security-scan` success для merge
- [ ] Scheduled scan: еженедельный job (cron: `0 6 * * 1`)

### Mitigation Policy
- [ ] Документация `docs/security/dependency-policy.md`:
  - Классификация: Critical (fix immediately) / High (fix within 1 week) / Medium (fix in next sprint) / Low (track)
  - Exception process: когда dependency не имеет фикса
  - Review cadence: еженедельный audit report в task list
- [ ] `REPORT.md` с текущим state: какие CVE найдены, что fixed, что требует follow-up

## Не входит в объём
- SCA tools subscription (используем free: govulncheck, npm audit, gosec)
- Binary analysis (мы ship container images, не binaries)
- Secret scanning (отдельная задача, если нужна)

## Технические ограничения
- Go: 1.23+ (project стандарт)
- npm: существующий version
- CI: GitHub Actions, self-hosted runner может быть недоступен — тесты должны работать на GitHub-hosted

## Критерии готовности (acceptance)
- [ ] CI job `security-scan` в `ci.yml` работает
- [ ] Pipeline фейлит при Critical/High findings
- [ ] `govulncheck` и `gosec` запущены на hub-bff
- [ ] `npm audit` запущен на hub-shell
- [ ] Scheduled еженедельный scan настроен
- [ ] `docs/security/dependency-policy.md` создана
- [ ] Текущие findings задокументированы в REPORT.md

## Проверка
```bash
# Go scan
cd hub-bff && govulncheck ./...
cd hub-bff && gosec ./...

# npm audit
cd hub-shell && npm audit --audit-level=critical
cd hub-shell && npm audit --json > /tmp/kilo/npm-audit.json

# Проверка CI workflows
cat .github/workflows/ci.yml | grep security-scan
```

## Результат в отчёте
CI workflow diff, docs, текущий vulnerability report.
