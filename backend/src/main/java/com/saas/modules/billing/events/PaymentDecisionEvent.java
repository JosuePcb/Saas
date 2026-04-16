package com.saas.modules.billing.events;

import com.saas.modules.billing.models.PaymentStatus;

import java.util.UUID;

public record PaymentDecisionEvent(
        UUID paymentId,
        UUID tenantId,
        PaymentStatus status,
        UUID reviewerUserId,
        String comment
) {
}
