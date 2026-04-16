package com.saas.modules.billing.notifications;

import com.saas.modules.billing.events.PaymentDecisionEvent;
import com.saas.modules.billing.events.PaymentSubmittedEvent;

public interface BillingNotificationAdapter {

    void sendPaymentSubmitted(PaymentSubmittedEvent event);

    void sendPaymentApproved(PaymentDecisionEvent event);

    void sendPaymentRejected(PaymentDecisionEvent event);
}
