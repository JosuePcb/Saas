package com.saas.modules.identity.services;

import com.saas.core.exceptions.BusinessException;
import com.saas.modules.billing.services.PaymentReviewService;
import com.saas.modules.identity.dtos.AdminTenantGlobalMetricsResponse;
import com.saas.modules.identity.dtos.AdminTenantSummaryResponse;
import com.saas.modules.identity.models.Tenant;
import com.saas.modules.identity.models.TenantStatus;
import com.saas.modules.identity.repositories.TenantRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminTenantService unit tests")
class AdminTenantServiceTest {

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private PaymentReviewService paymentReviewService;

    @InjectMocks
    private AdminTenantService adminTenantService;

    @Test
    @DisplayName("aggregates global metrics including pending queue summary")
    void shouldAggregateGlobalMetrics() {
        UUID tenantA = UUID.randomUUID();
        UUID tenantB = UUID.randomUUID();
        when(tenantRepository.findAll()).thenReturn(List.of(
                Tenant.builder().id(tenantA).status(TenantStatus.TRIAL).build(),
                Tenant.builder().id(tenantB).status(TenantStatus.ACTIVE).build()
        ));
        when(tenantRepository.countByStatus()).thenReturn(List.of(
                new Object[]{TenantStatus.TRIAL, 1L},
                new Object[]{TenantStatus.ACTIVE, 1L}
        ));
        when(paymentReviewService.pendingQueueSummaryByTenant()).thenReturn(Map.of(tenantA, 2L, tenantB, 1L));

        AdminTenantGlobalMetricsResponse response = adminTenantService.globalMetrics();

        assertThat(response.totalTenants()).isEqualTo(2);
        assertThat(response.tenantsByStatus()).containsEntry("TRIAL", 1L);
        assertThat(response.tenantsByStatus()).containsEntry("ACTIVE", 1L);
        assertThat(response.tenantsByStatus()).containsEntry("SUSPENDED", 0L);
        assertThat(response.pendingPaymentQueueSize()).isEqualTo(3);
        assertThat(response.tenantsWithPendingPayments()).isEqualTo(2);
    }

    @Test
    @DisplayName("suspends tenant with audit metadata")
    void shouldSuspendTenantWithAuditFields() {
        UUID tenantId = UUID.randomUUID();
        UUID actorId = UUID.randomUUID();
        Tenant tenant = Tenant.builder().id(tenantId).status(TenantStatus.ACTIVE).build();

        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(tenantRepository.save(any(Tenant.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentReviewService.pendingQueueSummaryByTenant()).thenReturn(Map.of(tenantId, 1L));

        AdminTenantSummaryResponse response = adminTenantService.suspendTenant(tenantId, "Repeated fraud signals", actorId);

        assertThat(response.status()).isEqualTo(TenantStatus.SUSPENDED);
        assertThat(response.pendingPayments()).isEqualTo(1L);
        assertThat(response.suspensionReason()).isEqualTo("Repeated fraud signals");
        assertThat(response.suspendedAt()).isNotNull();

        ArgumentCaptor<Tenant> tenantCaptor = ArgumentCaptor.forClass(Tenant.class);
        verify(tenantRepository).save(tenantCaptor.capture());
        assertThat(tenantCaptor.getValue().getSuspendedBy()).isEqualTo(actorId);
        assertThat(tenantCaptor.getValue().getStatusChangedAt()).isNotNull();
    }

    @Test
    @DisplayName("reactivates only suspended tenants with audit metadata")
    void shouldReactivateSuspendedTenantOnly() {
        UUID tenantId = UUID.randomUUID();
        UUID actorId = UUID.randomUUID();
        Tenant tenant = Tenant.builder()
                .id(tenantId)
                .status(TenantStatus.SUSPENDED)
                .suspendedAt(LocalDateTime.now().minusDays(1))
                .build();

        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(tenantRepository.save(any(Tenant.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentReviewService.pendingQueueSummaryByTenant()).thenReturn(Map.of());

        AdminTenantSummaryResponse response = adminTenantService.reactivateTenant(tenantId, "Payment settled", actorId);

        assertThat(response.status()).isEqualTo(TenantStatus.ACTIVE);
        assertThat(response.reactivationReason()).isEqualTo("Payment settled");
        assertThat(response.reactivatedAt()).isNotNull();

        ArgumentCaptor<Tenant> tenantCaptor = ArgumentCaptor.forClass(Tenant.class);
        verify(tenantRepository).save(tenantCaptor.capture());
        assertThat(tenantCaptor.getValue().getReactivatedBy()).isEqualTo(actorId);
        assertThat(tenantCaptor.getValue().getStatusChangedAt()).isNotNull();
    }

    @Test
    @DisplayName("rejects reactivation when tenant is not suspended")
    void shouldRejectReactivationWhenNotSuspended() {
        UUID tenantId = UUID.randomUUID();
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(
                Tenant.builder().id(tenantId).status(TenantStatus.ACTIVE).build()
        ));

        assertThatThrownBy(() -> adminTenantService.reactivateTenant(tenantId, "Manual recovery", UUID.randomUUID()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Only suspended tenants can be reactivated");
    }
}
