package com.saas.modules.logistics.dtos;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record CreateRouteRequest(
        @NotNull(message = "Vehicle id is required")
        UUID vehicleId,

        UUID driverId,

        @NotEmpty(message = "At least one order must be selected")
        List<UUID> orderIds
) {
}
