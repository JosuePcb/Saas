package com.saas.modules.logistics.dtos;

import com.saas.modules.logistics.models.AddressReviewStatus;

public record AddressNormalizationResponse(
        String normalizedAddress,
        double confidence,
        boolean fallbackUsed,
        AddressReviewStatus reviewStatus
) {
}
