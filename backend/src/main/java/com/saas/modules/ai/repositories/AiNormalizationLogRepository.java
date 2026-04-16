package com.saas.modules.ai.repositories;

import com.saas.modules.ai.models.AiNormalizationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AiNormalizationLogRepository extends JpaRepository<AiNormalizationLog, UUID> {

    Optional<AiNormalizationLog> findTopByOrderIdAndTenantIdOrderByCreatedAtDesc(UUID orderId, UUID tenantId);
}
