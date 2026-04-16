package com.saas.modules.billing.repositories;

import com.saas.modules.billing.models.Payment;
import com.saas.modules.billing.models.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    List<Payment> findByTenantIdAndStatusOrderByCreatedAtDesc(UUID tenantId, PaymentStatus status);

    List<Payment> findByStatusOrderByCreatedAtAsc(PaymentStatus status);

    long countByStatus(PaymentStatus status);

    @Query("""
            SELECT p.tenantId, COUNT(p)
            FROM Payment p
            WHERE p.status = :status
            GROUP BY p.tenantId
            """)
    List<Object[]> countByTenantIdForStatus(PaymentStatus status);
}
