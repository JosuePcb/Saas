package com.saas.modules.logistics.services;

import com.saas.core.exceptions.BusinessException;
import com.saas.core.exceptions.ResourceNotFoundException;
import com.saas.core.tenant.TenantContext;
import com.saas.modules.logistics.dtos.CreateRouteRequest;
import com.saas.modules.logistics.dtos.DriverOfflineRoutePacketResponse;
import com.saas.modules.logistics.dtos.RouteSyncUploadResponse;
import com.saas.modules.logistics.dtos.UploadRouteSyncEventRequest;
import com.saas.modules.logistics.dtos.UploadRouteSyncRequest;
import com.saas.modules.logistics.dtos.RouteResponse;
import com.saas.modules.logistics.models.Order;
import com.saas.modules.logistics.models.OrderStatus;
import com.saas.modules.logistics.models.OrderStatusHistory;
import com.saas.modules.logistics.models.Route;
import com.saas.modules.logistics.models.RouteStatus;
import com.saas.modules.logistics.models.RouteStop;
import com.saas.modules.logistics.dtos.DriverAssignedRouteResponse;
import com.saas.modules.logistics.repositories.OrderRepository;
import com.saas.modules.logistics.repositories.OrderStatusHistoryRepository;
import com.saas.modules.logistics.repositories.RouteRepository;
import com.saas.modules.logistics.repositories.RouteStopRepository;
import com.saas.modules.logistics.repositories.SyncConflictRepository;
import com.saas.modules.logistics.repositories.SyncEventRepository;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("RouteService unit tests")
class RouteServiceTest {

    @Mock
    private RouteRepository routeRepository;

    @Mock
    private RouteStopRepository routeStopRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Mock
    private VehicleService vehicleService;

    @Mock
    private SyncEventRepository syncEventRepository;

    @Mock
    private SyncConflictRepository syncConflictRepository;

    @Mock
    private MeterRegistry meterRegistry;

    @Mock
    private Counter acceptedCounter;

    @Mock
    private Counter duplicateCounter;

    @Mock
    private Counter conflictCounter;

