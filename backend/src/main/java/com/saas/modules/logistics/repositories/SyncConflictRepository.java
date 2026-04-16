package com.saas.modules.logistics.repositories;

import com.saas.modules.logistics.models.SyncConflict;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SyncConflictRepository extends JpaRepository<SyncConflict, UUID> {
}
