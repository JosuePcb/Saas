package com.saas.modules.billing.services;

import com.saas.core.exceptions.BusinessException;
import com.saas.core.tenant.TenantContext;
import com.saas.modules.billing.dtos.CreatePaymentRequest;
import com.saas.modules.billing.dtos.PaymentMapper;
import com.saas.modules.billing.dtos.PaymentResponse;
import com.saas.modules.billing.events.PaymentSubmittedEvent;
import com.saas.modules.billing.models.Payment;
import com.saas.modules.billing.repositories.PaymentRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class PaymentSubmissionService {

    private final PaymentRepository paymentRepository;
    private final PaymentMapper paymentMapper;
    private final ApplicationEventPublisher eventPublisher;

    public PaymentSubmissionService(PaymentRepository paymentRepository,
                                    PaymentMapper paymentMapper,
                                    ApplicationEventPublisher eventPublisher) {
        this.paymentRepository = paymentRepository;
        this.paymentMapper = paymentMapper;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public PaymentResponse submit(CreatePaymentRequest request) {
        validate(request);

        UUID tenantId = TenantContext.getCurrentTenantId();
        if (tenantId == null) {
            throw new BusinessException("Tenant context is required");
        }
        Payment payment = paymentMapper.toEntity(request, tenantId);

        Payment saved = paymentRepository.save(payment);
        eventPublisher.publishEvent(new PaymentSubmittedEvent(
                saved.getId(),
                saved.getTenantId(),
                saved.getStatus(),
                saved.getReferenceNumber(),
                saved.getAmount()
        ));
        return paymentMapper.toResponse(saved);
    }

    private void validate(CreatePaymentRequest request) {
        if (request == null) {
            throw new BusinessException("Payment request is required");
        }
        if (request.method() == null) {
            throw new BusinessException("Payment method is required");
        }
        if (request.evidenceUrl() == null || request.evidenceUrl().isBlank()) {
            throw new BusinessException("Evidence is required");
        }
        if (request.amount() == null || request.amount().signum() <= 0) {
            throw new BusinessException("Amount must be greater than zero");
        }
        if (request.referenceNumber() == null || request.referenceNumber().isBlank()) {
            throw new BusinessException("Reference number is required");
        }
        if (request.paymentDateTime() == null) {
            throw new BusinessException("Payment date and time is required");
        }
    }
}
