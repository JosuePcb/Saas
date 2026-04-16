package com.saas.modules.tracking.services;

import com.saas.core.exceptions.ResourceNotFoundException;
import com.saas.modules.logistics.models.Order;
import com.saas.modules.logistics.repositories.OrderRepository;
import com.saas.modules.logistics.repositories.OrderStatusHistoryRepository;
import com.saas.modules.tracking.dtos.PublicTrackingHistoryResponse;
import com.saas.modules.tracking.dtos.PublicTrackingResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TrackingService {

    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;

    public TrackingService(OrderRepository orderRepository,
                           OrderStatusHistoryRepository orderStatusHistoryRepository) {
        this.orderRepository = orderRepository;
        this.orderStatusHistoryRepository = orderStatusHistoryRepository;
    }

    @Transactional(readOnly = true)
    public PublicTrackingResponse getPublicTracking(String trackingCode) {
        Order order = orderRepository.findTopByTrackingCodeOrderByCreatedAtDesc(trackingCode)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "trackingCode", trackingCode));

        List<PublicTrackingHistoryResponse> history = orderStatusHistoryRepository
                .findByOrderIdAndTenantIdOrderByChangedAtAscIdAsc(order.getId(), order.getTenantId())
                .stream()
                .map(item -> new PublicTrackingHistoryResponse(item.getStatus(), item.getChangedAt()))
                .toList();

        OrderRepository.PublicTrackingEnrichmentView enrichment = orderRepository
                .findPublicTrackingEnrichmentByOrderIdAndTenantId(order.getId(), order.getTenantId())
                .stream()
                .findFirst()
                .orElse(null);

        String driverFirstName = enrichment != null ? enrichment.getDriverFirstName() : null;
        return new PublicTrackingResponse(
                order.getTrackingCode(),
                order.getStatus(),
                history,
                driverFirstName,
                enrichment != null ? enrichment.getEta() : null
        );
    }
}
