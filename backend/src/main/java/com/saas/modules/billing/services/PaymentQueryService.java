package com.saas.modules.billing.services;

import com.saas.core.exceptions.BusinessException;
import com.saas.core.tenant.TenantContext;
import com.saas.modules.billing.dtos.PaymentMapper;
import com.saas.modules.billing.dtos.PaymentResponse;
import com.saas.modules.billing.models.PaymentStatus;
import com.saas.modules.billing.repositories.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class PaymentQueryService {

    private final PaymentRepository paymentRepository;
    private final PaymentMapper paymentMapper;

    public PaymentQueryService(PaymentRepository paymentRepository, PaymentMapper paymentMapper) {
        this.paymentRepository = paymentRepository;
        this.paymentMapper = paymentMapper;
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> listCurrentTenantPayments(PaymentStatus status) {
        UUID tenantId = TenantContext.getCurrentTenantId();
        if (tenantId == null) {
            throw new BusinessException("Tenant context is required");
        }

        PaymentStatus effectiveStatus = status == null ? PaymentStatus.PENDING_VALIDATION : status;
        return paymentRepository.findByTenantIdAndStatusOrderByCreatedAtDesc(tenantId, effectiveStatus)
                .stream()
                .map(paymentMapper::toResponse)
                .toList();
    }
}
