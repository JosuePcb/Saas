package com.saas.modules.billing.controllers;

import com.saas.modules.billing.dtos.CreatePaymentRequest;
import com.saas.modules.billing.dtos.PaymentResponse;
import com.saas.modules.billing.models.PaymentStatus;
import com.saas.modules.billing.services.PaymentQueryService;
import com.saas.modules.billing.services.PaymentSubmissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/billing/payments")
@SecurityRequirement(name = "bearer-jwt")
@Tag(name = "Billing", description = "Tenant local billing payment submission and tracking")
public class PaymentController {

    private final PaymentSubmissionService paymentSubmissionService;
    private final PaymentQueryService paymentQueryService;

    public PaymentController(PaymentSubmissionService paymentSubmissionService,
                             PaymentQueryService paymentQueryService) {
        this.paymentSubmissionService = paymentSubmissionService;
        this.paymentQueryService = paymentQueryService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN_PYME')")
    @Operation(summary = "Submit tenant local payment for manual validation")
    public ResponseEntity<PaymentResponse> submit(@Valid @RequestBody CreatePaymentRequest request) {
        PaymentResponse response = paymentSubmissionService.submit(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN_PYME')")
    @Operation(summary = "List current tenant submitted payments")
    public ResponseEntity<List<PaymentResponse>> list(@RequestParam(required = false) PaymentStatus status) {
        return ResponseEntity.ok(paymentQueryService.listCurrentTenantPayments(status));
    }
}
