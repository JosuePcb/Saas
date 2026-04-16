package com.saas.modules.logistics.dtos;

import com.saas.modules.logistics.models.RouteStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record RouteResponse(
        UUID id,
        UUID vehicleId,
        RouteStatus status,
        boolean optimizedByAi,
        BigDecimal estimatedDistanceKm,
        List<UUID> orderIds,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
