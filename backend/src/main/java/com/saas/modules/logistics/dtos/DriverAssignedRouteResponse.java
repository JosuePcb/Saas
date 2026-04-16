package com.saas.modules.logistics.dtos;

import com.saas.modules.logistics.models.RouteStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record DriverAssignedRouteResponse(
        UUID routeId,
        UUID vehicleId,
        RouteStatus status,
        LocalDateTime createdAt,
        List<DriverAssignedStopResponse> stops
) {
}
