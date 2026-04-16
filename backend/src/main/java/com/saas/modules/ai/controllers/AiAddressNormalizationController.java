package com.saas.modules.ai.controllers;

import com.saas.modules.ai.dtos.AddressNormalizationAttemptResponse;
import com.saas.modules.ai.dtos.AddressNormalizationRequest;
import com.saas.modules.ai.dtos.AddressNormalizationResponse;
import com.saas.modules.ai.dtos.ManualAddressCorrectionRequest;
import com.saas.modules.ai.dtos.RouteOptimizationConfirmRequest;
import com.saas.modules.ai.dtos.RouteOptimizationConfirmResponse;
import com.saas.modules.ai.dtos.RouteOptimizationPreviewRequest;
import com.saas.modules.ai.dtos.RouteOptimizationPreviewResponse;
import com.saas.modules.ai.services.AiAddressNormalizationService;
import com.saas.modules.ai.services.RouteOptimizationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/ai/address-normalizations")
@SecurityRequirement(name = "bearer-jwt")
@Tag(name = "AI Address Normalization", description = "Gemini-only address normalization and manual review flow")
public class AiAddressNormalizationController {

    private final AiAddressNormalizationService aiAddressNormalizationService;
    private final RouteOptimizationService routeOptimizationService;

    public AiAddressNormalizationController(AiAddressNormalizationService aiAddressNormalizationService,
                                            RouteOptimizationService routeOptimizationService) {
        this.aiAddressNormalizationService = aiAddressNormalizationService;
        this.routeOptimizationService = routeOptimizationService;
    }

    @PostMapping("/{orderId}")
    @PreAuthorize("hasAnyRole('ADMIN_PYME', 'DESPACHADOR')")
    @Operation(summary = "Normalize order address using Gemini-only provider")
    public ResponseEntity<AddressNormalizationResponse> normalize(@PathVariable UUID orderId,
                                                                  @Valid @RequestBody AddressNormalizationRequest request) {
        return ResponseEntity.ok(aiAddressNormalizationService.normalize(orderId, request));
    }

    @PostMapping("/{orderId}/manual-correction")
    @PreAuthorize("hasAnyRole('ADMIN_PYME', 'DESPACHADOR')")
    @Operation(summary = "Apply manual correction for review-required normalization")
    public ResponseEntity<AddressNormalizationAttemptResponse> manualCorrection(@PathVariable UUID orderId,
                                                                                 @Valid @RequestBody ManualAddressCorrectionRequest request) {
        return ResponseEntity.ok(aiAddressNormalizationService.applyManualCorrection(orderId, request));
    }

    @GetMapping("/{orderId}/attempts/latest")
    @PreAuthorize("hasAnyRole('ADMIN_PYME', 'DESPACHADOR')")
    @Operation(summary = "Get latest normalization attempt for an order")
    public ResponseEntity<AddressNormalizationAttemptResponse> latestAttempt(@PathVariable UUID orderId) {
        return ResponseEntity.ok(aiAddressNormalizationService.getLatestAttempt(orderId));
    }

    @PostMapping("/routes/optimization/preview")
    @PreAuthorize("hasAnyRole('ADMIN_PYME', 'DESPACHADOR')")
    @Operation(summary = "Preview deterministic route optimization for up to 50 stops")
    public ResponseEntity<RouteOptimizationPreviewResponse> previewRouteOptimization(
            @Valid @RequestBody RouteOptimizationPreviewRequest request) {
        return ResponseEntity.ok(routeOptimizationService.preview(request));
    }

    @PostMapping("/routes/optimization/confirm")
    @PreAuthorize("hasAnyRole('ADMIN_PYME', 'DESPACHADOR')")
    @Operation(summary = "Confirm route optimization preview and create route")
    public ResponseEntity<RouteOptimizationConfirmResponse> confirmRouteOptimization(
            @Valid @RequestBody RouteOptimizationConfirmRequest request) {
        return ResponseEntity.ok(routeOptimizationService.confirm(request));
    }
}
