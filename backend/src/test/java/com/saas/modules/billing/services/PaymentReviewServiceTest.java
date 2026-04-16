package com.saas.modules.billing.services;

import com.saas.core.exceptions.BusinessException;
import com.saas.modules.billing.dtos.AdminPaymentResponse;
import com.saas.modules.billing.dtos.PaymentDecision;
import com.saas.modules.billing.dtos.PaymentDecisionRequest;
import com.saas.modules.billing.events.PaymentDecisionEvent;
import com.saas.modules.billing.models.Payment;
import com.saas.modules.billing.models.PaymentMethod;
import com.saas.modules.billing.models.PaymentStatus;
import com.saas.modules.billing.repositories.PaymentRepository;
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
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentReviewService unit tests")
class PaymentReviewServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private PaymentReviewService paymentReviewService;

    @Test
    @DisplayName("lists pending validation payments for superadmin queue")
    void shouldListPendingQueue() {
        UUID tenantId = UUID.randomUUID();
        Payment pending = Payment.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .method(PaymentMethod.PAGO_MOVIL)
                .status(PaymentStatus.PENDING_VALIDATION)
                .amount(new BigDecimal("42.00"))
                .referenceNumber("REF-QUEUE-1")
                .paymentDateTime(LocalDateTime.now().minusHours(3))
                .evidenceUrl("https://cdn.local/evidence-queue-1.png")
                .build();

        when(paymentRepository.findByStatusOrderByCreatedAtAsc(PaymentStatus.PENDING_VALIDATION))
                .thenReturn(List.of(pending));

        List<AdminPaymentResponse> queue = paymentReviewService.listQueue(PaymentStatus.PENDING_VALIDATION);

        assertThat(queue).hasSize(1);
        assertThat(queue.get(0).status()).isEqualTo(PaymentStatus.PENDING_VALIDATION);
        assertThat(queue.get(0).tenantId()).isEqualTo(tenantId);
    }

    @Test
    @DisplayName("approves pending payment and activates tenant")
    void shouldApprovePendingPaymentAndActivateTenant() {
        UUID reviewerId = UUID.randomUUID();
        UUID tenantId = UUID.randomUUID();
        UUID paymentId = UUID.randomUUID();
        Tenant tenant = Tenant.builder().id(tenantId).status(TenantStatus.TRIAL).build();
        Payment pending = Payment.builder()
                .id(paymentId)
                .tenantId(tenantId)
                .status(PaymentStatus.PENDING_VALIDATION)
                .method(PaymentMethod.TRANSFERENCIA)
                .amount(new BigDecimal("55.00"))
                .referenceNumber("REF-APP-1")
                .paymentDateTime(LocalDateTime.now().minusHours(1))
                .evidenceUrl("https://cdn.local/app-1.png")
                .build();

        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(pending));
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminPaymentResponse response = paymentReviewService.applyDecision(
                paymentId,
                new PaymentDecisionRequest(PaymentDecision.APPROVE, "Validated against receipt"),
                reviewerId
        );

        assertThat(response.status()).isEqualTo(PaymentStatus.APPROVED);
        assertThat(response.reviewedByUserId()).isEqualTo(reviewerId);
        assertThat(response.reviewedAt()).isNotNull();
        assertThat(response.decisionComment()).isEqualTo("Validated against receipt");

        ArgumentCaptor<Tenant> tenantCaptor = ArgumentCaptor.forClass(Tenant.class);
        verify(tenantRepository).save(tenantCaptor.capture());
        assertThat(tenantCaptor.getValue().getStatus()).isEqualTo(TenantStatus.ACTIVE);
        assertThat(tenantCaptor.getValue().getFechaCorte()).isNotNull();

        ArgumentCaptor<PaymentDecisionEvent> eventCaptor = ArgumentCaptor.forClass(PaymentDecisionEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertThat(eventCaptor.getValue().paymentId()).isEqualTo(paymentId);
        assertThat(eventCaptor.getValue().tenantId()).isEqualTo(tenantId);
        assertThat(eventCaptor.getValue().status()).isEqualTo(PaymentStatus.APPROVED);
        assertThat(eventCaptor.getValue().reviewerUserId()).isEqualTo(reviewerId);
        assertThat(eventCaptor.getValue().comment()).isEqualTo("Validated against receipt");
    }

    @Test
    @DisplayName("rejects pending payment and suspends tenant")
    void shouldRejectPendingPaymentAndSuspendTenant() {
        UUID reviewerId = UUID.randomUUID();
        UUID tenantId = UUID.randomUUID();
        UUID paymentId = UUID.randomUUID();
        Tenant tenant = Tenant.builder().id(tenantId).status(TenantStatus.ACTIVE).build();
        Payment pending = Payment.builder()
                .id(paymentId)
                .tenantId(tenantId)
                .status(PaymentStatus.PENDING_VALIDATION)
                .method(PaymentMethod.TRANSFERENCIA)
                .amount(new BigDecimal("80.00"))
                .referenceNumber("REF-REJ-1")
                .paymentDateTime(LocalDateTime.now().minusHours(2))
                .evidenceUrl("https://cdn.local/rej-1.png")
                .build();

        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(pending));
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminPaymentResponse response = paymentReviewService.applyDecision(
                paymentId,
                new PaymentDecisionRequest(PaymentDecision.REJECT, "Bank reference mismatch"),
                reviewerId
        );

        assertThat(response.status()).isEqualTo(PaymentStatus.REJECTED);
        assertThat(response.reviewedByUserId()).isEqualTo(reviewerId);
        assertThat(response.decisionComment()).isEqualTo("Bank reference mismatch");

        ArgumentCaptor<Tenant> tenantCaptor = ArgumentCaptor.forClass(Tenant.class);
        verify(tenantRepository).save(tenantCaptor.capture());
        assertThat(tenantCaptor.getValue().getStatus()).isEqualTo(TenantStatus.SUSPENDED);

        ArgumentCaptor<PaymentDecisionEvent> eventCaptor = ArgumentCaptor.forClass(PaymentDecisionEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertThat(eventCaptor.getValue().paymentId()).isEqualTo(paymentId);
        assertThat(eventCaptor.getValue().tenantId()).isEqualTo(tenantId);
        assertThat(eventCaptor.getValue().status()).isEqualTo(PaymentStatus.REJECTED);
        assertThat(eventCaptor.getValue().reviewerUserId()).isEqualTo(reviewerId);
        assertThat(eventCaptor.getValue().comment()).isEqualTo("Bank reference mismatch");
    }

    @Test
    @DisplayName("rejects decision when payment is not in pending validation")
    void shouldRejectInvalidTransitionFromNonPendingStatus() {
        UUID paymentId = UUID.randomUUID();
        Payment approvedPayment = Payment.builder()
                .id(paymentId)
                .tenantId(UUID.randomUUID())
                .status(PaymentStatus.APPROVED)
                .build();

        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(approvedPayment));

        assertThatThrownBy(() -> paymentReviewService.applyDecision(
                paymentId,
                new PaymentDecisionRequest(PaymentDecision.REJECT, "Too late"),
                UUID.randomUUID()
        )).isInstanceOf(BusinessException.class)
                .hasMessageContaining("PENDING_VALIDATION");
    }

    @Test
    @DisplayName("requires non-blank decision comment")
    void shouldRequireNonBlankDecisionComment() {
        UUID paymentId = UUID.randomUUID();

        assertThatThrownBy(() -> paymentReviewService.applyDecision(
                paymentId,
                new PaymentDecisionRequest(PaymentDecision.APPROVE, "   "),
                UUID.randomUUID()
        )).isInstanceOf(BusinessException.class)
                .hasMessageContaining("Decision comment is required");
    }

    @Test
    @DisplayName("requires payment id for decision")
    void shouldRequirePaymentId() {
        assertThatThrownBy(() -> paymentReviewService.applyDecision(
                null,
                new PaymentDecisionRequest(PaymentDecision.APPROVE, "Approved"),
                UUID.randomUUID()
        )).isInstanceOf(BusinessException.class)
                .hasMessageContaining("Payment id is required");
    }
}
