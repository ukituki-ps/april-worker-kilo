# Оптимизация DB Query — Baseline Анализ

> **Дата:** 2026-05-12
> **Контекст:** Phase 9 Performance трек, задача 063
> **Охват:** PostgreSQL 17, AprilProfile schema (BFF stateless, не хранит данные напрямую)
> **Методология:** Static code analysis SQL queries в Go-коде AprilProfile + анализ индексов из Atlas миграций

---

## 1. Инвентаризация schema

### 1.1 Таблицы

| Таблица | PK | FK | Примечание |
|---------|-----|-----|------------|
| `tenants` | `id` (uuid) | — | Мульти-тенантная изоляция |
| `entity_type_families` | `id` | `(tenant_id)` -> tenants | Семейство типа сущности |
| `entity_type_revisions` | `id` | `(tenant_id, family_id)` -> families | Immutable schema публикации |
| `entity_type_drafts` | `(tenant_id, family_id)` | `(tenant_id, family_id)` -> families | Черновики схем |
| `entities` | `entity_id` | `(tenant_id, entity_type_id)` -> families, `(tenant_id, bound_entity_type_revision_id)` -> revisions | Идентичность профиля |
| `profile_versions` | `id` | `(tenant_id, entity_id)` -> entities | Append-only версии профилей |
| `external_id_mappings` | `(tenant_id, source_system, external_id)` | `(tenant_id, entity_id)` -> entities | Внешние ключи |
| `profile_field_conflicts` | `id` | `(tenant_id, entity_id)` -> entities | Очередь конфликтов authority |
| `admin_audit_log` | `id` | `(tenant_id)` -> tenants, `(conflict_id)` -> conflicts | Аудит admin-операций |
| `profile_outbox` | `id` | `(tenant_id, entity_id)` -> entities | Transactional outbox |
| `source_sync_checkpoints` | `(tenant_id, source_system)` | `(tenant_id)` -> tenants | Cursor синка |
| `source_sync_applied_events` | `(tenant_id, source_system, event_id)` | `(tenant_id)` -> tenants | Журнал применённых событий |

---

## 2. Инвентаризация существующих индексов

| Индекс | Таблица | Столбцы | Тип |
|--------|---------|---------|-----|
| PK | tenants | `id` | btree |
| PK | entity_type_families | `id` | btree |
| UNIQUE | entity_type_families | `(tenant_id, namespace, code)` | btree |
| UNIQUE | entity_type_families | `(tenant_id, id)` | btree |
| `entity_type_families_tenant_id_idx` | entity_type_families | `tenant_id` | btree |
| PK | entity_type_revisions | `id` | btree |
| UNIQUE | entity_type_revisions | `(tenant_id, family_id, revision_no)` | btree |
| UNIQUE | entity_type_revisions | `(tenant_id, id)` | btree |
| `entity_type_revisions_tenant_family_idx` | entity_type_revisions | `(tenant_id, family_id)` | btree |
| PK | entity_type_drafts | `(tenant_id, family_id)` | btree |
| PK | entities | `entity_id` | btree |
| UNIQUE | entities | `(tenant_id, entity_id)` | btree |
| UNIQUE | profile_versions | `(entity_id, version)` | btree |
| `entities_tenant_id_idx` | entities | `tenant_id` | btree |
| `entities_bound_revision_idx` | entities | `(tenant_id, bound_entity_type_revision_id)` | btree |
| `profile_versions_tenant_entity_idx` | profile_versions | `(tenant_id, entity_id)` | btree |
| `external_id_mappings_entity_idx` | external_id_mappings | `(tenant_id, entity_id)` | btree |
| `profile_field_conflicts_tenant_status_idx` | profile_field_conflicts | `(tenant_id, status)` | btree |
| `profile_field_conflicts_tenant_entity_idx` | profile_field_conflicts | `(tenant_id, entity_id)` | btree |
| `admin_audit_log_tenant_created_idx` | admin_audit_log | `(tenant_id, created_at DESC)` | btree |
| `profile_outbox_tenant_status_idx` | profile_outbox | `(tenant_id, status)` | btree |
| `profile_outbox_tenant_created_idx` | profile_outbox | `(tenant_id, created_at)` | btree |
| `profile_outbox_pending_retry_idx` | profile_outbox | `(status, next_retry_at, created_at)` WHERE `status='pending'` | btree partial |
| PK | source_sync_checkpoints | `(tenant_id, source_system)` | btree |
| PK | source_sync_applied_events | `(tenant_id, source_system, event_id)` | btree |
| `source_sync_applied_events_..._idx` | source_sync_applied_events | `(tenant_id, source_system, external_id)` | btree |

