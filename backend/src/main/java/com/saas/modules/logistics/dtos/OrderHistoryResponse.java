package com.saas.modules.logistics.dtos;

import com.saas.modules.logistics.models.OrderStatus;

import java.time.LocalDateTime;

public record OrderHistoryResponse(
        OrderStatus status,
        LocalDateTime changedAt
) {
}
