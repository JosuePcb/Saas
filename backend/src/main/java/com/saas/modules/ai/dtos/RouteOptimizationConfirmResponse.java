package com.saas.modules.ai.dtos;

import com.saas.modules.logistics.dtos.RouteResponse;

public record RouteOptimizationConfirmResponse(
        RouteOptimizationPreviewResponse preview,
        RouteResponse route
) {
}
