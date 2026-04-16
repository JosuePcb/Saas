-- =============================================
-- V16: Deterministic backfill and compatibility defaults for V15
-- =============================================

UPDATE routes
SET optimized_by_ai = false
WHERE optimized_by_ai IS NULL;

UPDATE routes
SET estimated_distance_km = 0
WHERE estimated_distance_km IS NULL;

UPDATE tenants
SET status_changed_at = COALESCE(status_changed_at, updated_at, created_at, now())
WHERE status_changed_at IS NULL;

UPDATE orders
SET normalized_referencia = LEFT(normalized_address, 500)
WHERE normalized_referencia IS NULL
  AND normalized_address IS NOT NULL;

-- Compatibility safety net for historical statuses that may have drifted pre-constraint
UPDATE orders
SET address_review_status = 'REVIEW_REQUIRED'
WHERE address_review_status IS NOT NULL
  AND address_review_status NOT IN ('AUTO_ACCEPTED', 'REVIEW_REQUIRED', 'REVIEW_APPROVED', 'REVIEW_REJECTED');

-- Post-migration verification queries (manual runbook reference)
-- SELECT COUNT(*) FROM routes WHERE optimized_by_ai IS NULL OR estimated_distance_km IS NULL;
-- SELECT COUNT(*) FROM tenants WHERE status_changed_at IS NULL;
-- SELECT COUNT(*) FROM orders WHERE normalized_address IS NOT NULL AND normalized_referencia IS NULL;
