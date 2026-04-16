package com.saas.modules.logistics.controllers;

import com.saas.modules.logistics.dtos.ChangeOrderStatusRequest;
import com.saas.modules.logistics.dtos.DispatcherTrackingResponse;
import com.saas.modules.logistics.dtos.AddressNormalizationResponse;
import com.saas.modules.logistics.dtos.NormalizeAddressRequest;
import com.saas.modules.logistics.dtos.OrderHistoryResponse;
import com.saas.modules.logistics.dtos.OrderResponse;
import com.saas.modules.logistics.dtos.PodMetadataResponse;
import com.saas.modules.logistics.services.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/logistics/orders")
@SecurityRequirement(name = "bearer-jwt")
@Tag(name = "Logistics Orders", description = "Tenant-scoped order lifecycle management")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN_PYME', 'DESPACHADOR')")
    @Operation(summary = "Create order in current tenant")
    public ResponseEntity<OrderResponse> create() {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.create());
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN_PYME', 'DESPACHADOR')")
    @Operation(summary = "Change order status in current tenant")
    public ResponseEntity<OrderResponse> changeStatus(@PathVariable UUID id,
                                                      @Valid @RequestBody ChangeOrderStatusRequest request) {
        return ResponseEntity.ok(orderService.changeStatus(id, request.status()));
    }

    @PostMapping("/{id}/normalize-address")
    @PreAuthorize("hasAnyRole('ADMIN_PYME', 'DESPACHADOR')")
    @Operation(summary = "Normalize order address metadata with deterministic confidence policy")
    public ResponseEntity<AddressNormalizationResponse> normalizeAddress(@PathVariable UUID id,
                                                                         @Valid @RequestBody NormalizeAddressRequest request) {
        return ResponseEntity.ok(orderService.normalizeAddress(id, request));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("hasAnyRole('ADMIN_PYME', 'DESPACHADOR')")
    @Operation(summary = "Get immutable order status history")
    public ResponseEntity<List<OrderHistoryResponse>> history(@PathVariable UUID id) {
        return ResponseEntity.ok(orderService.getHistory(id));
    }

    @GetMapping("/dispatcher-tracking")
    @PreAuthorize("hasAnyRole('ADMIN_PYME', 'DESPACHADOR')")
    @Operation(summary = "Get dispatcher tenant-scoped operational tracking view")
    public ResponseEntity<DispatcherTrackingResponse> dispatcherTracking() {
        return ResponseEntity.ok(orderService.getDispatcherTracking());
    }

    @PostMapping(path = "/{id}/pod", consumes = "multipart/form-data")
    @PreAuthorize("hasAnyRole('ADMIN_PYME', 'DESPACHADOR')")
    @Operation(summary = "Upload proof-of-delivery metadata")
    public ResponseEntity<PodMetadataResponse> uploadPod(@PathVariable UUID id,
                                                         @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.uploadPod(id, file));
    }

    @GetMapping("/{id}/pod")
    @PreAuthorize("hasAnyRole('ADMIN_PYME', 'DESPACHADOR')")
    @Operation(summary = "Get proof-of-delivery metadata")
    public ResponseEntity<PodMetadataResponse> getPod(@PathVariable UUID id) {
        return ResponseEntity.ok(orderService.getPod(id));
    }
}
