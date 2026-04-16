package com.saas.modules.ai.dtos;

import java.util.List;
import java.util.UUID;

public record RouteOptimizationPreviewResponse(
        UUID vehicleId,
        UUID driverId,
        boolean optimizedByAi,
        String fallbackReason,
        List<UUID> originalOrderIds,
        List<UUID> optimizedOrderIds,
        Double estimatedDistanceKm,
        String previewSignature,
        List<RouteOptimizationStopResponse> stops
) {
}