---

## 3. Аудит SQL запросов

### 3.1 Критические запросы профиля

#### Query P1: List Entities (pagination с курсором)

**Файл:** `internal/profiles/service.go:416-438`

```sql
SELECT e.entity_id, e.entity_type_id, pv.version, pv.document, pv.created_at
FROM entities e
JOIN LATERAL (
    SELECT version, document, created_at
    FROM profile_versions
    WHERE tenant_id = e.tenant_id AND entity_id = e.entity_id
    ORDER BY version DESC
    LIMIT 1
) pv ON true
WHERE e.tenant_id = $1
  AND ($2 = '' OR e.entity_type_id = $2::uuid)
  AND ($3 = '' OR e.entity_id::text ILIKE '%' || $3 || '%' OR pv.document::text ILIKE '%' || $3 || '%')
ORDER BY pv.created_at DESC, e.entity_id ASC
LIMIT $N
```

**Проблемы:**

| # | Угроза | Обоснование |
|---|--------|--------------------------|
| P1.1 | **JOIN LATERAL N-раз** | Для каждой строки `entities` выполняется подзапрос в `profile_versions` с `ORDER BY version DESC LIMIT 1`. Индекс `(tenant_id, entity_id)` ускоряет фильтрацию, но **не содержит `version DESC`** — сортировка происходит в памяти (Sort node в плане). |
| P1.2 | **ILIKE на document::text** | `pv.document::text ILIKE '%' ... '%'` — **полный sequential scan** по `profile_versions`. Приведение jsonb к text обходит любой GIN/GIST индекс. При search активен — критическая узкая горловина. |
| P1.3 | **Отсутствие индекса для сортировки** | `ORDER BY pv.created_at DESC, e.entity_id ASC` не покрывается существующими индексами — Sort node на результат join. |

#### Query P2: Count Total (total_count в List)

**Файл:** `internal/profiles/service.go:717-736`

```sql
SELECT COUNT(*)
FROM entities e
JOIN LATERAL (
    SELECT document
    FROM profile_versions
    WHERE tenant_id = e.tenant_id AND entity_id = e.entity_id
    ORDER BY version DESC
    LIMIT 1
) pv ON true
WHERE e.tenant_id = $1
  AND ($2 = '' OR e.entity_type_id = $2::uuid)
  AND ($3 = '' OR e.entity_id::text ILIKE '%' || $3 || '%' OR pv.document::text ILIKE '%' || $3 || '%')
```

**Проблемы:**

| # | Угроза | Обоснование |
|---|--------|--------------------------|
| P2.1 | **Дублирует P1** | Те же проблемы JOIN LATERAL + ILIKE, но **без LIMIT** — всегда сканирует ВСЕ entity. |
| P2.2 | **Выполняется после извлечения списка** | Сначала берётся страница, потом отдельно `COUNT(*)` — паттерн двойного выполнения тяжёлого запроса. |

#### Query P3: GetCurrent (get entity by ID)

**Файл:** `internal/profiles/service.go:260-282`

```sql
SELECT e.entity_id, e.entity_type_id, pv.version, pv.document, pv.created_at
FROM entities e
JOIN LATERAL (
    SELECT version, document, created_at
    FROM profile_versions
    WHERE tenant_id = e.tenant_id AND entity_id = e.entity_id
    ORDER BY version DESC
    LIMIT 1
) pv ON true
WHERE e.tenant_id = $1 AND e.entity_id = $2
```

