package com.saas.modules.billing.services;

import com.saas.core.exceptions.BusinessException;
import com.saas.core.tenant.TenantContext;
import com.saas.modules.billing.dtos.PaymentMapper;
import com.saas.modules.billing.dtos.PaymentResponse;
import com.saas.modules.billing.models.Payment;
import com.saas.modules.billing.models.PaymentMethod;
import com.saas.modules.billing.models.PaymentStatus;
import com.saas.modules.billing.repositories.PaymentRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentQueryService unit tests")
class PaymentQueryServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private PaymentMapper paymentMapper;

    @InjectMocks
    private PaymentQueryService paymentQueryService;

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("lists only current tenant pending payments")
    void shouldListOnlyCurrentTenantPendingPayments() {
        UUID tenantId = UUID.randomUUID();
        TenantContext.setCurrentTenantId(tenantId);

        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .method(PaymentMethod.PAGO_MOVIL)
                .status(PaymentStatus.PENDING_VALIDATION)
                .amount(new BigDecimal("18.50"))
                .referenceNumber("REF-Q-001")
                .paymentDateTime(LocalDateTime.now().minusMinutes(20))
                .evidenceUrl("https://cdn.local/ev-q-001.png")
                .createdAt(LocalDateTime.now().minusMinutes(10))
                .build();

        when(paymentRepository.findByTenantIdAndStatusOrderByCreatedAtDesc(tenantId, PaymentStatus.PENDING_VALIDATION))
                .thenReturn(List.of(payment));
        when(paymentMapper.toResponse(any(Payment.class))).thenReturn(new PaymentResponse(
                payment.getId(),
                payment.getTenantId(),
                payment.getMethod(),
                payment.getStatus(),
                payment.getAmount(),
                payment.getReferenceNumber(),
                payment.getPaymentDateTime(),
                payment.getEvidenceUrl(),
                payment.getCreatedAt()
        ));

        List<PaymentResponse> result = paymentQueryService.listCurrentTenantPayments(PaymentStatus.PENDING_VALIDATION);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).tenantId()).isEqualTo(tenantId);
        assertThat(result.get(0).status()).isEqualTo(PaymentStatus.PENDING_VALIDATION);
    }

    @Test
    @DisplayName("rejects list when tenant context is missing")
    void shouldRejectWhenTenantContextMissing() {
        assertThatThrownBy(() -> paymentQueryService.listCurrentTenantPayments(null))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Tenant context is required");
    }
}
