package com.saas.modules.billing.dtos;

import com.saas.modules.billing.models.PaymentMethod;
import com.saas.modules.billing.models.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record PaymentResponse(
        UUID id,
        UUID tenantId,
        PaymentMethod method,
        PaymentStatus status,
        BigDecimal amount,
        String referenceNumber,
        LocalDateTime paymentDateTime,
        String evidenceUrl,
        LocalDateTime createdAt
) {
}
