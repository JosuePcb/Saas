package com.saas.modules.logistics.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record UploadRouteSyncRequest(
        @NotNull(message = "Device id is required")
        UUID deviceId,

        @NotEmpty(message = "At least one sync event is required")
        List<@Valid UploadRouteSyncEventRequest> events
) {
}