**Проблемы:**

| # | Угроза | Обоснование |
|---|--------|--------------------------|
| P3.1 | **JOIN LATERAL для одного entity** | При единственном entity LATERAL вырождается в обычный lookup, но без индекса `(tenant_id, entity_id, version DESC)` сортировка всё ещё unnecessary. |

#### Query P4: Load External Refs (N+1 pattern)

**Файл:** `internal/profiles/service.go:507-531`

```sql
SELECT source_system, external_id
FROM external_id_mappings
WHERE tenant_id = $1 AND entity_id = $2
ORDER BY source_system, external_id
```

**Проблемы:**

| # | Угроза | Обоснование |
|---|--------|--------------------------|
| P4.1 | **N+1** | Вызывается из `getByQuery()` для КАЖДОГО get профиля. При batch-операциях или списке профилей — один query на entity. |

#### Query P5: Get Version by Number

**Файл:** `internal/profiles/service.go:284-311`

```sql
SELECT e.entity_id, e.entity_type_id, pv.version, pv.document, pv.created_at
FROM entities e
JOIN profile_versions pv ON pv.tenant_id = e.tenant_id AND pv.entity_id = e.entity_id
WHERE e.tenant_id = $1 AND e.entity_id = $2 AND pv.version = $3
```

**Проблемы:** Базовый JOIN — работает достаточно быстро при существующих индексах.

#### Query P6: GetCurrentByExternalRef

**Файл:** `internal/profiles/service.go:314-342`

```sql
SELECT e.entity_id, e.entity_type_id, pv.version, pv.document, pv.created_at
FROM external_id_mappings m
JOIN entities e ON e.tenant_id = m.tenant_id AND e.entity_id = m.entity_id
JOIN LATERAL (
    SELECT version, document, created_at
    FROM profile_versions
    WHERE tenant_id = e.tenant_id AND entity_id = e.entity_id
    ORDER BY version DESC
    LIMIT 1
) pv ON true
WHERE m.tenant_id = $1 AND m.source_system = $2 AND m.external_id = $3
```

**Проблемы:**

| # | Угроза | Обоснование |
|---|--------|--------------------------|
| P6.1 | **JOIN LATERAL** | Те же проблемы, что в P1/P3. |

---

### 3.2 Запросы entity types

#### Query E1: List Entity Types (Catalog.List)

**Файл:** `internal/entitytypes/catalog.go:103-145`

```sql
SELECT f.id, f.namespace, f.code, d.draft_schema_json, d.draft_schema_version,
       lr.revision_no, lr.schema_json, lr.published_at, f.created_at
FROM entity_type_families f
JOIN entity_type_drafts d ON d.tenant_id = f.tenant_id AND d.family_id = f.id
LEFT JOIN LATERAL (
    SELECT r.revision_no, r.schema_json, r.published_at
    FROM entity_type_revisions r
    WHERE r.tenant_id = f.tenant_id AND r.family_id = f.id
    ORDER BY r.revision_no DESC
    LIMIT 1
) lr ON TRUE
WHERE f.tenant_id = $1
ORDER BY f.created_at DESC
```

**Проблемы:**

| # | Угроза | Обоснование |
|---|--------|--------------------------|
| E1.1 | **JOIN LATERAL на entity_type_revisions** | Без индекса `(tenant_id, family_id, revision_no DESC)` — сортировка в памяти. Индекс `(tenant_id, family_id)` ускоряет фильтрацию, но не сортировку. |
| E1.2 | **Масштаб управляем** | entity_type_families — каталог типов (обычно меньше 100 на tenant) — LATERAL не критичен. |

#### Query E2: Get Record

**Файл:** `internal/entitytypes/catalog.go:213-245`

Такой же паттерн как E1, но для одного family. Работает приемлемо.

---

