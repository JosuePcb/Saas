package com.saas.modules.ai.dtos;

import java.util.UUID;

public record RouteOptimizationStopResponse(
        UUID orderId,
        int stopOrder,
        String normalizedAddress,
        Double normalizedLatitude,
        Double normalizedLongitude
) {
}
