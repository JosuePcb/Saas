package com.saas.modules.logistics.services;

import com.saas.core.exceptions.BusinessException;
import com.saas.core.storage.ObjectStoragePort;
import com.saas.core.storage.StorageProperties;
import com.saas.core.exceptions.ResourceNotFoundException;
import com.saas.core.tenant.TenantContext;
import com.saas.modules.ai.services.AiAddressNormalizationService;
import com.saas.modules.logistics.dtos.OrderHistoryResponse;
import com.saas.modules.logistics.dtos.NormalizeAddressRequest;
import com.saas.modules.logistics.dtos.DispatcherTrackingResponse;
import com.saas.modules.logistics.dtos.AddressNormalizationResponse;
import com.saas.modules.logistics.dtos.OrderMapper;
import com.saas.modules.logistics.dtos.PodMetadataResponse;
import com.saas.modules.logistics.dtos.OrderResponse;
import com.saas.modules.logistics.models.Order;
import com.saas.modules.logistics.models.AddressReviewStatus;
import com.saas.modules.logistics.models.OrderStatus;
import com.saas.modules.logistics.models.OrderStatusHistory;
import com.saas.modules.logistics.repositories.OrderRepository;
import com.saas.modules.logistics.repositories.OrderStatusHistoryRepository;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.anyLong;

