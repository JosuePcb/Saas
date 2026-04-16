-- =============================================
-- V13: Add AI normalization and offline sync foundation
-- =============================================

ALTER TABLE orders
    ADD COLUMN normalized_address VARCHAR(500),
    ADD COLUMN normalization_confidence NUMERIC(4,3),
    ADD COLUMN normalization_fallback_used BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN address_review_status VARCHAR(30),
    ADD COLUMN normalized_at TIMESTAMP;

ALTER TABLE orders
    ADD CONSTRAINT chk_orders_normalization_confidence
        CHECK (normalization_confidence IS NULL OR (normalization_confidence >= 0 AND normalization_confidence <= 1)),
    ADD CONSTRAINT chk_orders_address_review_status
        CHECK (address_review_status IS NULL OR address_review_status IN ('AUTO_ACCEPTED', 'REVIEW_REQUIRED', 'REVIEW_APPROVED', 'REVIEW_REJECTED'));

CREATE TABLE sync_events (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    device_id         UUID NOT NULL,
    client_event_id   VARCHAR(120) NOT NULL,
    route_id          UUID REFERENCES routes(id) ON DELETE SET NULL,
    order_id          UUID REFERENCES orders(id) ON DELETE SET NULL,
    event_type        VARCHAR(40) NOT NULL,
    event_payload     TEXT NOT NULL,
    event_occurred_at TIMESTAMP NOT NULL,
    received_at       TIMESTAMP NOT NULL DEFAULT now(),

    CONSTRAINT chk_sync_events_event_type CHECK (event_type IN ('STATUS_CHANGE', 'POD_UPLOADED', 'LOCATION_PING'))
);

CREATE UNIQUE INDEX ux_sync_events_tenant_device_client_event
    ON sync_events(tenant_id, device_id, client_event_id);
CREATE INDEX idx_sync_events_tenant_route_occurred_at
    ON sync_events(tenant_id, route_id, event_occurred_at DESC);

CREATE TABLE sync_conflicts (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sync_event_id     UUID NOT NULL REFERENCES sync_events(id) ON DELETE CASCADE,
    order_id          UUID REFERENCES orders(id) ON DELETE SET NULL,
    conflict_type     VARCHAR(40) NOT NULL,
    server_resolution TEXT NOT NULL,
    created_at        TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_sync_conflicts_tenant_order_created_at
    ON sync_conflicts(tenant_id, order_id, created_at DESC);
