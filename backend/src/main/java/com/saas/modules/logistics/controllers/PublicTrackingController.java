package com.saas.modules.logistics.controllers;

import com.saas.modules.tracking.dtos.PublicTrackingResponse;
import com.saas.modules.tracking.services.TrackingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController("legacyPublicTrackingController")
@RequestMapping("/api/tracking")
@Tag(name = "Public Tracking", description = "Public tracking lookup endpoint")
public class PublicTrackingController {

    private final TrackingService trackingService;

    public PublicTrackingController(TrackingService trackingService) {
        this.trackingService = trackingService;
    }

    @GetMapping("/{trackingCode}")
    @Operation(summary = "Get public tracking status and history")
    public ResponseEntity<PublicTrackingResponse> getByTrackingCode(@PathVariable String trackingCode) {
        return ResponseEntity.ok(trackingService.getPublicTracking(trackingCode));
    }
}
