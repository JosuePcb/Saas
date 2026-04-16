package com.saas.modules.billing.notifications;

import com.saas.modules.billing.events.PaymentDecisionEvent;
import com.saas.modules.billing.events.PaymentSubmittedEvent;
import org.springframework.stereotype.Component;

@Component
public class NoOpBillingNotificationAdapter implements BillingNotificationAdapter {

    @Override
    public void sendPaymentSubmitted(PaymentSubmittedEvent event) {
        // Intentionally no-op for local phase.
    }

    @Override
    public void sendPaymentApproved(PaymentDecisionEvent event) {
        // Intentionally no-op for local phase.
    }

    @Override
    public void sendPaymentRejected(PaymentDecisionEvent event) {
        // Intentionally no-op for local phase.
    }
}
