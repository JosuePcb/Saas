-- =============================================
-- V1: Create tenants and plans tables
-- =============================================

-- Plans table (no tenant_id, global)
CREATE TABLE plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre          VARCHAR(100) NOT NULL,
    precio_usd      DECIMAL(10,2) NOT NULL,
    max_choferes    INT NOT NULL,
    max_ordenes_mes INT NOT NULL,
    max_vehiculos   INT NOT NULL,
    tiene_ia        BOOLEAN NOT NULL DEFAULT false,
    activo          BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- Tenants table
CREATE TABLE tenants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre          VARCHAR(200) NOT NULL,
    rif             VARCHAR(20) NOT NULL UNIQUE,
    status          VARCHAR(20) NOT NULL DEFAULT 'TRIAL',
    plan_id         UUID REFERENCES plans(id),
    fecha_registro  TIMESTAMP NOT NULL DEFAULT now(),
    fecha_corte     TIMESTAMP,
    logo_url        VARCHAR(500),
    zona_operacion  VARCHAR(200),
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now(),

    CONSTRAINT chk_tenant_status CHECK (status IN ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED'))
);

-- Seed default plans
INSERT INTO plans (id, nombre, precio_usd, max_choferes, max_ordenes_mes, max_vehiculos, tiene_ia) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Starter', 15.00, 3, 300, 2, false),
    ('a0000000-0000-0000-0000-000000000002', 'Growth', 35.00, 10, 1000, 5, true),
    ('a0000000-0000-0000-0000-000000000003', 'Pro', 75.00, 999999, 999999, 999999, true);
