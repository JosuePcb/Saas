package com.saas.modules.billing.events;

import com.saas.modules.billing.models.PaymentStatus;
import com.saas.modules.billing.notifications.BillingNotificationAdapter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentNotificationEventHandler unit tests")
class PaymentNotificationEventHandlerTest {

    @Mock
    private BillingNotificationAdapter notificationAdapter;

    @InjectMocks
    private PaymentNotificationEventHandler handler;

    @Test
    @DisplayName("handles payment submitted event through notification adapter")
    void shouldHandlePaymentSubmittedEvent() {
        PaymentSubmittedEvent event = new PaymentSubmittedEvent(
                UUID.randomUUID(),
                UUID.randomUUID(),
                PaymentStatus.PENDING_VALIDATION,
                "REF-SUB-001",
                new BigDecimal("12.50")
        );

        handler.onPaymentSubmitted(event);

        verify(notificationAdapter).sendPaymentSubmitted(event);
    }

    @Test
    @DisplayName("handles payment approved event through notification adapter")
    void shouldHandlePaymentApprovedDecision() {
        PaymentDecisionEvent event = new PaymentDecisionEvent(
                UUID.randomUUID(),
                UUID.randomUUID(),
                PaymentStatus.APPROVED,
                UUID.randomUUID(),
                "Validated"
        );

        handler.onPaymentDecision(event);

        verify(notificationAdapter).sendPaymentApproved(event);
    }

    @Test
    @DisplayName("handles payment rejected event through notification adapter")
    void shouldHandlePaymentRejectedDecision() {
        PaymentDecisionEvent event = new PaymentDecisionEvent(
                UUID.randomUUID(),
                UUID.randomUUID(),
                PaymentStatus.REJECTED,
                UUID.randomUUID(),
                "Mismatch"
        );

        handler.onPaymentDecision(event);

        verify(notificationAdapter).sendPaymentRejected(event);
    }

    @Test
    @DisplayName("does not propagate adapter failure on notification dispatch")
    void shouldNotPropagateAdapterFailure() {
        PaymentDecisionEvent event = new PaymentDecisionEvent(
                UUID.randomUUID(),
                UUID.randomUUID(),
                PaymentStatus.APPROVED,
                UUID.randomUUID(),
                "Validated"
        );
        doThrow(new RuntimeException("adapter-down"))
                .when(notificationAdapter)
                .sendPaymentApproved(event);

        assertThatCode(() -> handler.onPaymentDecision(event)).doesNotThrowAnyException();
    }
}
