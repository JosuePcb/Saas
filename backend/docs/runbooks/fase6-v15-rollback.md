# Fase 6 V15/V16 rollback runbook

## Scope

This runbook covers rollback safety for:

- `V15__align_prd_core_schema.sql`
- `V16__backfill_prd_core_schema_compatibility.sql`

Flyway is forward-only in this project. Rollback is executed with a new compensating migration (for example `V17__rollback_v15_v16.sql`) and never by deleting entries from `flyway_schema_history`.

## Go/No-Go checkpoints

### 1) Before migrate

Run these checks:

```sql
SELECT version, description, success
FROM flyway_schema_history
ORDER BY installed_rank DESC
LIMIT 5;

SELECT count(*) AS auth_users FROM users;
SELECT count(*) AS logistics_orders FROM orders;
SELECT count(*) AS tenants_count FROM tenants;
```

Go if:

- Last Flyway row is successful.
- Baseline auth/logistics row counts are stable.

No-go if:

- Pending failed migration rows exist.
- Authentication or tenant data is already inconsistent.

### 2) After migrate

Run these checks:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'orders'
  AND column_name IN (
      'normalized_state',
      'normalized_municipio',
      'normalized_parroquia',
      'normalized_zona',
      'normalized_referencia',
      'normalized_latitude',
      'normalized_longitude'
  );

SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'routes'
  AND column_name IN ('optimized_by_ai', 'estimated_distance_km');

SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tenants'
  AND column_name IN ('suspended_at', 'reactivated_at', 'status_changed_at');

SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'ai_normalization_logs';
```

Go if:

- Expected columns and indexes exist.
- Application health endpoint and auth smoke check stay green.

No-go if:

- Missing columns/indexes or auth endpoints regress to 5xx.

### 3) Rollback execute (compensating migration)

If rollback is required, create and run a compensating migration with SQL equivalent to the following (ordered to satisfy dependencies):

```sql
DROP INDEX IF EXISTS idx_ai_normalization_logs_tenant_status_created_at;
DROP INDEX IF EXISTS idx_ai_normalization_logs_tenant_order_created_at;
DROP INDEX IF EXISTS idx_tenants_status_suspended_at;
DROP INDEX IF EXISTS idx_routes_tenant_optimized_status_created_at;
DROP INDEX IF EXISTS idx_orders_tenant_normalized_state_municipio;
DROP INDEX IF EXISTS idx_orders_tenant_review_status_normalized_at;

DROP TABLE IF EXISTS ai_normalization_logs;

ALTER TABLE tenants
    DROP CONSTRAINT IF EXISTS chk_tenants_lifecycle_dates;

ALTER TABLE routes
    DROP CONSTRAINT IF EXISTS chk_routes_estimated_distance_km;

ALTER TABLE tenants
    DROP COLUMN IF EXISTS suspended_at,
    DROP COLUMN IF EXISTS suspended_by,
    DROP COLUMN IF EXISTS suspension_reason,
    DROP COLUMN IF EXISTS reactivated_at,
    DROP COLUMN IF EXISTS reactivated_by,
    DROP COLUMN IF EXISTS reactivation_reason,
    DROP COLUMN IF EXISTS status_changed_at;

ALTER TABLE routes
    DROP COLUMN IF EXISTS optimized_by_ai,
    DROP COLUMN IF EXISTS estimated_distance_km;

ALTER TABLE orders
    DROP COLUMN IF EXISTS normalized_state,
    DROP COLUMN IF EXISTS normalized_municipio,
    DROP COLUMN IF EXISTS normalized_parroquia,
    DROP COLUMN IF EXISTS normalized_zona,
    DROP COLUMN IF EXISTS normalized_referencia,
    DROP COLUMN IF EXISTS normalized_latitude,
    DROP COLUMN IF EXISTS normalized_longitude;
```

### 4) Post-rollback validate

```sql
SELECT to_regclass('public.ai_normalization_logs') IS NULL AS ai_logs_removed;

SELECT count(*) = 0 AS orders_columns_removed
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'orders'
  AND column_name IN (
      'normalized_state',
      'normalized_municipio',
      'normalized_parroquia',
      'normalized_zona',
      'normalized_referencia',
      'normalized_latitude',
      'normalized_longitude'
  );

SELECT count(*) = 0 AS routes_columns_removed
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'routes'
  AND column_name IN ('optimized_by_ai', 'estimated_distance_km');
```

Final smoke checks:

- `POST /api/auth/login` returns expected `200/401` semantics.
- Protected endpoint without token still returns `401`.
- Protected endpoint with insufficient role still returns `403`.
