-- =============================================
-- V7: Create payments table
-- =============================================

CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    method              VARCHAR(20) NOT NULL,
    status              VARCHAR(30) NOT NULL,
    amount              DECIMAL(12,2) NOT NULL,
    reference_number    VARCHAR(120) NOT NULL,
    payment_date_time   TIMESTAMP NOT NULL,
    evidence_url        VARCHAR(500) NOT NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP NOT NULL DEFAULT now(),

    CONSTRAINT chk_payment_method CHECK (method IN ('PAGO_MOVIL', 'TRANSFERENCIA')),
    CONSTRAINT chk_payment_status CHECK (status IN ('PENDING_VALIDATION', 'APPROVED', 'REJECTED')),
    CONSTRAINT chk_payment_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_payments_tenant_status_created_at
    ON payments(tenant_id, status, created_at DESC);

CREATE INDEX idx_payments_tenant_created_at
    ON payments(tenant_id, created_at DESC);
