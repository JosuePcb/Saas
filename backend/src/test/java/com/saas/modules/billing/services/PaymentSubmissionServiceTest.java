package com.saas.modules.billing.services;

import com.saas.core.exceptions.BusinessException;
import com.saas.core.tenant.TenantContext;
import com.saas.modules.billing.dtos.CreatePaymentRequest;
import com.saas.modules.billing.dtos.PaymentMapper;
import com.saas.modules.billing.dtos.PaymentResponse;
import com.saas.modules.billing.events.PaymentSubmittedEvent;
import com.saas.modules.billing.models.Payment;
import com.saas.modules.billing.models.PaymentMethod;
import com.saas.modules.billing.models.PaymentStatus;
import com.saas.modules.billing.repositories.PaymentRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentSubmissionService unit tests")
class PaymentSubmissionServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private PaymentMapper paymentMapper;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private PaymentSubmissionService paymentSubmissionService;

    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        TenantContext.setCurrentTenantId(tenantId);

        lenient().when(paymentMapper.toEntity(any(CreatePaymentRequest.class), any(UUID.class)))
                .thenAnswer(invocation -> {
                    CreatePaymentRequest request = invocation.getArgument(0);
                    UUID mappedTenantId = invocation.getArgument(1);
                    return Payment.builder()
                            .tenantId(mappedTenantId)
                            .method(request.method())
                            .status(PaymentStatus.PENDING_VALIDATION)
                            .amount(request.amount())
                            .referenceNumber(request.referenceNumber())
                            .paymentDateTime(request.paymentDateTime())
                            .evidenceUrl(request.evidenceUrl() == null ? null : request.evidenceUrl().trim())
                            .build();
                });

        lenient().when(paymentMapper.toResponse(any(Payment.class)))
                .thenAnswer(invocation -> {
                    Payment payment = invocation.getArgument(0);
                    return new PaymentResponse(
                            payment.getId(),
                            payment.getTenantId(),
                            payment.getMethod(),
                            payment.getStatus(),
                            payment.getAmount(),
                            payment.getReferenceNumber(),
                            payment.getPaymentDateTime(),
                            payment.getEvidenceUrl(),
                            payment.getCreatedAt()
                    );
                });
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("should submit valid pago movil request")
    void shouldSubmitPagoMovilRequest() {
        CreatePaymentRequest request = new CreatePaymentRequest(
                PaymentMethod.PAGO_MOVIL,
                new BigDecimal("24.50"),
                "REF-PM-001",
                LocalDateTime.now().minusMinutes(15),
                "https://cdn.local/evidence-pm-001.png"
        );

        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment payment = invocation.getArgument(0);
            payment.setId(UUID.randomUUID());
            return payment;
        });

        PaymentResponse response = paymentSubmissionService.submit(request);

        assertThat(response).isNotNull();
        assertThat(response.method()).isEqualTo(PaymentMethod.PAGO_MOVIL);
        assertThat(response.status()).isEqualTo(PaymentStatus.PENDING_VALIDATION);
        assertThat(response.tenantId()).isEqualTo(tenantId);

        ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(captor.capture());
        Payment saved = captor.getValue();
        assertThat(saved.getTenantId()).isEqualTo(tenantId);
        assertThat(saved.getStatus()).isEqualTo(PaymentStatus.PENDING_VALIDATION);
        assertThat(saved.getMethod()).isEqualTo(PaymentMethod.PAGO_MOVIL);

        ArgumentCaptor<PaymentSubmittedEvent> eventCaptor = ArgumentCaptor.forClass(PaymentSubmittedEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertThat(eventCaptor.getValue().paymentId()).isEqualTo(response.id());
        assertThat(eventCaptor.getValue().tenantId()).isEqualTo(tenantId);
        assertThat(eventCaptor.getValue().status()).isEqualTo(PaymentStatus.PENDING_VALIDATION);
    }

    @Test
    @DisplayName("should submit valid transferencia request")
    void shouldSubmitTransferenciaRequest() {
        CreatePaymentRequest request = new CreatePaymentRequest(
                PaymentMethod.TRANSFERENCIA,
                new BigDecimal("99.99"),
                "REF-TRF-100",
                LocalDateTime.now().minusHours(1),
                "https://cdn.local/evidence-trf-100.png"
        );

        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment payment = invocation.getArgument(0);
            payment.setId(UUID.randomUUID());
            return payment;
        });

        PaymentResponse response = paymentSubmissionService.submit(request);

        assertThat(response.status()).isEqualTo(PaymentStatus.PENDING_VALIDATION);
        assertThat(response.method()).isEqualTo(PaymentMethod.TRANSFERENCIA);
    }

    @Test
    @DisplayName("should reject submission when evidence is missing")
    void shouldRejectSubmissionWhenEvidenceMissing() {
        CreatePaymentRequest request = new CreatePaymentRequest(
                PaymentMethod.PAGO_MOVIL,
                new BigDecimal("10.00"),
                "REF-NO-EVIDENCE",
                LocalDateTime.now().minusMinutes(5),
                "   "
        );

        assertThatThrownBy(() -> paymentSubmissionService.submit(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Evidence is required");
    }

    @Test
    @DisplayName("should reject request when method is missing")
    void shouldRejectRequestWhenMethodMissing() {
        CreatePaymentRequest request = new CreatePaymentRequest(
                null,
                new BigDecimal("10.00"),
                "REF-NO-METHOD",
                LocalDateTime.now().minusMinutes(5),
                "https://cdn.local/evidence.png"
        );

        assertThatThrownBy(() -> paymentSubmissionService.submit(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Payment method is required");
    }

    @Test
    @DisplayName("should reject request when tenant context is missing")
    void shouldRejectWhenTenantContextMissing() {
        TenantContext.clear();

        CreatePaymentRequest request = new CreatePaymentRequest(
                PaymentMethod.PAGO_MOVIL,
                new BigDecimal("10.00"),
                "REF-NO-TENANT",
                LocalDateTime.now().minusMinutes(5),
                "https://cdn.local/evidence.png"
        );

        assertThatThrownBy(() -> paymentSubmissionService.submit(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Tenant context is required");
    }
}
