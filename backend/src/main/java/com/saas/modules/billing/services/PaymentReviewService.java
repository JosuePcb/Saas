package com.saas.modules.billing.services;

import com.saas.core.exceptions.BusinessException;
import com.saas.core.exceptions.ResourceNotFoundException;
import com.saas.modules.billing.dtos.AdminPaymentResponse;
import com.saas.modules.billing.dtos.PaymentDecision;
import com.saas.modules.billing.dtos.PaymentDecisionRequest;
import com.saas.modules.billing.events.PaymentDecisionEvent;
import com.saas.modules.billing.models.Payment;
import com.saas.modules.billing.models.PaymentStatus;
import com.saas.modules.billing.repositories.PaymentRepository;
import com.saas.modules.identity.models.Tenant;
import com.saas.modules.identity.models.TenantStatus;
import com.saas.modules.identity.repositories.TenantRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class PaymentReviewService {

    private final PaymentRepository paymentRepository;
    private final TenantRepository tenantRepository;
    private final ApplicationEventPublisher eventPublisher;

    public PaymentReviewService(PaymentRepository paymentRepository,
                                TenantRepository tenantRepository,
                                ApplicationEventPublisher eventPublisher) {
        this.paymentRepository = paymentRepository;
        this.tenantRepository = tenantRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional(readOnly = true)
    public List<AdminPaymentResponse> listQueue(PaymentStatus status) {
        PaymentStatus effectiveStatus = status == null ? PaymentStatus.PENDING_VALIDATION : status;
        return paymentRepository.findByStatusOrderByCreatedAtAsc(effectiveStatus)
                .stream()
                .map(this::toAdminResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<UUID, Long> pendingQueueSummaryByTenant() {
        Map<UUID, Long> summary = new HashMap<>();
        for (Object[] row : paymentRepository.countByTenantIdForStatus(PaymentStatus.PENDING_VALIDATION)) {
            summary.put((UUID) row[0], ((Number) row[1]).longValue());
        }
        return summary;
    }

    @Transactional
    public AdminPaymentResponse applyDecision(UUID paymentId, PaymentDecisionRequest request, UUID reviewerUserId) {
        if (paymentId == null) {
            throw new BusinessException("Payment id is required");
        }
        if (request == null || request.decision() == null) {
            throw new BusinessException("Decision is required");
        }
        if (request.comment() == null || request.comment().isBlank()) {
            throw new BusinessException("Decision comment is required");
        }
        if (reviewerUserId == null) {
            throw new BusinessException("Reviewer user id is required");
        }

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        if (payment.getStatus() != PaymentStatus.PENDING_VALIDATION) {
            throw new BusinessException("Payment decision can only be applied from PENDING_VALIDATION");
        }

        LocalDateTime reviewedAt = LocalDateTime.now();
        payment.setStatus(request.decision() == PaymentDecision.APPROVE ? PaymentStatus.APPROVED : PaymentStatus.REJECTED);
        payment.setDecisionComment(request.comment().trim());
        payment.setReviewedByUserId(reviewerUserId);
        payment.setReviewedAt(reviewedAt);

        Tenant tenant = tenantRepository.findById(payment.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", "id", payment.getTenantId()));

        if (request.decision() == PaymentDecision.APPROVE) {
            tenant.setStatus(TenantStatus.ACTIVE);
            tenant.setFechaCorte(reviewedAt.plusMonths(1));
        } else {
            tenant.setStatus(TenantStatus.SUSPENDED);
        }

        tenantRepository.save(tenant);
        Payment saved = paymentRepository.save(payment);
        eventPublisher.publishEvent(new PaymentDecisionEvent(
                saved.getId(),
                saved.getTenantId(),
                saved.getStatus(),
                reviewerUserId,
                saved.getDecisionComment()
        ));
        return toAdminResponse(saved);
    }

    private AdminPaymentResponse toAdminResponse(Payment payment) {
        return new AdminPaymentResponse(
                payment.getId(),
                payment.getTenantId(),
                payment.getMethod(),
                payment.getStatus(),
                payment.getAmount(),
                payment.getReferenceNumber(),
                payment.getPaymentDateTime(),
                payment.getEvidenceUrl(),
                payment.getCreatedAt(),
                payment.getDecisionComment(),
                payment.getReviewedByUserId(),
                payment.getReviewedAt()
        );
    }
}