### 3.3 Запросы async jobs

#### Query A1: Outbox Batch

**Файл:** `internal/asyncjobs/handlers.go:73-82`

```sql
SELECT id::text, tenant_id::text, payload
FROM profile_outbox
WHERE status = 'pending'
  AND (next_retry_at IS NULL OR next_retry_at <= now())
ORDER BY created_at ASC
LIMIT $1
FOR UPDATE SKIP LOCKED
```

**Проблемы:**

| # | Угроза | Обоснование |
|---|--------|--------------------------|
| A1.1 | **Partial index уже есть** | `profile_outbox_pending_retry_idx` покрывает `WHERE status = 'pending'`. Но условие `next_retry_at <= now()` может не использовать индекс полностью — возможен index scan + filter. |
| A1.2 | **Дизайн без tenant фильтра** | Async jobs читает все tenants без фильтрации — это по дизайну. |

#### Query A2: Source Sync — list tenants

**Файл:** `internal/asyncjobs/sync.go:131-147`

```sql
SELECT id::text FROM tenants ORDER BY id
```

**Проблемы:** `tenants` обычно мало строк (меньше 1000) — не критично.

---

### 3.4 Admin запросы

#### Query AD1: ListOpenConflicts

**Файл:** `internal/profiles/service_admin.go:23-74`

```sql
SELECT id, entity_id, status, namespace, field_key, existing_value, ...
FROM profile_field_conflicts
WHERE tenant_id = $1 AND status = 'open'
ORDER BY created_at ASC
```

**Проблемы:** Индекс `(tenant_id, status)` покрывает WHERE, но `ORDER BY created_at ASC` не покрыт. Индекс `(tenant_id, status, created_at)` решает проблему.

#### Query AD2: MergeEntityProfiles

**Файл:** `internal/profiles/service_admin.go:204-222`

```sql
SELECT entity_id, entity_type_id
FROM entities
WHERE tenant_id = $1 AND entity_id IN ($2, $3)
ORDER BY entity_id
FOR UPDATE
```

IN(2 uuid) — точечный lookup по PK, быстро.

---

### 3.5 Upgrade запросы

#### Query U1: BatchUpgrade — list entities behind latest

**Файл:** `internal/profiles/service_upgrade.go:265-276`

```sql
SELECT e.entity_id
FROM entities e
JOIN entity_type_revisions cur
    ON cur.tenant_id = e.tenant_id AND cur.id = e.bound_entity_type_revision_id
WHERE e.tenant_id = $1
    AND e.entity_type_id = $2::uuid
    AND cur.revision_no < $3
ORDER BY e.entity_id
LIMIT $4
```

**Проблемы:**

| # | Угроза | Обоснование |
|---|--------|--------------------------|
| U1.1 | **JOIN entity_type_revisions** | Индекс `(tenant_id, bound_entity_type_revision_id)` помогает для FK join. Но filter `cur.revision_no < $3` не через индекс. |
| U1.2 | **Нет составного индекса** | `(tenant_id, entity_type_id, bound_entity_type_revision_id)` был бы идеален для WHERE clause. |

---

## 4. Рекомендации по индексам

### 4.1 КРИТИЧЕСКИЕ (высокий приоритет)

#### R1: profile_versions — сортировка по version DESC

```sql
CREATE INDEX profile_versions_entity_version_desc_idx
    ON profile_versions (tenant_id, entity_id, version DESC);
```

**Обоснование:** Покрывает самый частый паттерн: `WHERE tenant_id = ? AND entity_id = ? ORDER BY version DESC LIMIT 1`. Существующий индекс `(tenant_id, entity_id)` покрывает WHERE, но не ORDER BY — сортировка происходит в памяти. Добавление `version DESC` делает индекс cover-индексом для LATERAL подзапроса, устраняя Sort node.

**Влияние:** Query P1, P2, P3, P6 (все используют `ORDER BY version DESC LIMIT 1`).

#### R2: entities — pagination по tenant + entity_type + created_at

