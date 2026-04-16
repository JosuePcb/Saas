package com.saas.modules.logistics.dtos;

import java.time.LocalDateTime;
import java.util.UUID;

public record PodMetadataResponse(
        UUID orderId,
        String objectKey,
        String contentType,
        long sizeBytes,
        LocalDateTime uploadedAt
) {
}
