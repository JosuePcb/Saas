package com.saas.modules.ai.services;

import com.saas.core.exceptions.BusinessException;
import com.saas.core.exceptions.ResourceNotFoundException;
import com.saas.core.tenant.TenantContext;
import com.saas.modules.ai.dtos.RouteOptimizationConfirmRequest;
import com.saas.modules.ai.dtos.RouteOptimizationConfirmResponse;
import com.saas.modules.ai.dtos.RouteOptimizationPreviewRequest;
import com.saas.modules.ai.dtos.RouteOptimizationPreviewResponse;
import com.saas.modules.ai.dtos.RouteOptimizationStopResponse;
import com.saas.modules.logistics.dtos.CreateRouteRequest;
import com.saas.modules.logistics.dtos.RouteResponse;
import com.saas.modules.logistics.models.Order;
import com.saas.modules.logistics.models.OrderStatus;
import com.saas.modules.logistics.repositories.OrderRepository;
import com.saas.modules.logistics.services.RouteService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class RouteOptimizationService {

    private static final int MAX_OPTIMIZATION_STOPS = 50;
    private static final String MAX_STOPS_REASON = "Route optimization is available for up to 50 stops; using original order";

    private final OrderRepository orderRepository;
    private final RouteService routeService;

    public RouteOptimizationService(OrderRepository orderRepository, RouteService routeService) {
        this.orderRepository = orderRepository;
        this.routeService = routeService;
    }

    @Transactional(readOnly = true)
    public RouteOptimizationPreviewResponse preview(RouteOptimizationPreviewRequest request) {
        UUID tenantId = requiredTenantId();
        validateUniqueOrderIds(request.orderIds());

        List<Order> orders = findTenantOrders(request.orderIds(), tenantId);
        validateCreatedOrders(orders);

        if (request.orderIds().size() > MAX_OPTIMIZATION_STOPS) {
            return buildFallbackPreview(tenantId, request, orders);
        }

        OptimizationResult optimized = optimizeDeterministically(orders);
        String signature = signPreview(
                tenantId,
                request.vehicleId(),
                request.driverId(),
                request.orderIds(),
                optimized.optimizedOrderIds(),
                optimized.estimatedDistanceKm(),
                optimized.optimizedByAi()
        );

        return new RouteOptimizationPreviewResponse(
                request.vehicleId(),
                request.driverId(),
                optimized.optimizedByAi(),
                null,
                List.copyOf(request.orderIds()),
                optimized.optimizedOrderIds(),
                optimized.estimatedDistanceKm(),
                signature,
                buildStops(optimized.optimizedOrderIds(), optimized.ordersById())
        );
    }

    @Transactional
    public RouteOptimizationConfirmResponse confirm(RouteOptimizationConfirmRequest request) {
        UUID tenantId = requiredTenantId();
        validateUniqueOrderIds(request.orderIds());
        validateUniqueOrderIds(request.optimizedOrderIds());

        if (request.orderIds().size() != request.optimizedOrderIds().size()) {
            throw new BusinessException("Optimized order ids must contain the same orders", HttpStatus.BAD_REQUEST);
        }

        if (request.orderIds().size() > MAX_OPTIMIZATION_STOPS && request.optimizedByAi()) {
            throw new BusinessException("Route optimization supports up to 50 stops", HttpStatus.BAD_REQUEST);
        }

        Set<UUID> requestedIds = new LinkedHashSet<>(request.orderIds());
        Set<UUID> optimizedIds = new LinkedHashSet<>(request.optimizedOrderIds());
        if (!requestedIds.equals(optimizedIds)) {
            throw new BusinessException("Optimized order ids must contain the same orders", HttpStatus.BAD_REQUEST);
        }

        List<Order> orders = findTenantOrders(request.orderIds(), tenantId);
        validateCreatedOrders(orders);

        String expectedSignature = signPreview(
                tenantId,
                request.vehicleId(),
                request.driverId(),
                request.orderIds(),
                request.optimizedOrderIds(),
                request.estimatedDistanceKm(),
                request.optimizedByAi()
        );

        if (!expectedSignature.equals(request.previewSignature())) {
            throw new BusinessException("Preview signature is invalid or stale", HttpStatus.CONFLICT);
        }

        RouteResponse route = routeService.create(
                new CreateRouteRequest(request.vehicleId(), request.driverId(), request.optimizedOrderIds()),
                request.optimizedByAi(),
                request.estimatedDistanceKm()
        );

        RouteOptimizationPreviewResponse preview = new RouteOptimizationPreviewResponse(
                request.vehicleId(),
                request.driverId(),
                request.optimizedByAi(),
                null,
                List.copyOf(request.orderIds()),
                List.copyOf(request.optimizedOrderIds()),
                request.estimatedDistanceKm(),
                request.previewSignature(),
                buildStops(request.optimizedOrderIds(), toOrderMap(orders))
        );

        return new RouteOptimizationConfirmResponse(preview, route);
    }

    private RouteOptimizationPreviewResponse buildFallbackPreview(UUID tenantId,
                                                                  RouteOptimizationPreviewRequest request,
                                                                  List<Order> orders) {
        Map<UUID, Order> ordersById = toOrderMap(orders);
        double estimatedDistance = estimateDistanceKm(request.orderIds(), ordersById);
        String signature = signPreview(
                tenantId,
                request.vehicleId(),
                request.driverId(),
                request.orderIds(),
                request.orderIds(),
                estimatedDistance,
                false
        );

        return new RouteOptimizationPreviewResponse(
                request.vehicleId(),
                request.driverId(),
                false,
                MAX_STOPS_REASON,
                List.copyOf(request.orderIds()),
                List.copyOf(request.orderIds()),
                estimatedDistance,
                signature,
                buildStops(request.orderIds(), ordersById)
        );
    }

    private OptimizationResult optimizeDeterministically(List<Order> orders) {
        if (orders.size() <= 1) {
            List<UUID> ids = orders.stream().map(Order::getId).toList();
            return new OptimizationResult(ids, 0.0, false, toOrderMap(orders));
        }

        Map<UUID, Order> ordersById = toOrderMap(orders);
        Map<UUID, StopPoint> points = buildPoints(orders);
        List<UUID> pending = new ArrayList<>(points.keySet());
        pending.sort(Comparator.comparing(UUID::toString));

        List<UUID> optimized = new ArrayList<>();
        UUID current = pending.remove(0);
        optimized.add(current);

        while (!pending.isEmpty()) {
            StopPoint from = points.get(current);
            UUID next = pending.stream()
                    .min((left, right) -> {
                        double leftDistance = distanceKm(from, points.get(left));
                        double rightDistance = distanceKm(from, points.get(right));
                        int byDistance = Double.compare(leftDistance, rightDistance);
                        if (byDistance != 0) {
                            return byDistance;
                        }
                        return left.toString().compareTo(right.toString());
                    })
                    .orElseThrow();
            pending.remove(next);
            optimized.add(next);
            current = next;
        }

        double distanceKm = estimateDistanceKm(optimized, ordersById);
        return new OptimizationResult(optimized, distanceKm, true, ordersById);
    }

    private Map<UUID, StopPoint> buildPoints(List<Order> orders) {
        Map<UUID, StopPoint> points = new HashMap<>();
        for (Order order : orders) {
            if (order.getNormalizedLatitude() != null && order.getNormalizedLongitude() != null) {
                points.put(order.getId(), new StopPoint(order.getNormalizedLatitude(), order.getNormalizedLongitude()));
                continue;
            }
            points.put(order.getId(), syntheticPoint(order.getId()));
        }
        return points;
    }

    private StopPoint syntheticPoint(UUID orderId) {
        long hash = orderId.getMostSignificantBits() ^ orderId.getLeastSignificantBits();
        long latSeed = (hash >>> 32) & 0xFFFFFFFFL;
        long lngSeed = hash & 0xFFFFFFFFL;
        double latitude = 8.0 + (latSeed / (double) 0xFFFFFFFFL) * 4.0;
        double longitude = -73.0 + (lngSeed / (double) 0xFFFFFFFFL) * 6.0;
        return new StopPoint(latitude, longitude);
    }

    private double estimateDistanceKm(List<UUID> orderedIds, Map<UUID, Order> ordersById) {
        if (orderedIds.size() <= 1) {
            return 0.0;
        }

        double total = 0.0;
        for (int i = 0; i < orderedIds.size() - 1; i++) {
            StopPoint from = toPoint(ordersById.get(orderedIds.get(i)));
            StopPoint to = toPoint(ordersById.get(orderedIds.get(i + 1)));
            total += distanceKm(from, to);
        }
        return round(total);
    }

    private StopPoint toPoint(Order order) {
        if (order.getNormalizedLatitude() != null && order.getNormalizedLongitude() != null) {
            return new StopPoint(order.getNormalizedLatitude(), order.getNormalizedLongitude());
        }
        return syntheticPoint(order.getId());
    }

    private double distanceKm(StopPoint from, StopPoint to) {
        double earthRadiusKm = 6371.0;
        double latDistance = Math.toRadians(to.latitude() - from.latitude());
        double lonDistance = Math.toRadians(to.longitude() - from.longitude());

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(from.latitude())) * Math.cos(Math.toRadians(to.latitude()))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private String signPreview(UUID tenantId,
                               UUID vehicleId,
                               UUID driverId,
                               List<UUID> originalOrderIds,
                               List<UUID> optimizedOrderIds,
                               Double estimatedDistanceKm,
                               boolean optimizedByAi) {
        String payload = String.join("|",
                tenantId.toString(),
                vehicleId.toString(),
                driverId == null ? "null" : driverId.toString(),
                joinIds(originalOrderIds),
                joinIds(optimizedOrderIds),
                formatDistance(estimatedDistanceKm),
                String.valueOf(optimizedByAi)
        );
        return sha256(payload);
    }

    private String joinIds(List<UUID> ids) {
        return ids.stream().map(UUID::toString).reduce((a, b) -> a + "," + b).orElse("");
    }

    private String formatDistance(Double estimatedDistanceKm) {
        double safeDistance = estimatedDistanceKm == null ? 0.0 : estimatedDistanceKm;
        DecimalFormat symbolsSafe = new DecimalFormat("0.00", DecimalFormatSymbols.getInstance(Locale.US));
        return symbolsSafe.format(Math.max(0.0, safeDistance));
    }

    private String sha256(String payload) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(bytes.length * 2);
            for (byte value : bytes) {
                builder.append(String.format("%02x", value));
            }
            return builder.toString();
        } catch (Exception ex) {
            throw new BusinessException("Unable to compute preview signature", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private List<RouteOptimizationStopResponse> buildStops(List<UUID> orderedIds, Map<UUID, Order> ordersById) {
        List<RouteOptimizationStopResponse> stops = new ArrayList<>();
        for (int index = 0; index < orderedIds.size(); index++) {
            UUID orderId = orderedIds.get(index);
            Order order = ordersById.get(orderId);
            if (order == null) {
                throw new ResourceNotFoundException("Order", "id", orderId);
            }
            stops.add(new RouteOptimizationStopResponse(
                    orderId,
                    index + 1,
                    order.getNormalizedAddress(),
                    order.getNormalizedLatitude(),
                    order.getNormalizedLongitude()
            ));
        }
        return stops;
    }

    private Map<UUID, Order> toOrderMap(List<Order> orders) {
        return orders.stream().collect(java.util.stream.Collectors.toMap(Order::getId, order -> order));
    }

    private List<Order> findTenantOrders(List<UUID> orderIds, UUID tenantId) {
        List<Order> orders = orderRepository.findAllByIdInAndTenantId(orderIds, tenantId);
        Set<UUID> found = new HashSet<>(orders.stream().map(Order::getId).toList());
        if (orders.size() != orderIds.size() || !found.containsAll(orderIds)) {
            throw new ResourceNotFoundException("Order", "id", "one or more ids not found in tenant");
        }
        return orders;
    }

    private void validateCreatedOrders(List<Order> orders) {
        boolean hasInvalid = orders.stream().anyMatch(order -> order.getStatus() != OrderStatus.CREATED);
        if (hasInvalid) {
            throw new BusinessException("Only CREATED orders can be optimized into a route", HttpStatus.CONFLICT);
        }
    }

    private void validateUniqueOrderIds(List<UUID> orderIds) {
        if (orderIds == null || orderIds.isEmpty()) {
            return;
        }
        if (new HashSet<>(orderIds).size() != orderIds.size()) {
            throw new BusinessException("Order ids must be unique", HttpStatus.BAD_REQUEST);
        }
    }

    private UUID requiredTenantId() {
        UUID tenantId = TenantContext.getCurrentTenantId();
        if (tenantId == null) {
            throw new BusinessException("Tenant context is required");
        }
        return tenantId;
    }

    private record StopPoint(double latitude, double longitude) {
    }

    private record OptimizationResult(List<UUID> optimizedOrderIds,
                                      double estimatedDistanceKm,
                                      boolean optimizedByAi,
                                      Map<UUID, Order> ordersById) {
    }
}
