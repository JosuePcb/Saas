-- =============================================
-- V12: Add route driver and stop ETA columns
-- =============================================

ALTER TABLE routes
    ADD COLUMN driver_id UUID;

CREATE INDEX idx_routes_tenant_driver_status_created_at ON routes(tenant_id, driver_id, status, created_at DESC);

ALTER TABLE route_stops
    ADD COLUMN eta TIMESTAMP;
