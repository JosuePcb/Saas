package com.saas.modules.logistics.repositories;

import com.saas.modules.logistics.models.OrderStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderStatusHistoryRepository extends JpaRepository<OrderStatusHistory, UUID> {

    List<OrderStatusHistory> findByOrderIdAndTenantIdOrderByChangedAtAscIdAsc(UUID orderId, UUID tenantId);
}
