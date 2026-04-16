-- =============================================
-- V19: Align orders geo coordinate types with JPA model
-- =============================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'orders'
          AND column_name = 'normalized_latitude'
          AND udt_name <> 'float8'
    ) THEN
        ALTER TABLE orders
            ALTER COLUMN normalized_latitude TYPE DOUBLE PRECISION
            USING normalized_latitude::DOUBLE PRECISION;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'orders'
          AND column_name = 'normalized_longitude'
          AND udt_name <> 'float8'
    ) THEN
        ALTER TABLE orders
            ALTER COLUMN normalized_longitude TYPE DOUBLE PRECISION
            USING normalized_longitude::DOUBLE PRECISION;
    END IF;
END $$;

-- Post-migration verification query (manual runbook reference)
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'orders' AND column_name IN ('normalized_latitude', 'normalized_longitude');
