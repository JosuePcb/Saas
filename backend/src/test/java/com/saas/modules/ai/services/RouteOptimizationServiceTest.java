package com.saas.modules.ai.services;

import com.saas.core.exceptions.BusinessException;
import com.saas.core.tenant.TenantContext;
import com.saas.modules.ai.dtos.RouteOptimizationConfirmRequest;
import com.saas.modules.ai.dtos.RouteOptimizationConfirmResponse;
import com.saas.modules.ai.dtos.RouteOptimizationPreviewRequest;
import com.saas.modules.ai.dtos.RouteOptimizationPreviewResponse;
import com.saas.modules.logistics.dtos.CreateRouteRequest;
import com.saas.modules.logistics.dtos.RouteResponse;
import com.saas.modules.logistics.models.Order;
import com.saas.modules.logistics.models.OrderStatus;
import com.saas.modules.logistics.models.RouteStatus;
import com.saas.modules.logistics.repositories.OrderRepository;
import com.saas.modules.logistics.services.RouteService;
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

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("RouteOptimizationService unit tests")
class RouteOptimizationServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private RouteService routeService;

    @InjectMocks
    private RouteOptimizationService routeOptimizationService;

    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        TenantContext.setCurrentTenantId(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("should generate deterministic preview for same input")
    void shouldGenerateDeterministicPreviewForSameInput() {
        UUID vehicleId = UUID.randomUUID();
        UUID orderA = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID orderB = UUID.fromString("22222222-2222-2222-2222-222222222222");
        UUID orderC = UUID.fromString("33333333-3333-3333-3333-333333333333");
        List<UUID> orderIds = List.of(orderA, orderB, orderC);

        when(orderRepository.findAllByIdInAndTenantId(orderIds, tenantId)).thenReturn(List.of(
                order(orderA, 10.5000, -66.9000),
                order(orderB, 10.5200, -66.9100),
                order(orderC, 10.5400, -66.9400)
        ));

        RouteOptimizationPreviewRequest request = new RouteOptimizationPreviewRequest(vehicleId, null, orderIds);

        RouteOptimizationPreviewResponse first = routeOptimizationService.preview(request);
        RouteOptimizationPreviewResponse second = routeOptimizationService.preview(request);

        assertThat(first.optimizedByAi()).isTrue();
        assertThat(first.optimizedOrderIds()).containsExactlyElementsOf(second.optimizedOrderIds());
        assertThat(first.previewSignature()).isEqualTo(second.previewSignature());
        assertThat(first.estimatedDistanceKm()).isEqualTo(second.estimatedDistanceKm());
    }

    @Test
    @DisplayName("should fallback to original order when preview exceeds 50 stops")
    void shouldFallbackToOriginalOrderWhenPreviewExceeds50Stops() {
        UUID vehicleId = UUID.randomUUID();
        List<UUID> ids = new ArrayList<>();
        List<Order> orders = new ArrayList<>();
        for (int i = 0; i < 51; i++) {
            UUID id = UUID.randomUUID();
            ids.add(id);
            orders.add(order(id, null, null));
        }

        when(orderRepository.findAllByIdInAndTenantId(ids, tenantId)).thenReturn(orders);

        RouteOptimizationPreviewResponse preview = routeOptimizationService.preview(
                new RouteOptimizationPreviewRequest(vehicleId, null, ids)
        );

        assertThat(preview.optimizedByAi()).isFalse();
        assertThat(preview.fallbackReason()).contains("up to 50 stops");
        assertThat(preview.optimizedOrderIds()).containsExactlyElementsOf(ids);
    }

    @Test
    @DisplayName("should confirm optimized preview and create route")
    void shouldConfirmOptimizedPreviewAndCreateRoute() {
        UUID vehicleId = UUID.randomUUID();
        UUID driverId = UUID.randomUUID();
        UUID orderA = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        UUID orderB = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        List<UUID> original = List.of(orderA, orderB);

        List<Order> orders = List.of(
                order(orderA, 10.5000, -66.9000),
                order(orderB, 10.5200, -66.9100)
        );
        when(orderRepository.findAllByIdInAndTenantId(original, tenantId)).thenReturn(orders);

        RouteOptimizationPreviewResponse preview = routeOptimizationService.preview(
                new RouteOptimizationPreviewRequest(vehicleId, driverId, original)
        );

        RouteResponse created = new RouteResponse(
                UUID.randomUUID(),
                vehicleId,
                RouteStatus.ASSIGNED,
                true,
                BigDecimal.valueOf(preview.estimatedDistanceKm()),
                preview.optimizedOrderIds(),
                null,
                null
        );
        when(routeService.create(any(CreateRouteRequest.class), eq(true), eq(preview.estimatedDistanceKm())))
                .thenReturn(created);

        RouteOptimizationConfirmResponse confirmed = routeOptimizationService.confirm(
                new RouteOptimizationConfirmRequest(
                        vehicleId,
                        driverId,
                        original,
                        preview.optimizedOrderIds(),
                        preview.previewSignature(),
                        true,
                        preview.estimatedDistanceKm()
                )
        );

        assertThat(confirmed.route().id()).isEqualTo(created.id());
        assertThat(confirmed.preview().optimizedOrderIds()).containsExactlyElementsOf(preview.optimizedOrderIds());

        ArgumentCaptor<CreateRouteRequest> requestCaptor = ArgumentCaptor.forClass(CreateRouteRequest.class);
        verify(routeService, times(1)).create(requestCaptor.capture(), eq(true), eq(preview.estimatedDistanceKm()));
        assertThat(requestCaptor.getValue().orderIds()).containsExactlyElementsOf(preview.optimizedOrderIds());
    }

    @Test
    @DisplayName("should reject confirmation with invalid signature")
    void shouldRejectConfirmationWithInvalidSignature() {
        UUID vehicleId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();
        List<UUID> ids = List.of(orderId);

        when(orderRepository.findAllByIdInAndTenantId(ids, tenantId)).thenReturn(List.of(order(orderId, null, null)));

        assertThatThrownBy(() -> routeOptimizationService.confirm(
                new RouteOptimizationConfirmRequest(
                        vehicleId,
                        null,
                        ids,
                        ids,
                        "invalid-signature",
                        false,
                        0.0
                )
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("invalid or stale")
                .extracting("status")
                .isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("should reject ai-confirmation when stop count exceeds 50")
    void shouldRejectAiConfirmationWhenStopCountExceeds50() {
        UUID vehicleId = UUID.randomUUID();
        List<UUID> ids = new ArrayList<>();
        List<Order> orders = new ArrayList<>();
        for (int i = 0; i < 51; i++) {
            UUID id = UUID.randomUUID();
            ids.add(id);
            orders.add(order(id, null, null));
        }
        when(orderRepository.findAllByIdInAndTenantId(ids, tenantId)).thenReturn(orders);

        RouteOptimizationPreviewResponse preview = routeOptimizationService.preview(
                new RouteOptimizationPreviewRequest(vehicleId, null, ids)
        );

        assertThatThrownBy(() -> routeOptimizationService.confirm(
                new RouteOptimizationConfirmRequest(
                        vehicleId,
                        null,
                        ids,
                        ids,
                        preview.previewSignature(),
                        true,
                        preview.estimatedDistanceKm()
                )
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("up to 50 stops")
                .extracting("status")
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    private Order order(UUID id, Double lat, Double lng) {
        return Order.builder()
                .id(id)
                .tenantId(tenantId)
                .status(OrderStatus.CREATED)
                .normalizedLatitude(lat)
                .normalizedLongitude(lng)
                .normalizedAddress("Address " + id)
                .build();
    }
}
