# Задача 063: DB Query Optimization

## Мета
- **ID / ветка:** `063-perf-db-query-optimization`
- **Приоритет:** высокий (Phase 9 — Performance трек, нет зависимостей)
- **ADR:** [`docs/architecture/ADR-april-phase-9-security-and-performance.md`](../../docs/architecture/ADR-april-phase-9-security-and-performance.md)

## Цель
Аудировать SQL queries используемые Hub BFF (если использует напрямую) и downstream сервисы (AprilProfile), определить slow queries, missing indexes, задокументировать рекомендации.

## Контекст для агента
- Hub BFF: stateless, не хранит данные напрямую (задача 007 decision)
- PostgreSQL: используется downstream сервисами (AprilProfile)
- Redis: caching, rate limiting
- Это cross-repo задача — требует coordination с AprilProfile

## Входит в объём

### Query Audit
- [ ] Выявить все SQL queries в AprilProfile которые вызываются через BFF
- [ ] Run `EXPLAIN ANALYZE` на key queries (profiles, entity-types)
- [ ] Identify slow queries (>100ms на dev dataset):
  - Missing indexes
  - Full table scans
  - N+1 query patterns

### Index Optimization
- [ ] Check existing indexes: `pg_indexes` для AprilProfile schema
- [ ] Рекомендуемые indexes:
  - `(org_id, created_at)` для profiles list (pagination)
  - `(entity_type_id)` для entity type queries
  - `(status, org_id)` для status-filtered queries
- [ ] `pg_stat_statements` — enable и configure в infra PostgreSQL

### pg_stat_statements Setup
- [ ] Enable `pg_stat_statements` extension в PostgreSQL (если не enabled)
- [ ] Configure monitoring:
  - `track_activities = on`
  - `track_counts = on`
- [ ] Grafana dashboard panel: top N slow queries, query plans, execution times

### Cross-Repo Coordination
- [ ] Dual report: `REPORT.md` в Worker + summary в AprilProfile
- [ ] Query optimizations реализуются в AprilProfile (где БД schema)
- [ ] BFF side: review что queries BFF делает (если есть)

### Documentation
- [ ] `REPORT.md` с query анализом, slow queries, recommended indexes
- [ ] Query execution plans for critical paths

## Не входит в объём
- Schema migration (это AprilProfile задача, если нужны changes)
- Query rewriting (если найдены проблемы — отдельная задача)
- Redis query optimization (Redis не queries SQL)

## Технические ограничения
- BFF stateless — нет прямого DB access в BFF
- AprilProfile owns DB schema — changes там
- Cross-repo task — coordination required (dual report)

## Критерии готовности (acceptance)
- [ ] PostgreSQL `pg_stat_statements` enabled
- [ ] Slow query list with EXPLAIN ANALYZE output
- [ ] Recommended indexes documented
- [ ] Grafana dashboard panel для query monitoring
- [ ] Dual report: Worker REPORT.md + AprilProfile summary
- [ ] No blocking issues (если indexes нужны — задача для AprilProfile)

## Проверка
```bash
# Connect to PostgreSQL (dev)
docker compose -f infra/docker-compose.yml exec postgres psql -U april

-- Check pg_stat_statements
SELECT query, calls, mean_time, total_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;

-- EXPLAIN ANALYZE for key queries
EXPLAIN ANALYZE SELECT * FROM profiles WHERE org_id = 'xxx' ORDER BY created_at DESC LIMIT 20;

-- Check existing indexes
SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public';
```

## Результат в отчёте
Query analysis report, slow queries list, recommended indexes, dual report.
