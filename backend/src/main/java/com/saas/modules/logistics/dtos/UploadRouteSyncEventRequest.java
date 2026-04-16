package com.saas.modules.logistics.dtos;

import com.saas.modules.logistics.models.OrderStatus;
import com.saas.modules.logistics.models.SyncEventType;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.UUID;

public record UploadRouteSyncEventRequest(
        @NotBlank(message = "Client event id is required")
        String clientEventId,

    @NotNull(message = "Event type is required")
    SyncEventType eventType,

    UUID orderId,

    OrderStatus targetStatus,

        @NotNull(message = "Event occurred at is required")
        LocalDateTime eventOccurredAt
) {

    @AssertTrue(message = "Order id and target status are required for STATUS_CHANGE events")
    public boolean isStatusChangePayloadValid() {
        return eventType != SyncEventType.STATUS_CHANGE || (orderId != null && targetStatus != null);
    }
}
