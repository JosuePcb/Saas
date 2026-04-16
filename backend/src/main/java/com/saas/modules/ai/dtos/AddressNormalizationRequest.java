package com.saas.modules.ai.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddressNormalizationRequest(
        @NotBlank(message = "Raw address is required")
        @Size(max = 500, message = "Raw address must not exceed 500 characters")
        String rawAddress
) {
}
