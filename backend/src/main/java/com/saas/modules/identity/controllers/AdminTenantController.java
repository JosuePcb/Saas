package com.saas.modules.identity.controllers;

import com.saas.core.exceptions.BusinessException;
import com.saas.modules.identity.dtos.AdminTenantGlobalMetricsResponse;
import com.saas.modules.identity.dtos.AdminTenantStatusTransitionRequest;
import com.saas.modules.identity.dtos.AdminTenantSummaryResponse;
import com.saas.modules.identity.models.TenantStatus;
import com.saas.modules.identity.services.AdminTenantService;
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
@RequestMapping("/api/admin/tenants")
@SecurityRequirement(name = "bearer-jwt")
@Tag(name = "Admin Tenants", description = "SuperAdmin tenant lifecycle and global metrics")
public class AdminTenantController {

    private final AdminTenantService adminTenantService;

    public AdminTenantController(AdminTenantService adminTenantService) {
        this.adminTenantService = adminTenantService;
    }

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "List tenants for superadmin with optional status filter")
    public ResponseEntity<List<AdminTenantSummaryResponse>> listTenants(
            @RequestParam(required = false) TenantStatus status
    ) {
        return ResponseEntity.ok(adminTenantService.listTenants(status));
    }

    @GetMapping("/metrics")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Get global tenant and billing queue metrics")
    public ResponseEntity<AdminTenantGlobalMetricsResponse> globalMetrics() {
        return ResponseEntity.ok(adminTenantService.globalMetrics());
    }

    @PostMapping("/{tenantId}/suspend")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Suspend tenant with audit-safe transition")
    public ResponseEntity<AdminTenantSummaryResponse> suspendTenant(
            @PathVariable UUID tenantId,
            @Valid @RequestBody AdminTenantStatusTransitionRequest request,
            Authentication authentication
    ) {
        UUID actorUserId = parseActorUserId(authentication);
        return ResponseEntity.ok(adminTenantService.suspendTenant(tenantId, request.reason(), actorUserId));
    }

    @PostMapping("/{tenantId}/reactivate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Reactivate suspended tenant with audit-safe transition")
    public ResponseEntity<AdminTenantSummaryResponse> reactivateTenant(
            @PathVariable UUID tenantId,
            @Valid @RequestBody AdminTenantStatusTransitionRequest request,
            Authentication authentication
    ) {
        UUID actorUserId = parseActorUserId(authentication);
        return ResponseEntity.ok(adminTenantService.reactivateTenant(tenantId, request.reason(), actorUserId));
    }

    private UUID parseActorUserId(Authentication authentication) {
        try {
            return UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException ex) {
            throw new BusinessException("SuperAdmin user id is invalid");
        }
    }
}
