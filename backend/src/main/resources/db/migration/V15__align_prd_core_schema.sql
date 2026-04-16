-- =============================================
-- V15: Align PRD core schema (orders, routes, tenants, ai logs)
-- =============================================

ALTER TABLE orders
    ADD COLUMN normalized_state VARCHAR(120),
    ADD COLUMN normalized_municipio VARCHAR(120),
    ADD COLUMN normalized_parroquia VARCHAR(120),
    ADD COLUMN normalized_zona VARCHAR(120),
    ADD COLUMN normalized_referencia VARCHAR(500),
    ADD COLUMN normalized_latitude NUMERIC(9, 6),
    ADD COLUMN normalized_longitude NUMERIC(9, 6);

ALTER TABLE routes
    ADD COLUMN optimized_by_ai BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN estimated_distance_km NUMERIC(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE routes
    ADD CONSTRAINT chk_routes_estimated_distance_km
        CHECK (estimated_distance_km >= 0);

ALTER TABLE tenants
    ADD COLUMN suspended_at TIMESTAMP,
    ADD COLUMN suspended_by UUID,
    ADD COLUMN suspension_reason VARCHAR(300),
    ADD COLUMN reactivated_at TIMESTAMP,
    ADD COLUMN reactivated_by UUID,
    ADD COLUMN reactivation_reason VARCHAR(300),
    ADD COLUMN status_changed_at TIMESTAMP NOT NULL DEFAULT now();

ALTER TABLE tenants
    ADD CONSTRAINT chk_tenants_lifecycle_dates
        CHECK (reactivated_at IS NULL OR suspended_at IS NULL OR reactivated_at >= suspended_at);

CREATE TABLE ai_normalization_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    raw_input_address TEXT NOT NULL,
    normalized_output_payload TEXT,
    normalization_confidence NUMERIC(4, 3),
    model_name VARCHAR(120) NOT NULL DEFAULT 'gemini',
    normalization_status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
    corrected_manually BOOLEAN NOT NULL DEFAULT false,
    correction_payload TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),

    CONSTRAINT chk_ai_normalization_logs_confidence
        CHECK (normalization_confidence IS NULL
            OR (normalization_confidence >= 0 AND normalization_confidence <= 1)),
    CONSTRAINT chk_ai_normalization_logs_status
        CHECK (normalization_status IN ('COMPLETED', 'FALLBACK', 'MANUAL_REVIEW', 'MANUAL_CORRECTED', 'FAILED'))
);

CREATE INDEX idx_orders_tenant_review_status_normalized_at
    ON orders(tenant_id, address_review_status, normalized_at DESC);
CREATE INDEX idx_orders_tenant_normalized_state_municipio
    ON orders(tenant_id, normalized_state, normalized_municipio);

CREATE INDEX idx_routes_tenant_optimized_status_created_at
    ON routes(tenant_id, optimized_by_ai, status, created_at DESC);

CREATE INDEX idx_tenants_status_suspended_at
    ON tenants(status, suspended_at DESC);

CREATE INDEX idx_ai_normalization_logs_tenant_order_created_at
    ON ai_normalization_logs(tenant_id, order_id, created_at DESC);
CREATE INDEX idx_ai_normalization_logs_tenant_status_created_at
    ON ai_normalization_logs(tenant_id, normalization_status, created_at DESC);

-- Post-migration verification queries (manual runbook reference)
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'orders' AND column_name LIKE 'normalized_%';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'routes' AND column_name IN ('optimized_by_ai', 'estimated_distance_km');
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'tenants' AND column_name IN ('suspended_at', 'reactivated_at', 'status_changed_at');
-- SELECT indexname FROM pg_indexes WHERE tablename = 'ai_normalization_logs';
