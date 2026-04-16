package com.saas.modules.logistics.repositories;

import com.saas.modules.logistics.models.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, UUID> {

    boolean existsByTenantIdAndPlate(UUID tenantId, String plate);

    Optional<Vehicle> findByIdAndTenantId(UUID id, UUID tenantId);

    List<Vehicle> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);
}
