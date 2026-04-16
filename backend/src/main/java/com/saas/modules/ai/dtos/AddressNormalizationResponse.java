package com.saas.modules.ai.dtos;

import com.saas.modules.logistics.models.AddressReviewStatus;

public record AddressNormalizationResponse(
        String normalizedAddress,
        String normalizedState,
        String normalizedMunicipio,
        String normalizedParroquia,
        String normalizedZona,
        String normalizedReferencia,
        Double normalizedLatitude,
        Double normalizedLongitude,
        double confidence,
        boolean fallbackUsed,
        AddressReviewStatus reviewStatus,
        String modelName,
        String fallbackReason
) {
}
