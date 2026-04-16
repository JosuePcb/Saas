package com.saas.modules.logistics.controllers;

import com.saas.modules.logistics.dtos.CreateRouteRequest;
import com.saas.modules.logistics.dtos.DriverAssignedRouteResponse;
import com.saas.modules.logistics.dtos.DriverOfflineRoutePacketResponse;
import com.saas.modules.logistics.dtos.RouteSyncUploadResponse;
import com.saas.modules.logistics.dtos.RouteResponse;
import com.saas.modules.logistics.dtos.UploadRouteSyncRequest;
import com.saas.modules.logistics.services.RouteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/logistics/routes")
@SecurityRequirement(name = "bearer-jwt")
@Tag(name = "Logistics Routes", description = "Tenant-scoped route assignment and execution")
public class RouteController {

    private final RouteService routeService;

    public RouteController(RouteService routeService) {
        this.routeService = routeService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN_PYME', 'DESPACHADOR')")
    @Operation(summary = "Create and assign route")
    public ResponseEntity<RouteResponse> create(@Valid @RequestBody CreateRouteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(routeService.create(request));
    }

    @PostMapping("/{id}/start")
    @PreAuthorize("hasAnyRole('ADMIN_PYME', 'DESPACHADOR')")
    @Operation(summary = "Start route execution")
    public ResponseEntity<RouteResponse> start(@PathVariable UUID id) {
        return ResponseEntity.ok(routeService.start(id));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN_PYME', 'DESPACHADOR')")
    @Operation(summary = "Complete route execution")
    public ResponseEntity<RouteResponse> complete(@PathVariable UUID id) {
        return ResponseEntity.ok(routeService.complete(id));
    }

    @GetMapping("/assigned")
    @PreAuthorize("hasRole('CHOFER')")
    @Operation(summary = "List assigned routes for authenticated driver")
    public ResponseEntity<List<DriverAssignedRouteResponse>> assigned(Authentication authentication) {
        return ResponseEntity.ok(routeService.getAssignedRoutes(requiredUserId(authentication)));
    }

    @PostMapping("/{id}/driver-start")
    @PreAuthorize("hasRole('CHOFER')")
    @Operation(summary = "Start assigned route as driver")
    public ResponseEntity<RouteResponse> startByDriver(@PathVariable UUID id, Authentication authentication) {
        return ResponseEntity.ok(routeService.startByDriver(id, requiredUserId(authentication)));
    }

    @PostMapping("/{id}/driver-complete")
    @PreAuthorize("hasRole('CHOFER')")
    @Operation(summary = "Complete in-progress route as driver")
    public ResponseEntity<RouteResponse> completeByDriver(@PathVariable UUID id, Authentication authentication) {
        return ResponseEntity.ok(routeService.completeByDriver(id, requiredUserId(authentication)));
    }

    @GetMapping("/{id}/offline-packet")
    @PreAuthorize("hasRole('CHOFER')")
    @Operation(summary = "Get offline route packet for authenticated driver")
    public ResponseEntity<DriverOfflineRoutePacketResponse> offlinePacket(@PathVariable UUID id,
                                                                           Authentication authentication) {
        return ResponseEntity.ok(routeService.getOfflinePacket(id, requiredUserId(authentication)));
    }

    @PostMapping("/{id}/sync")
    @PreAuthorize("hasRole('CHOFER')")
    @Operation(summary = "Upload offline sync events for authenticated driver")
    public ResponseEntity<RouteSyncUploadResponse> uploadSync(@PathVariable UUID id,
                                                              @Valid @RequestBody UploadRouteSyncRequest request,
                                                              Authentication authentication) {
        return ResponseEntity.ok(routeService.uploadSyncEvents(id, requiredUserId(authentication), request));
    }

    private UUID requiredUserId(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new IllegalArgumentException("Authenticated user id is required");
        }
        return UUID.fromString(authentication.getPrincipal().toString());
    }
}
