package com.saas.modules.billing.controllers;

import com.saas.core.exceptions.BusinessException;
import com.saas.modules.billing.dtos.AdminPaymentResponse;
import com.saas.modules.billing.dtos.PaymentDecisionRequest;
import com.saas.modules.billing.models.PaymentStatus;
import com.saas.modules.billing.services.PaymentReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/billing/payments")
@SecurityRequirement(name = "bearer-jwt")
@Tag(name = "Admin Billing", description = "SuperAdmin payment review queue and decision workflow")
public class AdminPaymentController {

    private final PaymentReviewService paymentReviewService;

    public AdminPaymentController(PaymentReviewService paymentReviewService) {
        this.paymentReviewService = paymentReviewService;
    }

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "List payment review queue for superadmin")
    public ResponseEntity<List<AdminPaymentResponse>> listQueue(
            @RequestParam(required = false) PaymentStatus status
    ) {
        PaymentStatus effectiveStatus = status == null ? PaymentStatus.PENDING_VALIDATION : status;
        return ResponseEntity.ok(paymentReviewService.listQueue(effectiveStatus));
    }

    @PostMapping("/{paymentId}/decision")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Approve or reject pending payment")
    public ResponseEntity<AdminPaymentResponse> decide(
            @PathVariable UUID paymentId,
            @Valid @RequestBody PaymentDecisionRequest request,
            Authentication authentication
    ) {
        UUID reviewerUserId;
        try {
            reviewerUserId = UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException ex) {
            throw new BusinessException("Reviewer user id is invalid");
        }
        return ResponseEntity.ok(paymentReviewService.applyDecision(paymentId, request, reviewerUserId));
    }
}
