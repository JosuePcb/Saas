package com.saas.modules.logistics.services;

import com.saas.core.exceptions.BusinessException;
import com.saas.core.exceptions.ResourceNotFoundException;
import com.saas.core.tenant.TenantContext;
import com.saas.modules.logistics.dtos.CreateRouteRequest;
import com.saas.modules.logistics.dtos.DriverAssignedRouteResponse;
import com.saas.modules.logistics.dtos.DriverAssignedStopResponse;
import com.saas.modules.logistics.dtos.DriverOfflineRoutePacketResponse;
import com.saas.modules.logistics.dtos.DriverOfflineStopResponse;
import com.saas.modules.logistics.dtos.RouteSyncUploadResponse;
import com.saas.modules.logistics.dtos.RouteResponse;
import com.saas.modules.logistics.dtos.UploadRouteSyncEventRequest;
import com.saas.modules.logistics.dtos.UploadRouteSyncRequest;
import com.saas.modules.logistics.models.Order;
import com.saas.modules.logistics.models.OrderStatus;
import com.saas.modules.logistics.models.OrderStatusHistory;
import com.saas.modules.logistics.models.Route;
import com.saas.modules.logistics.models.RouteStatus;
import com.saas.modules.logistics.models.SyncConflict;
import com.saas.modules.logistics.models.SyncEvent;
import com.saas.modules.logistics.models.SyncEventType;
import com.saas.modules.logistics.models.RouteStop;
import com.saas.modules.logistics.repositories.OrderRepository;
import com.saas.modules.logistics.repositories.OrderStatusHistoryRepository;
import com.saas.modules.logistics.repositories.RouteRepository;
import com.saas.modules.logistics.repositories.RouteStopRepository;
import com.saas.modules.logistics.repositories.SyncConflictRepository;
import com.saas.modules.logistics.repositories.SyncEventRepository;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class RouteService {

    private static final String MSG_CREATED_ONLY = "Only CREATED orders can be assigned to a route";
    private static final String MSG_ROUTE_START_STATE = "Route must be ASSIGNED before start";
    private static final String MSG_ROUTE_COMPLETE_STATE = "Route must be IN_PROGRESS before completion";
    private static final String MSG_ORDERS_FOR_START = "Route orders must be ASSIGNED before start";
    private static final String MSG_ORDERS_FOR_COMPLETE = "Route orders must be IN_TRANSIT before completion";
    private static final Set<RouteStatus> DRIVER_VISIBLE_STATUSES = Set.of(RouteStatus.ASSIGNED, RouteStatus.IN_PROGRESS);

    private final RouteRepository routeRepository;
    private final RouteStopRepository routeStopRepository;
    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final VehicleService vehicleService;
    private final SyncEventRepository syncEventRepository;
    private final SyncConflictRepository syncConflictRepository;
    private final MeterRegistry meterRegistry;

    public RouteService(RouteRepository routeRepository,
                        RouteStopRepository routeStopRepository,
                        OrderRepository orderRepository,
                        OrderStatusHistoryRepository orderStatusHistoryRepository,
                        VehicleService vehicleService,
                        SyncEventRepository syncEventRepository,
                        SyncConflictRepository syncConflictRepository,
                        MeterRegistry meterRegistry) {
        this.routeRepository = routeRepository;
        this.routeStopRepository = routeStopRepository;
        this.orderRepository = orderRepository;
        this.orderStatusHistoryRepository = orderStatusHistoryRepository;
        this.vehicleService = vehicleService;
        this.syncEventRepository = syncEventRepository;
        this.syncConflictRepository = syncConflictRepository;
        this.meterRegistry = meterRegistry;
    }

    @Transactional
    public RouteResponse create(CreateRouteRequest request) {
        return create(request, false, BigDecimal.ZERO);
    }

    @Transactional
    public RouteResponse create(CreateRouteRequest request, boolean optimizedByAi, Double estimatedDistanceKm) {
        BigDecimal safeEstimatedDistance = normalizeEstimatedDistance(estimatedDistanceKm);
        return create(request, optimizedByAi, safeEstimatedDistance);
    }

    private RouteResponse create(CreateRouteRequest request, boolean optimizedByAi, BigDecimal estimatedDistanceKm) {
        UUID tenantId = requiredTenantId();
        vehicleService.assertAssignable(request.vehicleId());

        List<Order> orders = findTenantOrders(request.orderIds(), tenantId);
        validateAllOrdersInStatus(orders, OrderStatus.CREATED, MSG_CREATED_ONLY);

        Route route = Route.builder()
                .tenantId(tenantId)
                .vehicleId(request.vehicleId())
                .driverId(request.driverId())
                .status(RouteStatus.ASSIGNED)
                .optimizedByAi(optimizedByAi)
                .estimatedDistanceKm(estimatedDistanceKm)
                .build();
        Route savedRoute = routeRepository.save(route);

        List<RouteStop> stops = buildStops(savedRoute.getId(), request.orderIds());
        routeStopRepository.saveAll(stops);

        transitionOrders(orders, tenantId, OrderStatus.ASSIGNED);

        return toResponse(savedRoute, request.orderIds());
    }

    @Transactional
    public RouteResponse start(UUID routeId) {
        UUID tenantId = requiredTenantId();
        Route route = findRoute(routeId, tenantId);
        return startInternal(route, tenantId);
    }

    @Transactional
    public RouteResponse startByDriver(UUID routeId, UUID driverId) {
        UUID tenantId = requiredTenantId();
        Route route = findRouteByDriver(routeId, tenantId, driverId);
        return startInternal(route, tenantId);
    }

    @Transactional
    public RouteResponse complete(UUID routeId) {
        UUID tenantId = requiredTenantId();
        Route route = findRoute(routeId, tenantId);
        return completeInternal(route, tenantId);
    }

    @Transactional
    public RouteResponse completeByDriver(UUID routeId, UUID driverId) {
        UUID tenantId = requiredTenantId();
        Route route = findRouteByDriver(routeId, tenantId, driverId);
        return completeInternal(route, tenantId);
    }

    @Transactional(readOnly = true)
    public List<DriverAssignedRouteResponse> getAssignedRoutes(UUID driverId) {
        UUID tenantId = requiredTenantId();
        List<Route> routes = routeRepository.findByTenantIdAndDriverIdAndStatusInOrderByCreatedAtDesc(
                tenantId,
                driverId,
                DRIVER_VISIBLE_STATUSES
        );

        return routes.stream()
                .map(route -> toDriverAssignedRoute(route, tenantId))
                .toList();
    }

    @Transactional(readOnly = true)
    public DriverOfflineRoutePacketResponse getOfflinePacket(UUID routeId, UUID driverId) {
        UUID tenantId = requiredTenantId();
        Route route = findRouteByDriver(routeId, tenantId, driverId);

        List<RouteStop> stops = routeStopRepository.findByRouteIdOrderByStopOrderAsc(route.getId());
        List<UUID> orderIds = stops.stream().map(RouteStop::getOrderId).toList();
        List<Order> orders = findTenantOrders(orderIds, tenantId);
        Map<UUID, Order> ordersById = toOrdersById(orders);

        List<DriverOfflineStopResponse> packetStops = stops.stream()
                .map(stop -> {
                    Order order = ordersById.get(stop.getOrderId());
                    return new DriverOfflineStopResponse(
                            stop.getOrderId(),
                            stop.getStopOrder(),
                            order.getTrackingCode(),
                            order.getStatus(),
                            order.getNormalizedAddress(),
                            order.getNormalizationConfidence(),
                            order.isNormalizationFallbackUsed()
                    );
                })
                .toList();

        return new DriverOfflineRoutePacketResponse(
                route.getId(),
                route.getVehicleId(),
                route.getStatus(),
                LocalDateTime.now(),
                packetStops
        );
    }

    @Transactional
    public RouteSyncUploadResponse uploadSyncEvents(UUID routeId, UUID driverId, UploadRouteSyncRequest request) {
        UUID tenantId = requiredTenantId();
        Route route = findRouteByDriver(routeId, tenantId, driverId);
        Set<UUID> routeOrderIds = getRouteOrderIds(route.getId()).stream().collect(java.util.stream.Collectors.toSet());

        int accepted = 0;
        int duplicates = 0;
        int conflicts = 0;

        for (UploadRouteSyncEventRequest event : request.events()) {
            if (syncEventRepository.findByTenantIdAndDeviceIdAndClientEventId(tenantId, request.deviceId(), event.clientEventId())
                    .isPresent()) {
                duplicates++;
                incrementSyncMetric("duplicate");
                continue;
            }

            SyncEvent savedEvent = syncEventRepository.save(SyncEvent.builder()
                    .tenantId(tenantId)
                    .deviceId(request.deviceId())
                    .clientEventId(event.clientEventId())
                    .routeId(route.getId())
                    .orderId(event.orderId())
                    .eventType(event.eventType())
                    .eventPayload(buildEventPayload(event))
                    .eventOccurredAt(event.eventOccurredAt())
                    .build());

            if (event.eventType() != SyncEventType.STATUS_CHANGE) {
                accepted++;
                continue;
            }

            if (event.orderId() == null || event.targetStatus() == null || !routeOrderIds.contains(event.orderId())) {
                recordConflict(tenantId, savedEvent.getId(), event.orderId(), "INVALID_EVENT", "SERVER_WINS");
                conflicts++;
                incrementSyncMetric("conflict");
                continue;
            }

            Order order = orderRepository.findByIdAndTenantId(event.orderId(), tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Order", "id", event.orderId()));

            if (!order.getStatus().canTransitionTo(event.targetStatus())) {
                recordConflict(tenantId, savedEvent.getId(), order.getId(), "STATUS_TRANSITION_INVALID", "SERVER_WINS");
                conflicts++;
                incrementSyncMetric("conflict");
                continue;
            }

            order.setStatus(event.targetStatus());
            orderRepository.save(order);
            appendHistory(order.getId(), tenantId, event.targetStatus());
            accepted++;
            incrementSyncMetric("accepted");
        }

        return new RouteSyncUploadResponse(request.events().size(), accepted, duplicates, conflicts);
    }

    private RouteResponse startInternal(Route route, UUID tenantId) {
        if (route.getStatus() != RouteStatus.ASSIGNED) {
            throw new BusinessException(MSG_ROUTE_START_STATE, HttpStatus.CONFLICT);
        }

        List<UUID> orderIds = getRouteOrderIds(route.getId());
        List<Order> orders = findTenantOrders(orderIds, tenantId);
        validateAllOrdersInStatus(orders, OrderStatus.ASSIGNED, MSG_ORDERS_FOR_START);
        transitionOrders(orders, tenantId, OrderStatus.IN_TRANSIT);

        route.setStatus(RouteStatus.IN_PROGRESS);
        Route saved = routeRepository.save(route);
        return toResponse(saved, orderIds);
    }

    private RouteResponse completeInternal(Route route, UUID tenantId) {
        if (route.getStatus() != RouteStatus.IN_PROGRESS) {
            throw new BusinessException(MSG_ROUTE_COMPLETE_STATE, HttpStatus.CONFLICT);
        }

        List<UUID> orderIds = getRouteOrderIds(route.getId());
        List<Order> orders = findTenantOrders(orderIds, tenantId);
        validateAllOrdersInStatus(orders, OrderStatus.IN_TRANSIT, MSG_ORDERS_FOR_COMPLETE);
        transitionOrders(orders, tenantId, OrderStatus.DELIVERED);

        route.setStatus(RouteStatus.COMPLETED);
        Route saved = routeRepository.save(route);
        return toResponse(saved, orderIds);
    }

    private DriverAssignedRouteResponse toDriverAssignedRoute(Route route, UUID tenantId) {
        List<RouteStop> stops = routeStopRepository.findByRouteIdOrderByStopOrderAsc(route.getId());
        List<UUID> orderIds = stops.stream().map(RouteStop::getOrderId).toList();
        List<Order> orders = findTenantOrders(orderIds, tenantId);
        Map<UUID, Order> ordersById = toOrdersById(orders);

        List<DriverAssignedStopResponse> stopResponses = stops.stream()
                .map(stop -> {
                    Order order = ordersById.get(stop.getOrderId());
                    return new DriverAssignedStopResponse(
                            stop.getOrderId(),
                            stop.getStopOrder(),
                            order.getTrackingCode(),
                            order.getStatus(),
                            stop.getEta()
                    );
                })
                .toList();

        return new DriverAssignedRouteResponse(
                route.getId(),
                route.getVehicleId(),
                route.getStatus(),
                route.getCreatedAt(),
                stopResponses
        );
    }

    private Route findRoute(UUID routeId, UUID tenantId) {
        return routeRepository.findByIdAndTenantId(routeId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Route", "id", routeId));
    }

    private Route findRouteByDriver(UUID routeId, UUID tenantId, UUID driverId) {
        return routeRepository.findByIdAndTenantIdAndDriverId(routeId, tenantId, driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Route", "id", routeId));
    }

    private Map<UUID, Order> toOrdersById(List<Order> orders) {
        return orders.stream().collect(java.util.stream.Collectors.toMap(Order::getId, order -> order));
    }

    private String buildEventPayload(UploadRouteSyncEventRequest event) {
        if (event.eventType() == SyncEventType.STATUS_CHANGE && event.targetStatus() != null) {
            return "{\"targetStatus\":\"" + event.targetStatus().name() + "\"}";
        }
        return "{}";
    }

    private void recordConflict(UUID tenantId,
                                UUID syncEventId,
                                UUID orderId,
                                String conflictType,
                                String serverResolution) {
        syncConflictRepository.save(SyncConflict.builder()
                .tenantId(tenantId)
                .syncEventId(syncEventId)
                .orderId(orderId)
                .conflictType(conflictType)
                .serverResolution(serverResolution)
                .build());
    }

    private void incrementSyncMetric(String outcome) {
        meterRegistry.counter("logistics.route.sync.events", "outcome", outcome).increment();
    }

    private List<Order> findTenantOrders(List<UUID> orderIds, UUID tenantId) {
        List<Order> orders = orderRepository.findAllByIdInAndTenantId(orderIds, tenantId);
        Set<UUID> found = new HashSet<>(orders.stream().map(Order::getId).toList());
        if (orders.size() != orderIds.size() || !found.containsAll(orderIds)) {
            throw new ResourceNotFoundException("Order", "id", "one or more ids not found in tenant");
        }
        return orders;
    }

    private List<RouteStop> buildStops(UUID routeId, List<UUID> orderIds) {
        return java.util.stream.IntStream.range(0, orderIds.size())
                .mapToObj(i -> RouteStop.builder()
                        .routeId(routeId)
                        .orderId(orderIds.get(i))
                        .stopOrder(i + 1)
                        .build())
                .toList();
    }

    private List<UUID> getRouteOrderIds(UUID routeId) {
        return routeStopRepository.findByRouteIdOrderByStopOrderAsc(routeId)
                .stream()
                .map(RouteStop::getOrderId)
                .toList();
    }

    private void appendHistory(UUID orderId, UUID tenantId, OrderStatus status) {
        orderStatusHistoryRepository.save(OrderStatusHistory.builder()
                .orderId(orderId)
                .tenantId(tenantId)
                .status(status)
                .changedBy(resolveActorId())
                .build());
    }

    private UUID resolveActorId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            return null;
        }
        try {
            return UUID.fromString(authentication.getPrincipal().toString());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private void validateAllOrdersInStatus(List<Order> orders, OrderStatus expectedStatus, String message) {
        if (orders.stream().anyMatch(order -> order.getStatus() != expectedStatus)) {
            throw new BusinessException(message, HttpStatus.CONFLICT);
        }
    }

    private void transitionOrders(List<Order> orders, UUID tenantId, OrderStatus nextStatus) {
        orders.forEach(order -> order.setStatus(nextStatus));
        orderRepository.saveAll(orders);
        orders.forEach(order -> appendHistory(order.getId(), tenantId, nextStatus));
    }

    private RouteResponse toResponse(Route route, List<UUID> orderIds) {
        return new RouteResponse(
                route.getId(),
                route.getVehicleId(),
                route.getStatus(),
                route.isOptimizedByAi(),
                route.getEstimatedDistanceKm(),
                orderIds,
                route.getCreatedAt(),
                route.getUpdatedAt()
        );
    }

    private BigDecimal normalizeEstimatedDistance(Double estimatedDistanceKm) {
        if (estimatedDistanceKm == null) {
            return BigDecimal.ZERO;
        }
        if (estimatedDistanceKm < 0) {
            throw new BusinessException("Estimated distance must be >= 0", HttpStatus.BAD_REQUEST);
        }
        return BigDecimal.valueOf(estimatedDistanceKm).setScale(2, RoundingMode.HALF_UP);
    }

    private UUID requiredTenantId() {
        UUID tenantId = TenantContext.getCurrentTenantId();
        if (tenantId == null) {
            throw new BusinessException("Tenant context is required");
        }
        return tenantId;
    }
}
