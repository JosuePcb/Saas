package com.saas.core.tenant;

import jakarta.persistence.EntityManager;
import org.hibernate.Filter;
import org.hibernate.Session;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.mockito.Mockito.*;

class TenantFilterEnablerTest {

    private EntityManager entityManager;
    private Session session;
    private Filter filter;
    private TenantFilterEnabler enabler;

    @BeforeEach
    void setUp() {
        entityManager = mock(EntityManager.class);
        session = mock(Session.class);
        filter = mock(Filter.class);
        when(entityManager.unwrap(Session.class)).thenReturn(session);
        when(session.enableFilter("tenantFilter")).thenReturn(filter);

        enabler = new TenantFilterEnabler(entityManager);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void shouldEnableFilterWhenTenantPresent() {
        UUID tenantId = UUID.randomUUID();
        TenantContext.setCurrentTenantId(tenantId);

        enabler.enableTenantFilter();

        verify(session).enableFilter("tenantFilter");
        verify(filter).setParameter("tenantId", tenantId);
    }

    @Test
    void shouldNotEnableFilterWhenTenantMissing() {
        TenantContext.clear();

        enabler.enableTenantFilter();

        verify(session, never()).enableFilter("tenantFilter");
    }
}
