package com.saas.modules.billing.events;

import com.saas.modules.billing.models.PaymentStatus;
import com.saas.modules.billing.notifications.BillingNotificationAdapter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.context.event.EventListener;

@Component
public class PaymentNotificationEventHandler {

    private static final Logger log = LoggerFactory.getLogger(PaymentNotificationEventHandler.class);

    private final BillingNotificationAdapter notificationAdapter;

    public PaymentNotificationEventHandler(BillingNotificationAdapter notificationAdapter) {
        this.notificationAdapter = notificationAdapter;
    }

    @EventListener
    public void onPaymentSubmitted(PaymentSubmittedEvent event) {
        try {
            notificationAdapter.sendPaymentSubmitted(event);
        } catch (RuntimeException ex) {
            log.warn("Billing notification failed for submitted payment {}", event.paymentId(), ex);
        }
    }

    @EventListener
    public void onPaymentDecision(PaymentDecisionEvent event) {
        try {
            if (event.status() == PaymentStatus.APPROVED) {
                notificationAdapter.sendPaymentApproved(event);
                return;
            }
            if (event.status() == PaymentStatus.REJECTED) {
                notificationAdapter.sendPaymentRejected(event);
            }
        } catch (RuntimeException ex) {
            log.warn("Billing notification failed for decided payment {}", event.paymentId(), ex);
        }
    }
}
