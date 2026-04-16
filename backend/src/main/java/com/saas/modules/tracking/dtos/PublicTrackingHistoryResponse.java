package com.saas.modules.tracking.dtos;

import com.saas.modules.logistics.models.OrderStatus;

import java.time.LocalDateTime;

public record PublicTrackingHistoryResponse(
        OrderStatus status,
        LocalDateTime changedAt
) {
}
