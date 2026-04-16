-- =============================================
-- V4: Seed SuperAdmin user
-- =============================================
-- SuperAdmin credentials for development/staging:
--   Email:    superadmin@saas.com
--   Password: SuperAdmin123!
--   Role:     SUPER_ADMIN (no tenant — global access)
--
--  IMPORTANT: This seeded user is for local/dev only. The password hash is moved
--  to an environment-driven migration (see V5) to avoid storing secrets in SQL.
--  Override or remove this user in production environments.

INSERT INTO users (id, tenant_id, email, password_hash, nombre, apellido, telefono, role, activo)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    NULL, -- SuperAdmin has no tenant (global access)
    'superadmin@saas.com',
    'DUMMY_HASH_REPLACED_BY_V5',
    'Super',
    'Admin',
    '+584140000000',
    'SUPER_ADMIN',
    true
);
