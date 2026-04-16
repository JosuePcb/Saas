-- =============================================
-- V5: Seed/Update SuperAdmin user via env-provided hash
-- =============================================
-- This migration replaces the placeholder hash in V4 to avoid storing
-- real credentials in version control. Provide a BCrypt hash via the
-- SPRING_APP_SUPERADMIN_BCRYPT_HASH env var when running Flyway.
--
-- Usage examples:
--   SPRING_APP_SUPERADMIN_BCRYPT_HASH=$(BCryptPasswordEncoder(12).encode("MyStrongPass")) ./gradlew flywayMigrate
--   For local dev you can set in env or .envrc; CI can inject via secrets.
--
-- If the variable is absent, the migration will no-op to avoid inserting
-- an insecure default.

DO $$
DECLARE
    provided_hash TEXT := trim(both ' ' from '${app.superadmin.bcrypt_hash}');
BEGIN
    IF provided_hash IS NULL OR provided_hash = '' THEN
        RAISE NOTICE 'Skipping SuperAdmin seed/update: app.superadmin.bcrypt_hash not provided';
    ELSE
        PERFORM set_config('app.superadmin.bcrypt_hash', provided_hash, false);

        INSERT INTO users (id, tenant_id, email, password_hash, nombre, apellido, telefono, role, activo)
        VALUES (
            'b0000000-0000-0000-0000-000000000001',
            NULL,
            'superadmin@saas.com',
            provided_hash,
            'Super',
            'Admin',
            '+584140000000',
            'SUPER_ADMIN',
            true
        )
        ON CONFLICT (id) DO UPDATE
            SET password_hash = EXCLUDED.password_hash,
                email = EXCLUDED.email,
                nombre = EXCLUDED.nombre,
                apellido = EXCLUDED.apellido,
                telefono = EXCLUDED.telefono,
                role = EXCLUDED.role,
                activo = EXCLUDED.activo;
        RAISE NOTICE 'SuperAdmin seeded/updated using provided bcrypt hash';
    END IF;
END $$;
