package com.saas.modules.ai.dtos;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record RouteOptimizationConfirmRequest(
        @NotNull(message = "Vehicle id is required")
        UUID vehicleId,

        UUID driverId,

        @NotEmpty(message = "At least one order must be selected")
        List<UUID> orderIds,

        @NotEmpty(message = "Optimized order ids are required")
        List<UUID> optimizedOrderIds,

        @NotNull(message = "Preview signature is required")
        String previewSignature,

        boolean optimizedByAi,

        @NotNull(message = "Estimated distance is required")
        Double estimatedDistanceKm
) {
}
