package com.saas.modules.identity.repositories;

import com.saas.modules.identity.models.Tenant;
import com.saas.modules.identity.models.TenantStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, UUID> {

    Optional<Tenant> findByRif(String rif);

    boolean existsByRif(String rif);

    List<Tenant> findByStatus(TenantStatus status);

    @Query("""
            SELECT t.status, COUNT(t)
            FROM Tenant t
            GROUP BY t.status
            """)
    List<Object[]> countByStatus();
}
