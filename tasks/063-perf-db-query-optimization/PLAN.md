# План: DB Query Optimization (задача 063)

- **Задача:** [`TASK.md`](./TASK.md)
- **Дата плана:** 2026-05-12
- **Статус плана:** согласован

## Исходные допущения
- Hub BFF stateless — не имеет прямого DB access (решение задачи 007).
- PostgreSQL 17 используется только в AprilProfile (downstream сервис).
- BFF проксирует запросы в AprilProfile через reverse-proxy (`/api/v1/admin/profile/**`).
- Изменения schema/migration — забота AprilProfile; в Worker только рекомендации и документация.
- Dev Docker Compose стоит с PostgreSQL 17-alpine без `pg_stat_statements` (нет `shared_preload_libraries`).

## Порядок работ (шаги)
1. Аудит SQL queries в AprilProfile: прочитать все файлы `internal/profiles/`, `internal/entitytypes/`, `internal/asyncjobs/`.
2. Инвентаризация существующих индексов по миграциям Atlas.
3. Анализ паттернов запросов, выявление потенциально медленных query paths (JOIN LATERAL, ILIKE, COUNT(*) с LATERAL).
4. Анализ BFF proxy layer (`profile_proxy.go`, `handlers.go`) — какие downstream endpoints вызываются.
5. Составление рекомендаций по индексам.
6. Рекомендации по включению `pg_stat_statements` в AprilProfile.
7. Рекомендации по Grafana dashboard panel для query monitoring.
8. Создание `docs/performance/db-query-optimization.md` с baseline анализом.
9. Создание `REPORT.md` в папке задачи.
10. Создание dual report в `vendor/april-profile/tasks/063-db-query-optimization/summary.txt`.
11. Проверка по checklist из TASK.md.

## Затрагиваемые области
| Область | Что меняется (кратко) |
|--------|------------------------|
| Docs | `docs/performance/db-query-optimization.md` — baseline анализ, рекомендации по индексам, query plans |
| Docs | `tasks/063-perf-db-query-optimization/REPORT.md` — отчёт по шаблону |
| Docs | `tasks/063-perf-db-query-optimization/PLAN.md` — этот файл |
| AprilProfile (рекомендации) | `vendor/april-profile/tasks/063-db-query-optimization/summary.txt` — dual report |

## Риски и откат
- **Риск:** Нет прямого доступа к работающей PostgreSQL на dev-стенде → EXPLAIN ANALYZE не выполнен live. → **Митигация:** анализ на основе кода (static query review) + рекомендации для live check.
- **Риск:** Рекомендации по индексам требуют валидации на production dataset. → **Митигация:** документировать как "рекомендации к проверке".
- Откат: только текстовые файлы — нет изменений кода или schema.

## Проверка после выполнения
- Checklist TASK.md пройден пункты.
- `REPORT.md` содержит все разделы по шаблону.
- Dual report существует в `vendor/april-profile/`.

## Примечания
- Связанный ADR: `docs/architecture/ADR-april-phase-9-security-and-performance.md`
- Cross-repo: изменения schema — задача для AprilProfile.
