package com.saas.modules.billing.events;

import com.saas.modules.billing.models.PaymentStatus;

import java.math.BigDecimal;
import java.util.UUID;

public record PaymentSubmittedEvent(
        UUID paymentId,
        UUID tenantId,
        PaymentStatus status,
        String referenceNumber,
        BigDecimal amount
) {
}
