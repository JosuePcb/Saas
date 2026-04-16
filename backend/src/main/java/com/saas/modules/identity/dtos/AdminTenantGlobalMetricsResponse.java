package com.saas.modules.identity.dtos;

import java.util.Map;

public record AdminTenantGlobalMetricsResponse(
        long totalTenants,
        Map<String, Long> tenantsByStatus,
        long pendingPaymentQueueSize,
        long tenantsWithPendingPayments
) {
}
