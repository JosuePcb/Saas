package com.saas.modules.identity.services;

import com.saas.core.exceptions.BusinessException;
import com.saas.core.exceptions.ResourceNotFoundException;
import com.saas.modules.billing.services.PaymentReviewService;
import com.saas.modules.identity.dtos.AdminTenantGlobalMetricsResponse;
import com.saas.modules.identity.dtos.AdminTenantSummaryResponse;
import com.saas.modules.identity.models.Tenant;
import com.saas.modules.identity.models.TenantStatus;
import com.saas.modules.identity.repositories.TenantRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AdminTenantService {

    private final TenantRepository tenantRepository;
    private final PaymentReviewService paymentReviewService;

    public AdminTenantService(TenantRepository tenantRepository,
                              PaymentReviewService paymentReviewService) {
        this.tenantRepository = tenantRepository;
        this.paymentReviewService = paymentReviewService;
    }

    @Transactional(readOnly = true)
    public List<AdminTenantSummaryResponse> listTenants(TenantStatus status) {
        List<Tenant> tenants = status == null
                ? tenantRepository.findAll()
                : tenantRepository.findByStatus(status);

        Map<UUID, Long> pendingByTenant = pendingPaymentsByTenant();

        return tenants.stream()
                .sorted((left, right) -> right.getCreatedAt().compareTo(left.getCreatedAt()))
                .map(tenant -> toSummary(tenant, pendingByTenant.getOrDefault(tenant.getId(), 0L)))
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminTenantGlobalMetricsResponse globalMetrics() {
        List<Tenant> tenants = tenantRepository.findAll();
        Map<TenantStatus, Long> tenantCountsByStatus = new EnumMap<>(TenantStatus.class);
        for (Object[] row : tenantRepository.countByStatus()) {
            tenantCountsByStatus.put((TenantStatus) row[0], ((Number) row[1]).longValue());
        }
        for (TenantStatus tenantStatus : TenantStatus.values()) {
            tenantCountsByStatus.putIfAbsent(tenantStatus, 0L);
        }

        Map<UUID, Long> pendingByTenant = pendingPaymentsByTenant();
        Map<String, Long> responseStatusMap = tenantCountsByStatus.entrySet().stream()
                .collect(Collectors.toMap(entry -> entry.getKey().name(), Map.Entry::getValue));

        long pendingQueueSize = pendingByTenant.values().stream().mapToLong(Long::longValue).sum();
        return new AdminTenantGlobalMetricsResponse(
                tenants.size(),
                responseStatusMap,
                pendingQueueSize,
                pendingByTenant.size()
        );
    }

    @Transactional
    public AdminTenantSummaryResponse suspendTenant(UUID tenantId, String reason, UUID actorUserId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", "id", tenantId));

        if (tenant.getStatus() == TenantStatus.SUSPENDED) {
            throw new BusinessException("Tenant is already suspended", HttpStatus.CONFLICT);
        }
        if (tenant.getStatus() == TenantStatus.CANCELLED) {
            throw new BusinessException("Cancelled tenants cannot be suspended", HttpStatus.CONFLICT);
        }

        LocalDateTime now = LocalDateTime.now();
        tenant.setStatus(TenantStatus.SUSPENDED);
        tenant.setStatusChangedAt(now);
        tenant.setSuspendedAt(now);
        tenant.setSuspendedBy(actorUserId);
        tenant.setSuspensionReason(reason.trim());
        tenant.setReactivatedAt(null);
        tenant.setReactivatedBy(null);
        tenant.setReactivationReason(null);

        Tenant saved = tenantRepository.save(tenant);
        long pendingPayments = pendingPaymentsByTenant().getOrDefault(saved.getId(), 0L);
        return toSummary(saved, pendingPayments);
    }

    @Transactional
    public AdminTenantSummaryResponse reactivateTenant(UUID tenantId, String reason, UUID actorUserId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", "id", tenantId));

        if (tenant.getStatus() != TenantStatus.SUSPENDED) {
            throw new BusinessException("Only suspended tenants can be reactivated", HttpStatus.CONFLICT);
        }

        LocalDateTime now = LocalDateTime.now();
        tenant.setStatus(TenantStatus.ACTIVE);
        tenant.setStatusChangedAt(now);
        tenant.setReactivatedAt(now);
        tenant.setReactivatedBy(actorUserId);
        tenant.setReactivationReason(reason.trim());
        tenant.setSuspendedAt(null);
        tenant.setSuspendedBy(null);
        tenant.setSuspensionReason(null);

        Tenant saved = tenantRepository.save(tenant);
        long pendingPayments = pendingPaymentsByTenant().getOrDefault(saved.getId(), 0L);
        return toSummary(saved, pendingPayments);
    }

    private Map<UUID, Long> pendingPaymentsByTenant() {
        return paymentReviewService.pendingQueueSummaryByTenant();
    }

    private AdminTenantSummaryResponse toSummary(Tenant tenant, long pendingPayments) {
        return new AdminTenantSummaryResponse(
                tenant.getId(),
                tenant.getNombre(),
                tenant.getRif(),
                tenant.getStatus(),
                tenant.getPlanId(),
                tenant.getFechaRegistro(),
                tenant.getFechaCorte(),
                tenant.getStatusChangedAt(),
                tenant.getSuspendedAt(),
                tenant.getSuspensionReason(),
                tenant.getReactivatedAt(),
                tenant.getReactivationReason(),
                pendingPayments
        );
    }
}
