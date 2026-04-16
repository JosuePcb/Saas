package com.saas.modules.logistics.dtos;

import com.saas.modules.logistics.models.OrderStatus;

import java.util.UUID;

public record DriverOfflineStopResponse(
        UUID orderId,
        int stopOrder,
        String trackingCode,
        OrderStatus status,
        String normalizedAddress,
        Double normalizationConfidence,
        boolean normalizationFallbackUsed
) {
}
