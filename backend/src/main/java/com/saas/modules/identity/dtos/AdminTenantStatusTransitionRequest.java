package com.saas.modules.identity.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminTenantStatusTransitionRequest(
        @NotBlank(message = "Reason is required")
        @Size(max = 300, message = "Reason must not exceed 300 characters")
        String reason
) {
}
