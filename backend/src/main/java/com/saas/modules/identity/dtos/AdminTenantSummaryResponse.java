package com.saas.modules.identity.dtos;

import com.saas.modules.identity.models.TenantStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdminTenantSummaryResponse(
        UUID id,
        String nombre,
        String rif,
        TenantStatus status,
        UUID planId,
        LocalDateTime fechaRegistro,
        LocalDateTime fechaCorte,
        LocalDateTime statusChangedAt,
        LocalDateTime suspendedAt,
        String suspensionReason,
        LocalDateTime reactivatedAt,
        String reactivationReason,
        long pendingPayments
) {
}
