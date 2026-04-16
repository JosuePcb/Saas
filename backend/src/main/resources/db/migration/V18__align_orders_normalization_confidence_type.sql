-- =============================================
-- V18: Align orders normalization confidence type with JPA model
-- =============================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'orders'
          AND column_name = 'normalization_confidence'
          AND udt_name <> 'float8'
    ) THEN
        ALTER TABLE orders
            ALTER COLUMN normalization_confidence TYPE DOUBLE PRECISION
            USING normalization_confidence::DOUBLE PRECISION;
    END IF;
END $$;

-- Post-migration verification query (manual runbook reference)
-- SELECT data_type FROM information_schema.columns
-- WHERE table_name = 'orders' AND column_name = 'normalization_confidence';
