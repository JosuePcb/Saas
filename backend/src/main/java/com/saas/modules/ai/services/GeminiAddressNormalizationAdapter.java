package com.saas.modules.ai.services;

import com.saas.modules.ai.dtos.AddressNormalizationResult;

public interface GeminiAddressNormalizationAdapter {

    AddressNormalizationResult normalize(String rawAddress);
}
