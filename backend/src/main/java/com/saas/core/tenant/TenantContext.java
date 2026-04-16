package com.saas.core.tenant;

import java.util.UUID;

/**
 * Holds the current tenant ID for the request scope using ThreadLocal.
 * Set by JwtAuthenticationFilter, cleared by TenantInterceptor afterCompletion.
 */
public final class TenantContext {

    private static final ThreadLocal<UUID> CURRENT_TENANT = new ThreadLocal<>();

    private TenantContext() {
        // Utility class
    }

    public static void setCurrentTenantId(UUID tenantId) {
        CURRENT_TENANT.set(tenantId);
    }

    public static UUID getCurrentTenantId() {
        return CURRENT_TENANT.get();
    }

    public static void clear() {
        CURRENT_TENANT.remove();
    }
}
