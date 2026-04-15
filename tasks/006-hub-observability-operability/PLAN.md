# План: Hub Observability & Operability Baseline (Этап 006)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-04-15
- **Статус плана:** согласован

## Исходные допущения
- Этап `005` завершён: контракты `Hub BFF -> downstream` и OpenAPI `v1` baseline уже синхронизированы.
- Основной объём работ этапа `006` реализуется в `hub-bff`; изменения в `hub-shell` допустимы только в части trace propagation и без пересмотра UX/бизнес-логики.
- Сквозная трассировка (`correlationId/requestId/sourceService`) уже частично присутствует, требуется доведение до операционно пригодного baseline (логи, метрики, runbook, проверяемость).
- Инфраструктурный стек (Prometheus/Grafana/Loki/Promtail) не перепроектируется в рамках этапа, только подключается минимально необходимый сигнал observability.

## Порядок работ (шаги)
1. **Инвентаризация текущего observability состояния**
   Проверить текущую передачу metadata, покрытие логами и наличие метрик/сигналов в `hub-bff` и связанных smoke-проверках.
2. **Формализация trace и logging policy**
   Уточнить единые правила для `correlationId/requestId/sourceService`, структуру логов и safe-поля для auth/downstream/degraded событий.
3. **Реализация backend observability baseline**
   Добавить/доработать middleware и runtime-инструментацию в `hub-bff`: request logging, downstream logging, degraded/auth события, метрики latency/error/retry/timeout.
4. **Проверяемость и тесты**
   Добавить/обновить unit/integration проверки на propagation, degraded observability-сигналы и отсутствие регрессий по auth/RBAC.
5. **Операционные материалы**
   Зафиксировать минимальный runbook диагностики (401/403, degraded, рост latency/error-rate) в документации этапа/архитектуры.
6. **Валидация и фиксация результата**
   Прогнать обязательные команды (`openapi-lint`, `go test`, smoke), обновить `REPORT.md` фактическими результатами и follow-up.

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Backend (Go) | `hub-bff` middleware/runtime: structured logging, metrics, metadata propagation hardening |
| Frontend | Точечная проверка/фикс trace headers в запросах `hub-shell` (если обнаружены пробелы) |
| БД / Atlas | Не требуется; схемные изменения вне scope этапа |
| Инфра / Compose | Smoke/compose-профили и env-документация для observability проверок (при необходимости) |
| Документация / OpenAPI | Runbook и architecture notes по trace/logging/metrics; OpenAPI без функционального расширения |

## Риски и откат
- **Риск:** Избыточное логирование создаст шум и утечку чувствительных данных.  
  **Митигация:** whitelist-подход к log-полям, ревью на отсутствие токенов/PII.
- **Риск:** Метрики и логи повлияют на latency hot-path.  
  **Митигация:** минимальный baseline метрик, недорогие labels, замеры в smoke.
- **Риск:** Расхождение между документацией и фактической реализацией instrumentation.  
  **Митигация:** обновлять docs только после фактической валидации команд.
- **При необходимости отката:** удалить/отключить новые instrumentation hooks и вернуть предыдущую конфигурацию логирования/метрик отдельным revert-коммитом.

## Проверка после выполнения
- Команды (как в `TASK.md`):
  - `make openapi-lint`
  - `cd hub-bff && go test ./...`
  - `./scripts/smoke-aprilhub.sh`
- Ручная проверка / smoke:
  - в ответах и запросах сохраняются `correlationId/requestId/sourceService`;
  - при degraded-сценарии есть диагностируемый лог и счётчик;
  - при `401/403` есть корректный безопасный observability-сигнал.

## Примечания
- Связанные артефакты: `tasks/005-hub-contracts-openapi-hardening/REPORT.md`, `docs/architecture/INTEGRATION_CONTRACTS.md`, `docs/TESTING_STRATEGY.md`.
- Обновления плана:
  - `2026-04-15` — первичная версия плана для старта этапа `006`.
  - `2026-04-15` — выполнены шаги 1-5: добавлены request/downstream/auth/degraded сигналы и runbook; шаг 6 закрыт частично (smoke требует отдельной стабилизации окружения).
  - `2026-04-15` — шаг 6 закрыт: smoke стабилизирован через обновление Go image в compose-профиле.
