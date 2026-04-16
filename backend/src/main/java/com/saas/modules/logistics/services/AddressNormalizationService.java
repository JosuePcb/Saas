package com.saas.modules.logistics.services;

import com.saas.modules.logistics.dtos.AddressNormalizationResponse;
import com.saas.modules.logistics.models.AddressReviewStatus;
import org.springframework.stereotype.Service;

@Service
public class AddressNormalizationService {

    private static final double AUTO_ACCEPT_THRESHOLD = 0.80;

    public AddressNormalizationResponse normalize(String rawAddress) {
        String normalizedAddress = rawAddress == null ? "" : rawAddress.trim();
        boolean fallbackUsed = normalizedAddress.length() < 20;
        double confidence = fallbackUsed ? 0.65 : 0.92;
        AddressReviewStatus reviewStatus = confidence >= AUTO_ACCEPT_THRESHOLD && !fallbackUsed
                ? AddressReviewStatus.AUTO_ACCEPTED
                : AddressReviewStatus.REVIEW_REQUIRED;

        return new AddressNormalizationResponse(normalizedAddress, confidence, fallbackUsed, reviewStatus);
    }
}