    @InjectMocks
    private RouteService routeService;

    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        TenantContext.setCurrentTenantId(tenantId);
        lenient().when(meterRegistry.counter("logistics.route.sync.events", "outcome", "accepted")).thenReturn(acceptedCounter);
        lenient().when(meterRegistry.counter("logistics.route.sync.events", "outcome", "duplicate")).thenReturn(duplicateCounter);
        lenient().when(meterRegistry.counter("logistics.route.sync.events", "outcome", "conflict")).thenReturn(conflictCounter);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("should create route and assign all orders")
    void shouldCreateRouteAndAssignAllOrders() {
        UUID vehicleId = UUID.randomUUID();
        UUID orderAId = UUID.randomUUID();
        UUID orderBId = UUID.randomUUID();

        Order orderA = Order.builder().id(orderAId).tenantId(tenantId).status(OrderStatus.CREATED).build();
        Order orderB = Order.builder().id(orderBId).tenantId(tenantId).status(OrderStatus.CREATED).build();

        Route savedRoute = Route.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .vehicleId(vehicleId)
                .status(RouteStatus.ASSIGNED)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(orderRepository.findAllByIdInAndTenantId(List.of(orderAId, orderBId), tenantId))
                .thenReturn(List.of(orderA, orderB));
        when(routeRepository.save(any(Route.class))).thenReturn(savedRoute);
        when(routeStopRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        RouteResponse response = routeService.create(new CreateRouteRequest(vehicleId, null, List.of(orderAId, orderBId)));

        assertThat(response.status()).isEqualTo(RouteStatus.ASSIGNED);
        assertThat(response.optimizedByAi()).isFalse();
        assertThat(response.estimatedDistanceKm()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.orderIds()).containsExactly(orderAId, orderBId);
        verify(vehicleService).assertAssignable(vehicleId);

        ArgumentCaptor<OrderStatusHistory> historyCaptor = ArgumentCaptor.forClass(OrderStatusHistory.class);
        verify(orderStatusHistoryRepository, times(2)).save(historyCaptor.capture());
        assertThat(historyCaptor.getAllValues()).allMatch(h -> h.getStatus() == OrderStatus.ASSIGNED);
    }

    @Test
    @DisplayName("should reject route assignment when order status is not CREATED")
    void shouldRejectRouteAssignmentWhenOrderStatusIsNotCreated() {
        UUID vehicleId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();

        Order order = Order.builder().id(orderId).tenantId(tenantId).status(OrderStatus.ASSIGNED).build();

        when(orderRepository.findAllByIdInAndTenantId(List.of(orderId), tenantId)).thenReturn(List.of(order));

        assertThatThrownBy(() -> routeService.create(new CreateRouteRequest(vehicleId, null, List.of(orderId))))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Only CREATED orders can be assigned to a route")
                .extracting("status")
                .isEqualTo(HttpStatus.CONFLICT);

        verify(routeRepository, never()).save(any(Route.class));
    }

    @Test
    @DisplayName("should start route and move assigned orders to IN_TRANSIT")
    void shouldStartRouteAndMoveAssignedOrdersToInTransit() {
        UUID routeId = UUID.randomUUID();
        UUID actorId = UUID.randomUUID();
        UUID orderAId = UUID.randomUUID();
        UUID orderBId = UUID.randomUUID();

        authenticateAs(actorId);

        Route route = Route.builder()
                .id(routeId)
                .tenantId(tenantId)
                .vehicleId(UUID.randomUUID())
                .status(RouteStatus.ASSIGNED)
                .build();

        Order orderA = Order.builder().id(orderAId).tenantId(tenantId).status(OrderStatus.ASSIGNED).build();
        Order orderB = Order.builder().id(orderBId).tenantId(tenantId).status(OrderStatus.ASSIGNED).build();

        when(routeRepository.findByIdAndTenantId(routeId, tenantId)).thenReturn(Optional.of(route));
        when(routeStopRepository.findByRouteIdOrderByStopOrderAsc(routeId)).thenReturn(List.of(
                RouteStop.builder().routeId(routeId).orderId(orderAId).stopOrder(1).build(),
                RouteStop.builder().routeId(routeId).orderId(orderBId).stopOrder(2).build()
        ));
        when(orderRepository.findAllByIdInAndTenantId(List.of(orderAId, orderBId), tenantId)).thenReturn(List.of(orderA, orderB));
        when(orderRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(routeRepository.save(route)).thenReturn(route);

        RouteResponse response = routeService.start(routeId);

        assertThat(response.status()).isEqualTo(RouteStatus.IN_PROGRESS);
        assertThat(orderA.getStatus()).isEqualTo(OrderStatus.IN_TRANSIT);
        assertThat(orderB.getStatus()).isEqualTo(OrderStatus.IN_TRANSIT);

        ArgumentCaptor<OrderStatusHistory> historyCaptor = ArgumentCaptor.forClass(OrderStatusHistory.class);
        verify(orderStatusHistoryRepository, times(2)).save(historyCaptor.capture());
        assertThat(historyCaptor.getAllValues())
                .allMatch(h -> h.getStatus() == OrderStatus.IN_TRANSIT)
                .allMatch(h -> actorId.equals(h.getChangedBy()));
    }

    @Test
    @DisplayName("should complete route and mark in-transit orders as DELIVERED")
    void shouldCompleteRouteAndMarkInTransitOrdersAsDelivered() {
        UUID routeId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();

        Route route = Route.builder()
                .id(routeId)
                .tenantId(tenantId)
                .vehicleId(UUID.randomUUID())
                .status(RouteStatus.IN_PROGRESS)
                .build();

        Order order = Order.builder().id(orderId).tenantId(tenantId).status(OrderStatus.IN_TRANSIT).build();

        when(routeRepository.findByIdAndTenantId(routeId, tenantId)).thenReturn(Optional.of(route));
        when(routeStopRepository.findByRouteIdOrderByStopOrderAsc(routeId)).thenReturn(List.of(
                RouteStop.builder().routeId(routeId).orderId(orderId).stopOrder(1).build()
        ));
        when(orderRepository.findAllByIdInAndTenantId(List.of(orderId), tenantId)).thenReturn(List.of(order));
        when(orderRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(routeRepository.save(route)).thenReturn(route);

        RouteResponse response = routeService.complete(routeId);

        assertThat(response.status()).isEqualTo(RouteStatus.COMPLETED);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.DELIVERED);
    }

    @Test
    @DisplayName("should enforce tenant scope when starting a route")
    void shouldEnforceTenantScopeWhenStartingRoute() {
        UUID routeId = UUID.randomUUID();
        when(routeRepository.findByIdAndTenantId(routeId, tenantId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> routeService.start(routeId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("should list assigned route stops for current driver")
    void shouldListAssignedRouteStopsForCurrentDriver() {
        UUID driverId = UUID.randomUUID();
        UUID routeId = UUID.randomUUID();
        UUID orderAId = UUID.randomUUID();
        UUID orderBId = UUID.randomUUID();

        Route route = Route.builder()
                .id(routeId)
                .tenantId(tenantId)
                .vehicleId(UUID.randomUUID())
                .driverId(driverId)
                .status(RouteStatus.ASSIGNED)
                .build();

        when(routeRepository.findByTenantIdAndDriverIdAndStatusInOrderByCreatedAtDesc(
                eq(tenantId),
                eq(driverId),
                eq(Set.of(RouteStatus.ASSIGNED, RouteStatus.IN_PROGRESS))
        )).thenReturn(List.of(route));

        when(routeStopRepository.findByRouteIdOrderByStopOrderAsc(routeId)).thenReturn(List.of(
                RouteStop.builder().routeId(routeId).orderId(orderAId).stopOrder(1).build(),
                RouteStop.builder().routeId(routeId).orderId(orderBId).stopOrder(2).build()
        ));

        Order orderA = Order.builder().id(orderAId).tenantId(tenantId).trackingCode("TRK-A").status(OrderStatus.ASSIGNED).build();
        Order orderB = Order.builder().id(orderBId).tenantId(tenantId).trackingCode("TRK-B").status(OrderStatus.IN_TRANSIT).build();
        when(orderRepository.findAllByIdInAndTenantId(List.of(orderAId, orderBId), tenantId)).thenReturn(List.of(orderA, orderB));

        List<DriverAssignedRouteResponse> response = routeService.getAssignedRoutes(driverId);

        assertThat(response).hasSize(1);
        assertThat(response.getFirst().routeId()).isEqualTo(routeId);
        assertThat(response.getFirst().stops()).hasSize(2);
        assertThat(response.getFirst().stops().getFirst().trackingCode()).isEqualTo("TRK-A");
    }

    @Test
    @DisplayName("should allow driver to start assigned route")
    void shouldAllowDriverToStartAssignedRoute() {
        UUID routeId = UUID.randomUUID();
        UUID driverId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();

        authenticateAs(driverId);

        Route route = Route.builder()
                .id(routeId)
                .tenantId(tenantId)
                .vehicleId(UUID.randomUUID())
                .driverId(driverId)
                .status(RouteStatus.ASSIGNED)
                .build();

        Order order = Order.builder().id(orderId).tenantId(tenantId).status(OrderStatus.ASSIGNED).build();

        when(routeRepository.findByIdAndTenantIdAndDriverId(routeId, tenantId, driverId)).thenReturn(Optional.of(route));
        when(routeStopRepository.findByRouteIdOrderByStopOrderAsc(routeId)).thenReturn(List.of(
                RouteStop.builder().routeId(routeId).orderId(orderId).stopOrder(1).build()
        ));
        when(orderRepository.findAllByIdInAndTenantId(List.of(orderId), tenantId)).thenReturn(List.of(order));
        when(orderRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(routeRepository.save(route)).thenReturn(route);

        RouteResponse response = routeService.startByDriver(routeId, driverId);

        assertThat(response.status()).isEqualTo(RouteStatus.IN_PROGRESS);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.IN_TRANSIT);

        ArgumentCaptor<OrderStatusHistory> historyCaptor = ArgumentCaptor.forClass(OrderStatusHistory.class);
        verify(orderStatusHistoryRepository).save(historyCaptor.capture());
        assertThat(historyCaptor.getValue().getStatus()).isEqualTo(OrderStatus.IN_TRANSIT);
        assertThat(historyCaptor.getValue().getChangedBy()).isEqualTo(driverId);
    }

    @Test
    @DisplayName("should reject driver progress on route not assigned to driver")
    void shouldRejectDriverProgressOnRouteNotAssignedToDriver() {
        UUID routeId = UUID.randomUUID();
        UUID driverId = UUID.randomUUID();
        when(routeRepository.findByIdAndTenantIdAndDriverId(routeId, tenantId, driverId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> routeService.startByDriver(routeId, driverId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("should build offline packet for assigned driver route")
    void shouldBuildOfflinePacketForAssignedDriverRoute() {
        UUID routeId = UUID.randomUUID();
        UUID driverId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();

        Route route = Route.builder()
                .id(routeId)
                .tenantId(tenantId)
                .vehicleId(UUID.randomUUID())
                .driverId(driverId)
                .status(RouteStatus.ASSIGNED)
                .build();

        Order order = Order.builder()
                .id(orderId)
                .tenantId(tenantId)
                .trackingCode("TRK-OFF-001")
                .status(OrderStatus.ASSIGNED)
                .normalizedAddress("Av. Principal 123")
                .normalizationConfidence(0.95)
                .normalizationFallbackUsed(false)
                .build();

        when(routeRepository.findByIdAndTenantIdAndDriverId(routeId, tenantId, driverId)).thenReturn(Optional.of(route));
        when(routeStopRepository.findByRouteIdOrderByStopOrderAsc(routeId)).thenReturn(List.of(
                RouteStop.builder().routeId(routeId).orderId(orderId).stopOrder(1).build()
        ));
        when(orderRepository.findAllByIdInAndTenantId(List.of(orderId), tenantId)).thenReturn(List.of(order));

        DriverOfflineRoutePacketResponse response = routeService.getOfflinePacket(routeId, driverId);

        assertThat(response.routeId()).isEqualTo(routeId);
        assertThat(response.status()).isEqualTo(RouteStatus.ASSIGNED);
        assertThat(response.stops()).hasSize(1);
        assertThat(response.stops().getFirst().trackingCode()).isEqualTo("TRK-OFF-001");
        assertThat(response.stops().getFirst().normalizedAddress()).isEqualTo("Av. Principal 123");
        assertThat(response.stops().getFirst().normalizationConfidence()).isEqualTo(0.95);
    }

    @Test
    @DisplayName("should enforce tenant and driver scope when building offline packet")
    void shouldEnforceTenantAndDriverScopeWhenBuildingOfflinePacket() {
        UUID routeId = UUID.randomUUID();
        UUID driverId = UUID.randomUUID();
        when(routeRepository.findByIdAndTenantIdAndDriverId(routeId, tenantId, driverId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> routeService.getOfflinePacket(routeId, driverId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("should upload sync events and apply valid status changes")
    void shouldUploadSyncEventsAndApplyValidStatusChanges() {
        UUID routeId = UUID.randomUUID();
        UUID driverId = UUID.randomUUID();
        UUID deviceId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();

        Route route = Route.builder()
                .id(routeId)
                .tenantId(tenantId)
                .driverId(driverId)
                .status(RouteStatus.ASSIGNED)
                .build();
        Order order = Order.builder().id(orderId).tenantId(tenantId).status(OrderStatus.ASSIGNED).build();

        UploadRouteSyncEventRequest event = new UploadRouteSyncEventRequest(
                "evt-001",
                com.saas.modules.logistics.models.SyncEventType.STATUS_CHANGE,
                orderId,
                OrderStatus.IN_TRANSIT,
                LocalDateTime.now().minusMinutes(1)
        );
        UploadRouteSyncRequest request = new UploadRouteSyncRequest(deviceId, List.of(event));

        when(routeRepository.findByIdAndTenantIdAndDriverId(routeId, tenantId, driverId)).thenReturn(Optional.of(route));
        when(routeStopRepository.findByRouteIdOrderByStopOrderAsc(routeId)).thenReturn(List.of(
                RouteStop.builder().routeId(routeId).orderId(orderId).stopOrder(1).build()
        ));
        when(syncEventRepository.findByTenantIdAndDeviceIdAndClientEventId(tenantId, deviceId, "evt-001"))
                .thenReturn(Optional.empty());
        when(syncEventRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderRepository.findByIdAndTenantId(orderId, tenantId)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RouteSyncUploadResponse response = routeService.uploadSyncEvents(routeId, driverId, request);

        assertThat(response.processedEvents()).isEqualTo(1);
        assertThat(response.acceptedEvents()).isEqualTo(1);
        assertThat(response.duplicateEvents()).isEqualTo(0);
        assertThat(response.conflictEvents()).isEqualTo(0);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.IN_TRANSIT);
        verify(syncConflictRepository, never()).save(any());
        verify(orderStatusHistoryRepository).save(any(OrderStatusHistory.class));
        verify(acceptedCounter).increment();
        verify(duplicateCounter, never()).increment();
        verify(conflictCounter, never()).increment();
    }

    @Test
    @DisplayName("should treat duplicate sync event as idempotent")
    void shouldTreatDuplicateSyncEventAsIdempotent() {
        UUID routeId = UUID.randomUUID();
        UUID driverId = UUID.randomUUID();
        UUID deviceId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();

        Route route = Route.builder()
                .id(routeId)
                .tenantId(tenantId)
                .driverId(driverId)
                .status(RouteStatus.ASSIGNED)
                .build();

        UploadRouteSyncEventRequest event = new UploadRouteSyncEventRequest(
                "evt-dup",
                com.saas.modules.logistics.models.SyncEventType.STATUS_CHANGE,
                orderId,
                OrderStatus.IN_TRANSIT,
                LocalDateTime.now().minusMinutes(1)
        );
        UploadRouteSyncRequest request = new UploadRouteSyncRequest(deviceId, List.of(event));

        when(routeRepository.findByIdAndTenantIdAndDriverId(routeId, tenantId, driverId)).thenReturn(Optional.of(route));
        when(routeStopRepository.findByRouteIdOrderByStopOrderAsc(routeId)).thenReturn(List.of(
                RouteStop.builder().routeId(routeId).orderId(orderId).stopOrder(1).build()
        ));
        when(syncEventRepository.findByTenantIdAndDeviceIdAndClientEventId(tenantId, deviceId, "evt-dup"))
                .thenReturn(Optional.of(com.saas.modules.logistics.models.SyncEvent.builder().build()));

        RouteSyncUploadResponse response = routeService.uploadSyncEvents(routeId, driverId, request);

        assertThat(response.processedEvents()).isEqualTo(1);
        assertThat(response.acceptedEvents()).isEqualTo(0);
        assertThat(response.duplicateEvents()).isEqualTo(1);
        assertThat(response.conflictEvents()).isEqualTo(0);
        verify(syncEventRepository, never()).save(any());
        verify(orderRepository, never()).save(any(Order.class));
        verify(duplicateCounter).increment();
        verify(acceptedCounter, never()).increment();
        verify(conflictCounter, never()).increment();
    }

    @Test
    @DisplayName("should record conflict and keep server state for invalid sync transition")
    void shouldRecordConflictAndKeepServerStateForInvalidSyncTransition() {
        UUID routeId = UUID.randomUUID();
        UUID driverId = UUID.randomUUID();
        UUID deviceId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();

        Route route = Route.builder()
                .id(routeId)
                .tenantId(tenantId)
                .driverId(driverId)
                .status(RouteStatus.ASSIGNED)
                .build();
        Order order = Order.builder().id(orderId).tenantId(tenantId).status(OrderStatus.CREATED).build();

        UploadRouteSyncEventRequest event = new UploadRouteSyncEventRequest(
                "evt-conflict",
                com.saas.modules.logistics.models.SyncEventType.STATUS_CHANGE,
                orderId,
                OrderStatus.DELIVERED,
                LocalDateTime.now().minusMinutes(1)
        );
        UploadRouteSyncRequest request = new UploadRouteSyncRequest(deviceId, List.of(event));

        when(routeRepository.findByIdAndTenantIdAndDriverId(routeId, tenantId, driverId)).thenReturn(Optional.of(route));
        when(routeStopRepository.findByRouteIdOrderByStopOrderAsc(routeId)).thenReturn(List.of(
                RouteStop.builder().routeId(routeId).orderId(orderId).stopOrder(1).build()
        ));
        when(syncEventRepository.findByTenantIdAndDeviceIdAndClientEventId(tenantId, deviceId, "evt-conflict"))
                .thenReturn(Optional.empty());
        when(syncEventRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderRepository.findByIdAndTenantId(orderId, tenantId)).thenReturn(Optional.of(order));

        RouteSyncUploadResponse response = routeService.uploadSyncEvents(routeId, driverId, request);

        assertThat(response.processedEvents()).isEqualTo(1);
        assertThat(response.acceptedEvents()).isEqualTo(0);
        assertThat(response.duplicateEvents()).isEqualTo(0);
        assertThat(response.conflictEvents()).isEqualTo(1);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.CREATED);
        verify(syncConflictRepository).save(any());
        verify(orderRepository, never()).save(any(Order.class));
        verify(conflictCounter).increment();
        verify(acceptedCounter, never()).increment();
    }

    private void authenticateAs(UUID actorId) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(actorId.toString(), null)
        );
    }
}
