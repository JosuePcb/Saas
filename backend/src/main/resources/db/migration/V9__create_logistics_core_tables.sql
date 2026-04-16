-- =============================================
-- V9: Create logistics core tables
-- =============================================

CREATE TABLE vehicles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plate       VARCHAR(20) NOT NULL,
    state       VARCHAR(20) NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP NOT NULL DEFAULT now(),

    CONSTRAINT chk_vehicle_state CHECK (state IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE'))
);

CREATE UNIQUE INDEX ux_vehicles_tenant_plate ON vehicles(tenant_id, plate);
CREATE INDEX idx_vehicles_tenant_state_created_at ON vehicles(tenant_id, state, created_at DESC);

CREATE TABLE orders (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    tracking_code  VARCHAR(40) NOT NULL,
    status         VARCHAR(30) NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP NOT NULL DEFAULT now(),

    CONSTRAINT chk_order_status CHECK (status IN ('CREATED', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'))
);

CREATE UNIQUE INDEX ux_orders_tenant_tracking_code ON orders(tenant_id, tracking_code);
CREATE INDEX idx_orders_tenant_status_created_at ON orders(tenant_id, status, created_at DESC);

CREATE TABLE routes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id  UUID NOT NULL REFERENCES vehicles(id),
    status      VARCHAR(20) NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP NOT NULL DEFAULT now(),

    CONSTRAINT chk_route_status CHECK (status IN ('DRAFT', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'))
);

CREATE INDEX idx_routes_tenant_status_created_at ON routes(tenant_id, status, created_at DESC);
CREATE INDEX idx_routes_vehicle_id ON routes(vehicle_id);

CREATE TABLE route_stops (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id    UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    order_id    UUID NOT NULL REFERENCES orders(id),
    stop_order  INT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),

    CONSTRAINT uq_route_stops_route_stop_order UNIQUE (route_id, stop_order)
);

CREATE INDEX idx_route_stops_route_stop_order ON route_stops(route_id, stop_order);
CREATE INDEX idx_route_stops_order_id ON route_stops(order_id);

CREATE TABLE order_status_history (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    status      VARCHAR(30) NOT NULL,
    changed_at  TIMESTAMP NOT NULL DEFAULT now(),

    CONSTRAINT chk_order_status_history_status CHECK (status IN ('CREATED', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'))
);

CREATE INDEX idx_order_status_history_order_changed_at ON order_status_history(order_id, changed_at DESC);
CREATE INDEX idx_order_status_history_tenant_changed_at ON order_status_history(tenant_id, changed_at DESC);
