package com.saas.modules.logistics.dtos;

import com.saas.modules.logistics.models.OrderStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record DriverAssignedStopResponse(
        UUID orderId,
        int stopOrder,
        String trackingCode,
        OrderStatus status,
        LocalDateTime eta
) {
}
