package com.saas.modules.logistics.dtos;

import com.saas.modules.logistics.models.VehicleState;

import java.time.LocalDateTime;
import java.util.UUID;

public record VehicleResponse(
        UUID id,
        String plate,
        VehicleState state,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
