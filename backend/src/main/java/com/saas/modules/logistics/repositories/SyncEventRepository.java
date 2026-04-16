package com.saas.modules.logistics.repositories;

import com.saas.modules.logistics.models.SyncEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SyncEventRepository extends JpaRepository<SyncEvent, UUID> {

    Optional<SyncEvent> findByTenantIdAndDeviceIdAndClientEventId(UUID tenantId, UUID deviceId, String clientEventId);
}
