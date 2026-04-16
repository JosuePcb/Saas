package com.saas.modules.billing.dtos;

import com.saas.modules.billing.models.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CreatePaymentRequest(
        @NotNull(message = "Payment method is required")
        PaymentMethod method,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
        BigDecimal amount,

        @NotBlank(message = "Reference number is required")
        @Size(max = 120, message = "Reference number must not exceed 120 characters")
        String referenceNumber,

        @NotNull(message = "Payment date and time is required")
        LocalDateTime paymentDateTime,

        @NotBlank(message = "Evidence is required")
        @Size(max = 500, message = "Evidence URL must not exceed 500 characters")
        String evidenceUrl
) {
}
