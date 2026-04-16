package com.saas.core.tenant;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("TenantContext Unit Tests")
class TenantContextTest {

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("Should return null when no tenant is set")
    void shouldReturnNullWhenNoTenantSet() {
        assertThat(TenantContext.getCurrentTenantId()).isNull();
    }

    @Test
    @DisplayName("Should store and retrieve tenant ID")
    void shouldStoreAndRetrieveTenantId() {
        UUID tenantId = UUID.randomUUID();

        TenantContext.setCurrentTenantId(tenantId);

        assertThat(TenantContext.getCurrentTenantId()).isEqualTo(tenantId);
    }

    @Test
    @DisplayName("Should clear tenant ID")
    void shouldClearTenantId() {
        UUID tenantId = UUID.randomUUID();
        TenantContext.setCurrentTenantId(tenantId);

        TenantContext.clear();

        assertThat(TenantContext.getCurrentTenantId()).isNull();
    }

    @Test
    @DisplayName("Should override previously set tenant ID")
    void shouldOverridePreviouslySetTenantId() {
        UUID tenantId1 = UUID.randomUUID();
        UUID tenantId2 = UUID.randomUUID();

        TenantContext.setCurrentTenantId(tenantId1);
        TenantContext.setCurrentTenantId(tenantId2);

        assertThat(TenantContext.getCurrentTenantId()).isEqualTo(tenantId2);
    }
}
