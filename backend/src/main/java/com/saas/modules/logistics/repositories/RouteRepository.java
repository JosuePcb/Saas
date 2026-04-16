package com.saas.modules.logistics.repositories;

import com.saas.modules.logistics.models.Route;
import com.saas.modules.logistics.models.RouteStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.List;

@Repository
public interface RouteRepository extends JpaRepository<Route, UUID> {

    boolean existsByTenantIdAndVehicleIdAndStatusIn(UUID tenantId, UUID vehicleId, Set<RouteStatus> statuses);

    Optional<Route> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<Route> findByIdAndTenantIdAndDriverId(UUID id, UUID tenantId, UUID driverId);

    List<Route> findByTenantIdAndDriverIdAndStatusInOrderByCreatedAtDesc(UUID tenantId,
                                                                          UUID driverId,
                                                                          Set<RouteStatus> statuses);
}