```sql
CREATE INDEX entities_tenant_type_created_idx
    ON entities (tenant_id, entity_type_id, created_at DESC, entity_id ASC);
```

**Обоснование:** Покрывает WHERE + ORDER BY в Query P1 (list entities). Составной индекс по `(tenant_id, entity_type_id, created_at DESC, entity_id ASC)` покрывает полную WHERE clause + сортировку.

**Примечание:** `pv.created_at` — это created_at latest version, а не `entities.created_at`. Полное совпадение невозможно без индекса на CTE/LATERAL.

#### R3: profile_field_conflicts — sort by created_at при filter status

```sql
CREATE INDEX profile_field_conflicts_tenant_status_created_idx
    ON profile_field_conflicts (tenant_id, status, created_at ASC);
```

**Обоснование:** Заменяет существующий `(tenant_id, status)` — добавляет `created_at` для ORDER BY в Query AD1.

### 4.2 СРЕДНИЕ (средний приоритет)

#### R4: entities — составной индекс для batch upgrade

```sql
CREATE INDEX entities_tenant_type_revision_idx
    ON entities (tenant_id, entity_type_id, bound_entity_type_revision_id);
```

**Обоснование:** Query U1: `WHERE tenant_id = $1 AND entity_type_id = $2::uuid` + JOIN на `bound_entity_type_revision_id`.

#### R5: profile_versions — GIN индекс для search по document

```sql
CREATE INDEX profile_versions_document_gin_idx
    ON profile_versions USING gin (document);
```

**Примечание:** GIN индекс на jsonb может быть значительно больше таблицы. На production оценить соотношение query gain vs storage cost.

### 4.3 НИЗКИЕ (низкий приоритет)

#### R6: outbox — улучшенный partial index для async jobs

```sql
CREATE INDEX profile_outbox_pending_for_batch_idx
    ON profile_outbox (created_at ASC)
    WHERE status = 'pending' AND (next_retry_at IS NULL OR next_retry_at <= now());
```

---

## 5. pg_stat_statements

### 5.1 Текущее состояние

| Настройка | Статус | Где |
|-----------|--------|-----|
| `shared_preload_libraries = 'pg_stat_statements'` | **Не настроена** | postgres docker-compose AprilProfile |
| `pg_stat_statements` extension | **Не создана** | postgres DB |
| Grafana panel для SQL monitoring | **Не существует** | infra/observability/grafana |

### 5.2 Рекомендации для AprilProfile

**Шаг 1:** Добавить `shared_preload_libraries` в docker-compose:

```yaml
# docker-compose.yml, секция postgres:
environment:
  POSTGRES_SHARED_PRELOAD_LIBRARIES: "pg_stat_statements"
```

Или через custom postgresql.conf:

```conf
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.track = all
pg_stat_statements.max = 10000
```

**Шаг 2:** Создать extension в БД:

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

**Шаг 3:** Конфигурация:

```conf
track_activities = on    # уже по умолчанию
track_counts = on        # уже по умолчанию
pg_stat_statements.track = all
pg_stat_statements.max = 10000
pg_stat_statements.track_utility = on
```

**Шаг 4:** Мониторинг query:

```sql
-- Top N slow queries по среднему времени
SELECT query, calls, mean_time, total_time, rows,
       100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Queries с наибольшим количеством вызовов
SELECT query, calls, total_time
FROM pg_stat_statements
ORDER BY calls DESC
LIMIT 10;

-- Queries с full table scans
SELECT query, calls, mean_time
FROM pg_stat_statements
WHERE shared_blks_hit < shared_blks_read * 0.5
ORDER BY total_time DESC
LIMIT 10;
```

---

## 6. Grafana Dashboard Panel

### 6.1 Рекомендуемый dashboard

**Файл:** `infra/observability/grafana/dashboards/april-postgres-query-performance.json`

**Панели:**

