package com.saas.modules.logistics.controllers;

import com.saas.modules.logistics.services.LogisticsHealthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/logistics")
public class LogisticsHealthController {

    private final LogisticsHealthService logisticsHealthService;

    public LogisticsHealthController(LogisticsHealthService logisticsHealthService) {
        this.logisticsHealthService = logisticsHealthService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", logisticsHealthService.status()));
    }
}