@ExtendWith(MockitoExtension.class)
@DisplayName("OrderService unit tests")
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Mock
    private OrderMapper orderMapper;

    @Mock
    private ObjectStoragePort objectStoragePort;

    @Mock
    private StorageProperties storageProperties;

    @Mock
    private AiAddressNormalizationService aiAddressNormalizationService;

    @InjectMocks
    private OrderService orderService;

    private UUID tenantId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        userId = UUID.randomUUID();
        TenantContext.setCurrentTenantId(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("should create order with tracking code and CREATED status")
    void shouldCreateOrderWithTrackingCodeAndCreatedStatus() {
        Order saved = Order.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .trackingCode("TRK-AB12CD34-20260312-0001")
                .status(OrderStatus.CREATED)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(orderRepository.findTopByTenantIdAndTrackingCodeStartingWithOrderByCreatedAtDesc(eq(tenantId), any(String.class)))
                .thenReturn(Optional.empty());
        when(orderRepository.existsByTenantIdAndTrackingCode(eq(tenantId), any(String.class))).thenReturn(false);
        when(orderRepository.save(any(Order.class))).thenReturn(saved);
        when(orderMapper.toResponse(saved)).thenReturn(new OrderResponse(
                saved.getId(),
                saved.getTrackingCode(),
                saved.getStatus(),
                saved.getCreatedAt(),
                saved.getUpdatedAt()
        ));

        OrderResponse response = orderService.create();

        assertThat(response.status()).isEqualTo(OrderStatus.CREATED);
        assertThat(response.trackingCode()).startsWith("TRK-");

        ArgumentCaptor<OrderStatusHistory> historyCaptor = ArgumentCaptor.forClass(OrderStatusHistory.class);
        verify(orderStatusHistoryRepository).save(historyCaptor.capture());
        assertThat(historyCaptor.getValue().getTenantId()).isEqualTo(tenantId);
        assertThat(historyCaptor.getValue().getStatus()).isEqualTo(OrderStatus.CREATED);
    }

    @Test
    @DisplayName("should generate next tracking sequence from latest existing order")
    void shouldGenerateNextTrackingSequenceFromLatestExistingOrder() {
        Order latest = Order.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .trackingCode("TRK-AB12CD34-20260312-0007")
                .status(OrderStatus.CREATED)
                .build();

        Order saved = Order.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .trackingCode("TRK-AB12CD34-20260312-0008")
                .status(OrderStatus.CREATED)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(orderRepository.findTopByTenantIdAndTrackingCodeStartingWithOrderByCreatedAtDesc(eq(tenantId), any(String.class)))
                .thenReturn(Optional.of(latest));
        when(orderRepository.existsByTenantIdAndTrackingCode(eq(tenantId), any(String.class))).thenReturn(false);
        when(orderRepository.save(any(Order.class))).thenReturn(saved);
        when(orderMapper.toResponse(saved)).thenReturn(new OrderResponse(
                saved.getId(),
                saved.getTrackingCode(),
                saved.getStatus(),
                saved.getCreatedAt(),
                saved.getUpdatedAt()
        ));

        OrderResponse response = orderService.create();

        assertThat(response.trackingCode()).endsWith("0008");
    }

    @Test
    @DisplayName("should transition status and append immutable history")
    void shouldTransitionStatusAndAppendImmutableHistory() {
        UUID orderId = UUID.randomUUID();
        Order order = Order.builder()
                .id(orderId)
                .tenantId(tenantId)
                .trackingCode("TRK-AB12CD34-20260312-0001")
                .status(OrderStatus.CREATED)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(orderRepository.findByIdAndTenantId(orderId, tenantId)).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);
        when(orderMapper.toResponse(order)).thenAnswer(invocation -> {
            Order current = invocation.getArgument(0);
            return new OrderResponse(
                    current.getId(),
                    current.getTrackingCode(),
                    current.getStatus(),
                    current.getCreatedAt(),
                    current.getUpdatedAt()
            );
        });

        OrderResponse response = orderService.changeStatus(orderId, OrderStatus.ASSIGNED);

        assertThat(response.status()).isEqualTo(OrderStatus.ASSIGNED);

        ArgumentCaptor<OrderStatusHistory> historyCaptor = ArgumentCaptor.forClass(OrderStatusHistory.class);
        verify(orderStatusHistoryRepository).save(historyCaptor.capture());
        assertThat(historyCaptor.getValue().getOrderId()).isEqualTo(orderId);
        assertThat(historyCaptor.getValue().getStatus()).isEqualTo(OrderStatus.ASSIGNED);
    }

    @Test
    @DisplayName("should store actor on status history when authenticated")
    void shouldStoreActorOnStatusHistoryWhenAuthenticated() {
        UUID orderId = UUID.randomUUID();
        Order order = Order.builder()
                .id(orderId)
                .tenantId(tenantId)
                .trackingCode("TRK-AB12CD34-20260312-0001")
                .status(OrderStatus.ASSIGNED)
                .build();

        setAuthenticatedUser(userId, "DESPACHADOR");

        when(orderRepository.findByIdAndTenantId(orderId, tenantId)).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);
        when(orderMapper.toResponse(order)).thenReturn(new OrderResponse(
                order.getId(),
                order.getTrackingCode(),
                order.getStatus(),
                order.getCreatedAt(),
                order.getUpdatedAt()
        ));

        orderService.changeStatus(orderId, OrderStatus.IN_TRANSIT);

        ArgumentCaptor<OrderStatusHistory> historyCaptor = ArgumentCaptor.forClass(OrderStatusHistory.class);
        verify(orderStatusHistoryRepository).save(historyCaptor.capture());
        assertThat(historyCaptor.getValue().getChangedBy()).isEqualTo(userId);
    }

    @Test
    @DisplayName("should reject invalid lifecycle transition")
    void shouldRejectInvalidLifecycleTransition() {
        UUID orderId = UUID.randomUUID();
        Order order = Order.builder()
                .id(orderId)
                .tenantId(tenantId)
                .trackingCode("TRK-AB12CD34-20260312-0001")
                .status(OrderStatus.CREATED)
                .build();

        when(orderRepository.findByIdAndTenantId(orderId, tenantId)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.changeStatus(orderId, OrderStatus.DELIVERED))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Invalid order status transition")
                .extracting("status")
                .isEqualTo(HttpStatus.CONFLICT);

        verify(orderRepository, never()).save(any(Order.class));
        verify(orderStatusHistoryRepository, never()).save(any(OrderStatusHistory.class));
    }

    @Test
    @DisplayName("should normalize address with auto accepted review when confidence is high")
    void shouldNormalizeAddressWithAutoAcceptedReviewWhenConfidenceIsHigh() {
        UUID orderId = UUID.randomUUID();
        Order order = Order.builder()
                .id(orderId)
                .tenantId(tenantId)
                .status(OrderStatus.CREATED)
                .build();

        when(aiAddressNormalizationService.normalize(eq(orderId), any()))
                .thenReturn(new com.saas.modules.ai.dtos.AddressNormalizationResponse(
                        "Av. Principal 123, Caracas",
                        "Distrito Capital",
                        "Libertador",
                        "Catedral",
                        "Centro",
                        "Frente a la plaza",
                        10.5,
                        -66.9,
                        0.92,
                        false,
                        AddressReviewStatus.AUTO_ACCEPTED,
                        "gemini",
                        null
                ));

        AddressNormalizationResponse response = orderService.normalizeAddress(
                orderId,
                new NormalizeAddressRequest("Av. Principal 123, Caracas")
        );

        assertThat(response.fallbackUsed()).isFalse();
        assertThat(response.reviewStatus()).isEqualTo(AddressReviewStatus.AUTO_ACCEPTED);
        assertThat(response.confidence()).isGreaterThanOrEqualTo(0.80);
        assertThat(response.normalizedAddress()).isNotBlank();
        verify(aiAddressNormalizationService).normalize(eq(orderId), any());
    }

    @Test
    @DisplayName("should normalize address with fallback and review required when confidence is low")
    void shouldNormalizeAddressWithFallbackAndReviewRequiredWhenConfidenceIsLow() {
        UUID orderId = UUID.randomUUID();
        Order order = Order.builder()
                .id(orderId)
                .tenantId(tenantId)
                .status(OrderStatus.CREATED)
                .build();

        when(aiAddressNormalizationService.normalize(eq(orderId), any()))
                .thenReturn(new com.saas.modules.ai.dtos.AddressNormalizationResponse(
                        "Sector Centro",
                        null,
                        null,
                        null,
                        "Centro",
                        "Sector Centro",
                        null,
                        null,
                        0.65,
                        true,
                        AddressReviewStatus.REVIEW_REQUIRED,
                        "gemini",
                        "low-confidence"
                ));

        AddressNormalizationResponse response = orderService.normalizeAddress(
                orderId,
                new NormalizeAddressRequest("Sector Centro")
        );

        assertThat(response.fallbackUsed()).isTrue();
        assertThat(response.reviewStatus()).isEqualTo(AddressReviewStatus.REVIEW_REQUIRED);
        assertThat(response.confidence()).isLessThan(0.80);
        assertThat(response.normalizedAddress()).isNotBlank();
        verify(aiAddressNormalizationService).normalize(eq(orderId), any());
    }

    @Test
    @DisplayName("should reject order metadata update when normalized address is blank")
    void shouldRejectOrderMetadataUpdateWhenNormalizedAddressIsBlank() {
        UUID orderId = UUID.randomUUID();
        Order order = Order.builder()
                .id(orderId)
                .tenantId(tenantId)
                .status(OrderStatus.CREATED)
                .build();

        when(orderRepository.findByIdAndTenantId(orderId, tenantId)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.updateNormalizationMetadata(
                orderId,
                "   ",
                0.9,
                false,
                AddressReviewStatus.AUTO_ACCEPTED
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Normalized address is required")
                .extracting("status")
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("should reject order metadata update when review status conflicts with confidence")
    void shouldRejectOrderMetadataUpdateWhenReviewStatusConflictsWithConfidence() {
        UUID orderId = UUID.randomUUID();
        Order order = Order.builder()
                .id(orderId)
                .tenantId(tenantId)
                .status(OrderStatus.CREATED)
                .build();

        when(orderRepository.findByIdAndTenantId(orderId, tenantId)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.updateNormalizationMetadata(
                orderId,
                "Av. Principal 123",
                0.79,
                false,
                AddressReviewStatus.AUTO_ACCEPTED
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("AUTO_ACCEPTED requires confidence")
                .extracting("status")
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("should reject order metadata update when fallback is used with auto accepted status")
    void shouldRejectOrderMetadataUpdateWhenFallbackIsUsedWithAutoAcceptedStatus() {
        UUID orderId = UUID.randomUUID();
        Order order = Order.builder()
                .id(orderId)
                .tenantId(tenantId)
                .status(OrderStatus.CREATED)
                .build();

        when(orderRepository.findByIdAndTenantId(orderId, tenantId)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.updateNormalizationMetadata(
                orderId,
                "Av. Principal 123",
                0.95,
                true,
                AddressReviewStatus.AUTO_ACCEPTED
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Fallback normalization cannot be auto accepted")
                .extracting("status")
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("should enforce tenant scope when changing status")
    void shouldEnforceTenantScopeWhenChangingStatus() {
        UUID orderId = UUID.randomUUID();
        when(orderRepository.findByIdAndTenantId(orderId, tenantId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.changeStatus(orderId, OrderStatus.ASSIGNED))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("should return immutable history ordered by change time")
    void shouldReturnImmutableHistoryOrderedByChangeTime() {
        UUID orderId = UUID.randomUUID();
        Order order = Order.builder()
                .id(orderId)
                .tenantId(tenantId)
                .trackingCode("TRK-AB12CD34-20260312-0001")
                .status(OrderStatus.ASSIGNED)
                .build();

        OrderStatusHistory created = OrderStatusHistory.builder()
                .id(UUID.randomUUID())
                .orderId(orderId)
                .tenantId(tenantId)
                .status(OrderStatus.CREATED)
                .changedAt(LocalDateTime.now().minusHours(1))
                .build();

        OrderStatusHistory assigned = OrderStatusHistory.builder()
                .id(UUID.randomUUID())
                .orderId(orderId)
                .tenantId(tenantId)
                .status(OrderStatus.ASSIGNED)
                .changedAt(LocalDateTime.now())
                .build();

        when(orderRepository.findByIdAndTenantId(orderId, tenantId)).thenReturn(Optional.of(order));
        when(orderStatusHistoryRepository.findByOrderIdAndTenantIdOrderByChangedAtAscIdAsc(orderId, tenantId))
                .thenReturn(List.of(created, assigned));
        when(orderMapper.toHistoryResponse(created)).thenReturn(new OrderHistoryResponse(OrderStatus.CREATED, created.getChangedAt()));
        when(orderMapper.toHistoryResponse(assigned)).thenReturn(new OrderHistoryResponse(OrderStatus.ASSIGNED, assigned.getChangedAt()));

        List<OrderHistoryResponse> history = orderService.getHistory(orderId);

        assertThat(history).hasSize(2);
        assertThat(history.get(0).status()).isEqualTo(OrderStatus.CREATED);
        assertThat(history.get(1).status()).isEqualTo(OrderStatus.ASSIGNED);
        verify(orderRepository, times(1)).findByIdAndTenantId(orderId, tenantId);
        verify(orderStatusHistoryRepository, times(1)).findByOrderIdAndTenantIdOrderByChangedAtAscIdAsc(orderId, tenantId);
    }

    @Test
    @DisplayName("should upload PoD metadata and call storage contract")
    void shouldUploadPodMetadataAndCallStorageContract() {
        UUID orderId = UUID.randomUUID();
        Order deliveredOrder = Order.builder()
                .id(orderId)
                .tenantId(tenantId)
                .trackingCode("TRK-AB12CD34-20260312-0001")
                .status(OrderStatus.DELIVERED)
                .build();

        MockMultipartFile file = new MockMultipartFile("file", "pod.png", "image/png", "img-bytes".getBytes());

        when(orderRepository.findByIdAndTenantId(orderId, tenantId)).thenReturn(Optional.of(deliveredOrder));
        when(storageProperties.podBucket()).thenReturn("pod-evidence-test");
        when(objectStoragePort.putObject(eq("pod-evidence-test"), any(String.class), any(InputStream.class), anyLong(), eq("image/png")))
                .thenAnswer(invocation -> invocation.getArgument(1));
        when(orderRepository.save(deliveredOrder)).thenReturn(deliveredOrder);

        PodMetadataResponse response = orderService.uploadPod(orderId, file);

        assertThat(response.objectKey()).contains(orderId.toString());
        assertThat(response.contentType()).isEqualTo("image/png");
        assertThat(response.sizeBytes()).isEqualTo(file.getSize());
        verify(objectStoragePort, times(1)).putObject(eq("pod-evidence-test"), any(String.class), any(InputStream.class), anyLong(), eq("image/png"));
    }

    @Test
    @DisplayName("should reject PoD upload when file type is unsupported")
    void shouldRejectPodUploadWhenFileTypeIsUnsupported() {
        UUID orderId = UUID.randomUUID();
        Order deliveredOrder = Order.builder()
                .id(orderId)
                .tenantId(tenantId)
                .status(OrderStatus.DELIVERED)
                .build();

        MockMultipartFile file = new MockMultipartFile("file", "pod.pdf", "application/pdf", "pdf-bytes".getBytes());

        when(orderRepository.findByIdAndTenantId(orderId, tenantId)).thenReturn(Optional.of(deliveredOrder));

        assertThatThrownBy(() -> orderService.uploadPod(orderId, file))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Unsupported PoD content type")
                .extracting("status")
                .isEqualTo(HttpStatus.BAD_REQUEST);

        verify(objectStoragePort, never()).putObject(any(String.class), any(String.class), any(InputStream.class), anyLong(), any(String.class));
    }

    @Test
    @DisplayName("should map storage failures to 500 for consistent error handling")
    void shouldMapStorageFailuresTo500ForConsistentErrorHandling() {
        UUID orderId = UUID.randomUUID();
        Order deliveredOrder = Order.builder()
                .id(orderId)
                .tenantId(tenantId)
                .status(OrderStatus.DELIVERED)
                .build();

        MockMultipartFile file = new MockMultipartFile("file", "pod.jpg", "image/jpeg", "jpg-bytes".getBytes());

        when(orderRepository.findByIdAndTenantId(orderId, tenantId)).thenReturn(Optional.of(deliveredOrder));
        when(storageProperties.podBucket()).thenReturn("pod-evidence-test");
        when(objectStoragePort.putObject(eq("pod-evidence-test"), any(String.class), any(InputStream.class), anyLong(), eq("image/jpeg")))
                .thenThrow(new BusinessException("Could not store object", HttpStatus.BAD_REQUEST));

        assertThatThrownBy(() -> orderService.uploadPod(orderId, file))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Could not store object")
                .extracting("status")
                .isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Test
    @DisplayName("should reject PoD upload when file exceeds max allowed size")
    void shouldRejectPodUploadWhenFileExceedsMaxAllowedSize() {
        UUID orderId = UUID.randomUUID();
        Order deliveredOrder = Order.builder()
                .id(orderId)
                .tenantId(tenantId)
                .status(OrderStatus.DELIVERED)
                .build();

        byte[] bytes = new byte[(5 * 1024 * 1024) + 1];
        MockMultipartFile file = new MockMultipartFile("file", "pod.png", "image/png", bytes);

        when(orderRepository.findByIdAndTenantId(orderId, tenantId)).thenReturn(Optional.of(deliveredOrder));

        assertThatThrownBy(() -> orderService.uploadPod(orderId, file))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("PoD file exceeds maximum allowed size")
                .extracting("status")
                .isEqualTo(HttpStatus.BAD_REQUEST);

        verify(objectStoragePort, never()).putObject(any(String.class), any(String.class), any(InputStream.class), anyLong(), any(String.class));
    }

    @Test
    @DisplayName("should return dispatcher tracking read model with route and latest status timestamp")
    void shouldReturnDispatcherTrackingReadModelWithRouteAndLatestStatusTimestamp() {
        UUID orderId = UUID.randomUUID();
        UUID routeId = UUID.randomUUID();
        LocalDateTime lastStatusAt = LocalDateTime.now().minusMinutes(5);

        OrderRepository.DispatcherTrackingView view = new OrderRepository.DispatcherTrackingView() {
            @Override
            public UUID getOrderId() {
                return orderId;
            }

            @Override
            public String getTrackingCode() {
                return "TRK-AB12CD34-20260312-0001";
            }

            @Override
            public OrderStatus getStatus() {
                return OrderStatus.IN_TRANSIT;
            }

            @Override
            public UUID getRouteId() {
                return routeId;
            }

            @Override
            public LocalDateTime getLastStatusTimestamp() {
                return lastStatusAt;
            }
        };

        when(orderRepository.findDispatcherTrackingByTenantId(tenantId)).thenReturn(List.of(view));

        DispatcherTrackingResponse response = orderService.getDispatcherTracking();

        assertThat(response.orders()).hasSize(1);
        assertThat(response.orders().getFirst().orderId()).isEqualTo(orderId);
        assertThat(response.orders().getFirst().routeId()).isEqualTo(routeId);
        assertThat(response.orders().getFirst().status()).isEqualTo(OrderStatus.IN_TRANSIT);
        assertThat(response.orders().getFirst().lastStatusTimestamp()).isEqualTo(lastStatusAt);
        verify(orderRepository).findDispatcherTrackingByTenantId(tenantId);
    }

    @Test
    @DisplayName("should enforce tenant context for dispatcher tracking read model")
    void shouldEnforceTenantContextForDispatcherTrackingReadModel() {
        TenantContext.clear();

        assertThatThrownBy(() -> orderService.getDispatcherTracking())
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Tenant context is required");

        verify(orderRepository, never()).findDispatcherTrackingByTenantId(any(UUID.class));
    }

    @Test
    @DisplayName("should return public tracking details without tenant context")
    void shouldReturnPublicTrackingDetailsWithoutTenantContext() {
        TenantContext.clear();
        UUID orderId = UUID.randomUUID();
        UUID orderTenantId = UUID.randomUUID();

        Order order = Order.builder()
                .id(orderId)
                .tenantId(orderTenantId)
                .trackingCode("TRK-PUB12345-20260312-0001")
                .status(OrderStatus.IN_TRANSIT)
                .build();

        OrderStatusHistory created = OrderStatusHistory.builder()
                .id(UUID.randomUUID())
                .orderId(orderId)
                .tenantId(orderTenantId)
                .status(OrderStatus.CREATED)
                .changedAt(LocalDateTime.now().minusHours(2))
                .build();
        OrderStatusHistory inTransit = OrderStatusHistory.builder()
                .id(UUID.randomUUID())
                .orderId(orderId)
                .tenantId(orderTenantId)
                .status(OrderStatus.IN_TRANSIT)
                .changedAt(LocalDateTime.now().minusHours(1))
                .build();

        when(orderRepository.findTopByTrackingCodeOrderByCreatedAtDesc(order.getTrackingCode()))
                .thenReturn(Optional.of(order));
        when(orderStatusHistoryRepository.findByOrderIdAndTenantIdOrderByChangedAtAscIdAsc(orderId, orderTenantId))
                .thenReturn(List.of(created, inTransit));
        when(orderRepository.findPublicTrackingEnrichmentByOrderIdAndTenantId(orderId, orderTenantId))
                .thenReturn(List.of());
        when(orderMapper.toHistoryResponse(created)).thenReturn(new OrderHistoryResponse(OrderStatus.CREATED, created.getChangedAt()));
        when(orderMapper.toHistoryResponse(inTransit)).thenReturn(new OrderHistoryResponse(OrderStatus.IN_TRANSIT, inTransit.getChangedAt()));

        var response = orderService.getPublicTracking(order.getTrackingCode());

        assertThat(response.trackingCode()).isEqualTo(order.getTrackingCode());
        assertThat(response.currentStatus()).isEqualTo(OrderStatus.IN_TRANSIT);
        assertThat(response.history()).hasSize(2);
        assertThat(response.driverFirstName()).isNull();
        assertThat(response.eta()).isNull();
    }

    @Test
    @DisplayName("should enrich public tracking with driver first name and eta")
    void shouldEnrichPublicTrackingWithDriverFirstNameAndEta() {
        TenantContext.clear();
        UUID orderId = UUID.randomUUID();
        UUID orderTenantId = UUID.randomUUID();
        LocalDateTime eta = LocalDateTime.now().plusMinutes(25);

        Order order = Order.builder()
                .id(orderId)
                .tenantId(orderTenantId)
                .trackingCode("TRK-PUB12345-20260312-0002")
                .status(OrderStatus.ASSIGNED)
                .build();

        OrderStatusHistory created = OrderStatusHistory.builder()
                .id(UUID.randomUUID())
                .orderId(orderId)
                .tenantId(orderTenantId)
                .status(OrderStatus.CREATED)
                .changedAt(LocalDateTime.now().minusHours(1))
                .build();

        OrderRepository.PublicTrackingEnrichmentView enrichment = new OrderRepository.PublicTrackingEnrichmentView() {
            @Override
            public String getDriverFirstName() {
                return "Carlos";
            }

            @Override
            public LocalDateTime getEta() {
                return eta;
            }
        };

        when(orderRepository.findTopByTrackingCodeOrderByCreatedAtDesc(order.getTrackingCode()))
                .thenReturn(Optional.of(order));
        when(orderStatusHistoryRepository.findByOrderIdAndTenantIdOrderByChangedAtAscIdAsc(orderId, orderTenantId))
                .thenReturn(List.of(created));
        when(orderRepository.findPublicTrackingEnrichmentByOrderIdAndTenantId(orderId, orderTenantId))
                .thenReturn(List.of(enrichment));
        when(orderMapper.toHistoryResponse(created)).thenReturn(new OrderHistoryResponse(OrderStatus.CREATED, created.getChangedAt()));

        var response = orderService.getPublicTracking(order.getTrackingCode());

        assertThat(response.driverFirstName()).isEqualTo("Carlos");
        assertThat(response.eta()).isEqualTo(eta);
    }

    @Test
    @DisplayName("should return not found for unknown public tracking code")
    void shouldReturnNotFoundForUnknownPublicTrackingCode() {
        TenantContext.clear();
        String trackingCode = "TRK-PUB12345-20260312-9999";
        when(orderRepository.findTopByTrackingCodeOrderByCreatedAtDesc(trackingCode)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.getPublicTracking(trackingCode))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Order not found");
    }

    private void setAuthenticatedUser(UUID userId, String role) {
        var authentication = new UsernamePasswordAuthenticationToken(
                userId.toString(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + role))
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