| # | Имя панели | Тип | Источник данных |
|---|------------|-----|----------------|
| 1 | Top 10 Slow Queries (mean_time) | Table | pg_stat_statements через postgres_exporter |
| 2 | Query Hit Ratio | Gauge | `shared_blks_hit / (shared_blks_hit + shared_blks_read)` |
| 3 | Total Query Time Distribution | Histogram | `total_time` по queries |
| 4 | Query Calls Rate | Time series | rate вызовов по query fingerprint |
| 5 | Full Table Scans | Alert | queries где `shared_blks_read > 0` и hit ratio меньше 50% |

### 6.2 Prometheus scrape target

Добавить в `prometheus.yml`:

```yaml
- job_name: 'postgres'
  static_configs:
    - targets: ['postgres:5432']
  metrics_path: '/metrics'
  params:
    'collect[]':
      - 'pg_stat_statements'
```

Требуется `postgres_exporter` с опцией `PG_EXPORT_STAT_STATEMENTS=true`.

---

## 7. Паттерны N+1

### 7.1 Найдено

| Паттерн | Локация | Частота |
|---------|---------|---------|
| loadExternalRefs() после каждого get profile | `service.go:507` | Каждый GET profile |
| getCurrent() после batch operations | `service_admin.go:310`, `service_admin.go:174` | Каждый merge/resolve |
| getRecord() после create/save draft | `catalog.go:100`, `catalog.go:147` | Каждый create/publish |

### 7.2 Рекомендации

1. **Batch load external refs** — изменить `getByQuery` на optional JOIN для external_id_mappings (когда нужно).
2. **Return snapshot from transaction** — вместо повторного `GetCurrent()` после commit, возвращать snapshot, собранный в tx.
3. **Draft get after save** — кешировать draft в tx, вернуть без дополнительного query.

---

## 8. EXPLAIN ANALYZE шаблоны для проверки

### 8.1 Критические query для live check

```sql
-- P1: List entities с pagination (без search, наиболее частый кейс)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT e.entity_id, e.entity_type_id, pv.version, pv.document, pv.created_at
FROM entities e
JOIN LATERAL (
    SELECT version, document, created_at
    FROM profile_versions
    WHERE tenant_id = e.tenant_id AND entity_id = e.entity_id
    ORDER BY version DESC LIMIT 1
) pv ON true
WHERE e.tenant_id = '<tenant-uuid>'
  AND e.entity_type_id = '<type-uuid>'
ORDER BY pv.created_at DESC, e.entity_id ASC
LIMIT 21;

-- P1b: С search — ожидаемо медленный
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT e.entity_id, e.entity_type_id, pv.version, pv.document, pv.created_at
FROM entities e
JOIN LATERAL (
    SELECT version, document, created_at
    FROM profile_versions
    WHERE tenant_id = e.tenant_id AND entity_id = e.entity_id
    ORDER BY version DESC LIMIT 1
) pv ON true
WHERE e.tenant_id = '<uuid>'
  AND e.entity_id::text ILIKE '%term%'
ORDER BY pv.created_at DESC, e.entity_id ASC
LIMIT 21;

-- P2: COUNT с LATERAL
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT COUNT(*)
FROM entities e
JOIN LATERAL (
    SELECT document FROM profile_versions
    WHERE tenant_id = e.tenant_id AND entity_id = e.entity_id
    ORDER BY version DESC LIMIT 1
) pv ON true
WHERE e.tenant_id = '<uuid>';

-- P3: Simple get by entity_id
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT e.entity_id, e.entity_type_id, pv.version, pv.document, pv.created_at
FROM entities e
JOIN LATERAL (
    SELECT version, document, created_at
    FROM profile_versions
    WHERE tenant_id = e.tenant_id AND entity_id = e.entity_id
    ORDER BY version DESC LIMIT 1
) pv ON true
WHERE e.tenant_id = '<uuid>' AND e.entity_id = '<entity-uuid>';

-- E1: List entity types
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT f.id, f.namespace, f.code, d.draft_schema_json, d.draft_schema_version,
       lr.revision_no, lr.schema_json, lr.published_at, f.created_at
FROM entity_type_families f
JOIN entity_type_drafts d ON d.tenant_id = f.tenant_id AND d.family_id = f.id
LEFT JOIN LATERAL (
    SELECT r.revision_no, r.schema_json, r.published_at
    FROM entity_type_revisions r
    WHERE r.tenant_id = f.tenant_id AND r.family_id = f.id
    ORDER BY r.revision_no DESC LIMIT 1
) lr ON TRUE
WHERE f.tenant_id = '<uuid>'
ORDER BY f.created_at DESC;
```

