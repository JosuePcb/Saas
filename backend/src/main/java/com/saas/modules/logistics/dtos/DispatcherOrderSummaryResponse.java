package com.saas.modules.logistics.dtos;

import com.saas.modules.logistics.models.OrderStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record DispatcherOrderSummaryResponse(
        UUID orderId,
        String trackingCode,
        OrderStatus status,
        UUID routeId,
        LocalDateTime lastStatusTimestamp
) {
}
