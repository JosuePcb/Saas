package com.saas.modules.logistics.dtos;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.saas.modules.logistics.models.OrderStatus;

import java.time.LocalDateTime;
import java.util.List;

@JsonInclude(JsonInclude.Include.ALWAYS)
public record PublicTrackingResponse(
        String trackingCode,
        OrderStatus currentStatus,
        List<OrderHistoryResponse> history,
        String driverFirstName,
        LocalDateTime eta
) {
}
