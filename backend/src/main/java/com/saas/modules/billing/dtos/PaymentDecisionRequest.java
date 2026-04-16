package com.saas.modules.billing.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PaymentDecisionRequest(
        @NotNull(message = "Decision is required")
        PaymentDecision decision,

        @NotBlank(message = "Decision comment is required")
        @Size(max = 2000, message = "Decision comment must not exceed 2000 characters")
        String comment
) {
}