### 8.2 Что искать в планах

| Паттерн | Ожидание до оптимизации | Ожидание после |
|---------|------------------------|----------------|
| LATERAL subquery на profile_versions | `Sort -> Index Scan` на `(tenant_id, entity_id)` | `Index Scan` на `(tenant_id, entity_id, version DESC)` без Sort |
| List entities sort | `Sort on join result` | `Index Scan` использует индекс для order |
| ILIKE search | `Seq Scan` на profile_versions | Без изменения (требуется переписать query) |
| COUNT(*) с LATERAL | Seq scan + LATERAL на все rows | Улучшается с R1 (меньше time на subquery) |

---

## 9. BFF Query Review

Hub BFF stateless — не делает прямых DB запросов. Все данные получает от AprilProfile API:

| BFF Route | Downstream | Impact |
|-----------|-----------|--------|
| `/api/v1/admin/profile/**` | Reverse proxy -> AprilProfile endpoints | BFF не влияет на SQL |
| `/api/v1/entities/**` | Через proxy -> AprilProfile `/v1/entities/**` | BFF transparent proxy |
| Aggregation (Dashboard, Home, Summary) | Fan-out к downstream services | Async, без DB |

**Вывод:** Оптимизация SQL затрагивает только AprilProfile. BFF не требует изменений.

---

## 10. Резюме рекомендаций

| # | Рекомендация | Приоритет | Влияние | Сложность |
|---|-------------|-----------|---------|-----------|
| R1 | `profile_versions (tenant_id, entity_id, version DESC)` | **Высокий** | Все LATERAL subquery | Низкая (1 индекс) |
| R2 | `entities (tenant_id, entity_type_id, created_at DESC, entity_id ASC)` | **Высокий** | List entities sort + pagination | Низкая (1 индекс) |
| R3 | `profile_field_conflicts (tenant_id, status, created_at ASC)` | Средний | List conflicts sort | Низкая |
| R4 | `entities (tenant_id, entity_type_id, bound_entity_type_revision_id)` | Средний | Batch upgrade JOIN | Низкая |
| R5 | GIN на `profile_versions.document` | Низкий | Search по document | Средняя (storage cost) |
| R6 | Улучшенный partial index на outbox | Низкий | Async jobs batch | Низкая |
| PG1 | Включить `pg_stat_statements` | **Высокий** | Monitoring baseline | Низкая |
| PG2 | Grafana panel для query monitoring | **Высокий** | Visibility | Средняя |
| Q1 | Улучшить COUNT(*) стратегию (approx count / no-count pagination) | Средний | Убирает double heavy query | Высокая (code change) |
| Q2 | Устранить N+1 loadExternalRefs | Средний | Каждый GET profile делает 2-й query | Средняя (code change) |

---

## 11. Риски

| Риск | Влияние | Митигация |
|------|---------|-----------|
| GIN индекс увеличивает размер БД на 20-40% | Storage cost | Начать без GIN, включить только при подтверждённой нужде |
| Добавление индекса на большие таблицы блокирует writes | Downtime при create index | Использовать `CREATE INDEX CONCURRENTLY` в production |
| ILIKE search по document нельзя убрать без переписывания query | Search остаётся медленным | Отложить до отдельной задачи (query rewrite) |
| COUNT(*) с LATERAL — O(N) на каждый list request | Latency при большом N | Использовать approximate count или убрать total_count |
