package com.saas.modules.tracking.dtos;

import com.saas.modules.logistics.models.OrderStatus;

import java.time.LocalDateTime;
import java.util.List;

public record PublicTrackingResponse(
        String trackingCode,
        OrderStatus currentStatus,
        List<PublicTrackingHistoryResponse> history,
        String driverFirstName,
        LocalDateTime eta
) {
}
