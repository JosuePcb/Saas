package com.saas.modules.ai.dtos;

import com.saas.modules.ai.models.AiNormalizationStatus;
import com.saas.modules.logistics.models.AddressReviewStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record AddressNormalizationAttemptResponse(
        UUID orderId,
        String rawInputAddress,
        String normalizedAddress,
        String normalizedState,
        String normalizedMunicipio,
        String normalizedParroquia,
        String normalizedZona,
        String normalizedReferencia,
        Double normalizedLatitude,
        Double normalizedLongitude,
        Double confidence,
        boolean fallbackUsed,
        AddressReviewStatus reviewStatus,
        String modelName,
        AiNormalizationStatus normalizationStatus,
        boolean correctedManually,
        LocalDateTime normalizedAt,
        LocalDateTime loggedAt
) {
}
