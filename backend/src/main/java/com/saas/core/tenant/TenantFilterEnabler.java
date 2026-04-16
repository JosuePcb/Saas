package com.saas.core.tenant;

import jakarta.persistence.EntityManager;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.hibernate.Session;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Aspect
@Component
public class TenantFilterEnabler {

    private final EntityManager entityManager;

    public TenantFilterEnabler(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Before("execution(* com.saas.modules..repositories.*.*(..))")
    public void enableTenantFilter() {
        UUID tenantId = TenantContext.getCurrentTenantId();
        if (tenantId == null) {
            return;
        }

        Session session = entityManager.unwrap(Session.class);
        session.enableFilter("tenantFilter").setParameter("tenantId", tenantId);
    }
}
