package com.saas.modules.logistics.dtos;

import com.saas.modules.logistics.models.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeOrderStatusRequest(
        @NotNull(message = "Status is required")
        OrderStatus status
) {
}
