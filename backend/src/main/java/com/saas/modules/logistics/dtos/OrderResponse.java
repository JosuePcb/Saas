package com.saas.modules.logistics.dtos;

import com.saas.modules.logistics.models.OrderStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record OrderResponse(
        UUID id,
        String trackingCode,
        OrderStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
