package com.saas.modules.logistics.repositories;

import com.saas.modules.logistics.models.Order;
import com.saas.modules.logistics.models.OrderStatus;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    Optional<Order> findByIdAndTenantId(UUID id, UUID tenantId);

    boolean existsByTenantIdAndTrackingCode(UUID tenantId, String trackingCode);

    Optional<Order> findTopByTenantIdAndTrackingCodeStartingWithOrderByCreatedAtDesc(UUID tenantId, String trackingPrefix);

    Optional<Order> findTopByTrackingCodeOrderByCreatedAtDesc(String trackingCode);

    List<Order> findAllByIdInAndTenantId(Collection<UUID> ids, UUID tenantId);

    @Query("""
            SELECT u.nombre AS driverFirstName, rs.eta AS eta
            FROM RouteStop rs
            JOIN Route r ON r.id = rs.routeId
            LEFT JOIN User u ON u.id = r.driverId AND u.tenantId = r.tenantId
            WHERE rs.orderId = :orderId AND r.tenantId = :tenantId
            ORDER BY rs.stopOrder ASC
            """)
    List<PublicTrackingEnrichmentView> findPublicTrackingEnrichmentByOrderIdAndTenantId(UUID orderId, UUID tenantId);

    @Query("""
            SELECT
              o.id AS orderId,
              o.trackingCode AS trackingCode,
              o.status AS status,
              rs.routeId AS routeId,
              MAX(osh.changedAt) AS lastStatusTimestamp
            FROM Order o
            LEFT JOIN RouteStop rs ON rs.orderId = o.id
            LEFT JOIN OrderStatusHistory osh ON osh.orderId = o.id AND osh.tenantId = o.tenantId
            WHERE o.tenantId = :tenantId
            GROUP BY o.id, o.trackingCode, o.status, rs.routeId
            ORDER BY MAX(osh.changedAt) DESC, o.createdAt DESC
            """)
    List<DispatcherTrackingView> findDispatcherTrackingByTenantId(UUID tenantId);

    interface DispatcherTrackingView {
        UUID getOrderId();
        String getTrackingCode();
        OrderStatus getStatus();
        UUID getRouteId();
        LocalDateTime getLastStatusTimestamp();
    }

    interface PublicTrackingEnrichmentView {
        String getDriverFirstName();
        LocalDateTime getEta();
    }
}
