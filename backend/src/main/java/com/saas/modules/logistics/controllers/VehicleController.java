package com.saas.modules.logistics.controllers;

import com.saas.modules.logistics.dtos.CreateVehicleRequest;
import com.saas.modules.logistics.dtos.UpdateVehicleRequest;
import com.saas.modules.logistics.dtos.VehicleResponse;
import com.saas.modules.logistics.services.VehicleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/logistics/vehicles")
@SecurityRequirement(name = "bearer-jwt")
@Tag(name = "Logistics Vehicles", description = "Tenant-scoped vehicle management")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN_PYME', 'DESPACHADOR')")
    @Operation(summary = "Create vehicle in current tenant")
    public ResponseEntity<VehicleResponse> create(@Valid @RequestBody CreateVehicleRequest request) {
        VehicleResponse response = vehicleService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN_PYME', 'DESPACHADOR')")
    @Operation(summary = "List vehicles in current tenant")
    public ResponseEntity<List<VehicleResponse>> list() {
        return ResponseEntity.ok(vehicleService.list());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_PYME', 'DESPACHADOR')")
    @Operation(summary = "Get vehicle by id in current tenant")
    public ResponseEntity<VehicleResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(vehicleService.getById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_PYME', 'DESPACHADOR')")
    @Operation(summary = "Update vehicle in current tenant")
    public ResponseEntity<VehicleResponse> update(@PathVariable UUID id,
                                                  @Valid @RequestBody UpdateVehicleRequest request) {
        return ResponseEntity.ok(vehicleService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_PYME', 'DESPACHADOR')")
    @Operation(summary = "Delete vehicle in current tenant")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        vehicleService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
