package com.saas.modules.logistics.services;

import com.saas.core.exceptions.BusinessException;
import com.saas.core.exceptions.ResourceNotFoundException;
import com.saas.core.storage.ObjectStoragePort;
import com.saas.core.storage.StorageProperties;
import com.saas.core.tenant.TenantContext;
import com.saas.modules.ai.dtos.AddressNormalizationRequest;
import com.saas.modules.ai.dtos.AddressNormalizationResponse;
import com.saas.modules.ai.services.AiAddressNormalizationService;
import com.saas.modules.logistics.dtos.OrderHistoryResponse;
import com.saas.modules.logistics.dtos.NormalizeAddressRequest;
import com.saas.modules.logistics.dtos.DispatcherOrderSummaryResponse;
import com.saas.modules.logistics.dtos.DispatcherTrackingResponse;
import com.saas.modules.logistics.dtos.OrderMapper;
import com.saas.modules.logistics.dtos.PublicTrackingResponse;
import com.saas.modules.logistics.dtos.OrderResponse;
import com.saas.modules.logistics.dtos.PodMetadataResponse;
import com.saas.modules.logistics.models.Order;
import com.saas.modules.logistics.models.AddressReviewStatus;
import com.saas.modules.logistics.models.OrderStatus;
import com.saas.modules.logistics.models.OrderStatusHistory;
import com.saas.modules.logistics.repositories.OrderRepository;
import com.saas.modules.logistics.repositories.OrderStatusHistoryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
public class OrderService {

    private static final DateTimeFormatter DAY_FORMATTER = DateTimeFormatter.BASIC_ISO_DATE;
    private static final long MAX_POD_SIZE_BYTES = 5L * 1024 * 1024;
    private static final List<String> ALLOWED_POD_CONTENT_TYPES = List.of("image/jpeg", "image/png", "image/webp");
    private static final double AUTO_ACCEPT_THRESHOLD = 0.80;

    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final OrderMapper orderMapper;
    private final ObjectStoragePort objectStoragePort;
    private final StorageProperties storageProperties;
    private final AiAddressNormalizationService aiAddressNormalizationService;

    public OrderService(OrderRepository orderRepository,
                        OrderStatusHistoryRepository orderStatusHistoryRepository,
                        OrderMapper orderMapper,
                        ObjectStoragePort objectStoragePort,
                        StorageProperties storageProperties,
                        AiAddressNormalizationService aiAddressNormalizationService) {
        this.orderRepository = orderRepository;
        this.orderStatusHistoryRepository = orderStatusHistoryRepository;
        this.orderMapper = orderMapper;
        this.objectStoragePort = objectStoragePort;
        this.storageProperties = storageProperties;
        this.aiAddressNormalizationService = aiAddressNormalizationService;
    }

    @Transactional
    public OrderResponse create() {
        UUID tenantId = requiredTenantId();

        String trackingCode = generateTrackingCode(tenantId);
        Order order = Order.builder()
                .tenantId(tenantId)
                .trackingCode(trackingCode)
                .status(OrderStatus.CREATED)
                .build();

        Order saved = orderRepository.save(order);
        appendHistory(saved.getId(), tenantId, OrderStatus.CREATED);
        return orderMapper.toResponse(saved);
    }

    @Transactional
    public OrderResponse changeStatus(UUID orderId, OrderStatus targetStatus) {
        UUID tenantId = requiredTenantId();
        Order order = orderRepository.findByIdAndTenantId(orderId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (!order.getStatus().canTransitionTo(targetStatus)) {
            throw new BusinessException("Invalid order status transition", HttpStatus.CONFLICT);
        }

        order.setStatus(targetStatus);
        Order saved = orderRepository.save(order);
        appendHistory(saved.getId(), tenantId, targetStatus);
        return orderMapper.toResponse(saved);
    }

    @Transactional
    public void updateNormalizationMetadata(UUID orderId,
                                            String normalizedAddress,
                                            Double confidence,
                                            boolean fallbackUsed,
                                            AddressReviewStatus reviewStatus) {
        UUID tenantId = requiredTenantId();
        Order order = findOrder(orderId, tenantId);

        validateNormalizationMetadata(normalizedAddress, confidence, fallbackUsed, reviewStatus);

        order.setNormalizedAddress(normalizedAddress.trim());
        order.setNormalizationConfidence(confidence);
        order.setNormalizationFallbackUsed(fallbackUsed);
        order.setAddressReviewStatus(reviewStatus);
        order.setNormalizedAt(LocalDateTime.now());
        orderRepository.save(order);
    }

    @Transactional
    public com.saas.modules.logistics.dtos.AddressNormalizationResponse normalizeAddress(UUID orderId, NormalizeAddressRequest request) {
        AddressNormalizationResponse normalization = aiAddressNormalizationService.normalize(
                orderId,
                new AddressNormalizationRequest(request.rawAddress())
        );
        return new com.saas.modules.logistics.dtos.AddressNormalizationResponse(
                normalization.normalizedAddress(),
                normalization.confidence(),
                normalization.fallbackUsed(),
                normalization.reviewStatus()
        );
    }

    @Transactional(readOnly = true)
    public List<OrderHistoryResponse> getHistory(UUID orderId) {
        UUID tenantId = requiredTenantId();
        ensureOrderExists(orderId, tenantId);

        return orderStatusHistoryRepository.findByOrderIdAndTenantIdOrderByChangedAtAscIdAsc(orderId, tenantId)
                .stream()
                .map(orderMapper::toHistoryResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public DispatcherTrackingResponse getDispatcherTracking() {
        UUID tenantId = requiredTenantId();

        List<DispatcherOrderSummaryResponse> orders = orderRepository.findDispatcherTrackingByTenantId(tenantId)
                .stream()
                .map(this::toDispatcherOrderSummary)
                .toList();

        return new DispatcherTrackingResponse(orders);
    }

    private DispatcherOrderSummaryResponse toDispatcherOrderSummary(OrderRepository.DispatcherTrackingView view) {
        return new DispatcherOrderSummaryResponse(
                view.getOrderId(),
                view.getTrackingCode(),
                view.getStatus(),
                view.getRouteId(),
                view.getLastStatusTimestamp()
        );
    }

    @Transactional
    public PodMetadataResponse uploadPod(UUID orderId, MultipartFile file) {
        UUID tenantId = requiredTenantId();
        Order order = findOrder(orderId, tenantId);

        validatePodUpload(order, file);
        String objectKey = buildPodObjectKey(tenantId, orderId, file.getOriginalFilename());

        String persistedKey;
        try {
            persistedKey = objectStoragePort.putObject(
                    storageProperties.podBucket(),
                    objectKey,
                    file.getInputStream(),
                    file.getSize(),
                    file.getContentType()
            );
        } catch (IOException ex) {
            throw new BusinessException("Could not read PoD file", HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (BusinessException ex) {
            throw new BusinessException(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }

        LocalDateTime now = LocalDateTime.now();
        order.setPodObjectKey(persistedKey);
        order.setPodContentType(file.getContentType());
        order.setPodSizeBytes(file.getSize());
        order.setPodUploadedAt(now);
        orderRepository.save(order);

        return new PodMetadataResponse(order.getId(), persistedKey, order.getPodContentType(), order.getPodSizeBytes(), now);
    }

    @Transactional(readOnly = true)
    public PodMetadataResponse getPod(UUID orderId) {
        UUID tenantId = requiredTenantId();
        Order order = findOrder(orderId, tenantId);

        if (order.getPodObjectKey() == null || order.getPodUploadedAt() == null || order.getPodSizeBytes() == null) {
            throw new ResourceNotFoundException("PoD", "orderId", orderId);
        }

        return new PodMetadataResponse(
                order.getId(),
                order.getPodObjectKey(),
                order.getPodContentType(),
                order.getPodSizeBytes(),
                order.getPodUploadedAt()
        );
    }

    @Transactional(readOnly = true)
    public PublicTrackingResponse getPublicTracking(String trackingCode) {
        Order order = orderRepository.findTopByTrackingCodeOrderByCreatedAtDesc(trackingCode)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "trackingCode", trackingCode));

        List<OrderHistoryResponse> history = orderStatusHistoryRepository
                .findByOrderIdAndTenantIdOrderByChangedAtAscIdAsc(order.getId(), order.getTenantId())
                .stream()
                .map(orderMapper::toHistoryResponse)
                .toList();

        OrderRepository.PublicTrackingEnrichmentView enrichment = orderRepository
                .findPublicTrackingEnrichmentByOrderIdAndTenantId(order.getId(), order.getTenantId())
                .stream()
                .findFirst()
                .orElse(null);

        String driverFirstName = enrichment != null ? enrichment.getDriverFirstName() : null;
        LocalDateTime eta = enrichment != null ? enrichment.getEta() : null;

        return new PublicTrackingResponse(order.getTrackingCode(), order.getStatus(), history, driverFirstName, eta);
    }

    private void ensureOrderExists(UUID orderId, UUID tenantId) {
        findOrder(orderId, tenantId);
    }

    private Order findOrder(UUID orderId, UUID tenantId) {
        return orderRepository.findByIdAndTenantId(orderId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
    }

    private void appendHistory(UUID orderId, UUID tenantId, OrderStatus status) {
        OrderStatusHistory history = OrderStatusHistory.builder()
                .orderId(orderId)
                .tenantId(tenantId)
                .status(status)
                .changedBy(resolveActorId())
                .build();
        orderStatusHistoryRepository.save(history);
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

    private void validatePodUpload(Order order, MultipartFile file) {
        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new BusinessException("PoD upload is only allowed for DELIVERED orders", HttpStatus.CONFLICT);
        }
        if (file == null || file.isEmpty()) {
            throw new BusinessException("PoD file is required", HttpStatus.BAD_REQUEST);
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_POD_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BusinessException("Unsupported PoD content type", HttpStatus.BAD_REQUEST);
        }
        if (file.getSize() > MAX_POD_SIZE_BYTES) {
            throw new BusinessException("PoD file exceeds maximum allowed size", HttpStatus.BAD_REQUEST);
        }
    }

    private void validateNormalizationMetadata(String normalizedAddress,
                                               Double confidence,
                                               boolean fallbackUsed,
                                               AddressReviewStatus reviewStatus) {
        if (normalizedAddress == null || normalizedAddress.isBlank()) {
            throw new BusinessException("Normalized address is required", HttpStatus.BAD_REQUEST);
        }
        if (confidence == null || confidence < 0 || confidence > 1) {
            throw new BusinessException("Normalization confidence must be between 0 and 1", HttpStatus.BAD_REQUEST);
        }
        if (reviewStatus == null) {
            throw new BusinessException("Address review status is required", HttpStatus.BAD_REQUEST);
        }

        if (reviewStatus == AddressReviewStatus.AUTO_ACCEPTED && confidence < AUTO_ACCEPT_THRESHOLD) {
            throw new BusinessException("AUTO_ACCEPTED requires confidence >= 0.80", HttpStatus.BAD_REQUEST);
        }
        if (reviewStatus == AddressReviewStatus.AUTO_ACCEPTED && fallbackUsed) {
            throw new BusinessException("Fallback normalization cannot be auto accepted", HttpStatus.BAD_REQUEST);
        }
    }

    private String buildPodObjectKey(UUID tenantId, UUID orderId, String originalFilename) {
        String extension = extractExtension(originalFilename);
        return "pod/%s/orders/%s/%d%s".formatted(tenantId, orderId, System.currentTimeMillis(), extension);
    }

    private String extractExtension(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            return "";
        }
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == originalFilename.length() - 1) {
            return "";
        }
        return originalFilename.substring(dotIndex).toLowerCase();
    }

    private String generateTrackingCode(UUID tenantId) {
        String dateToken = LocalDate.now().format(DAY_FORMATTER);
        String tenantToken = tenantId.toString().replace("-", "").substring(0, 8).toUpperCase();
        String prefix = "TRK-" + tenantToken + "-" + dateToken + "-";

        int nextSequence = resolveNextSequence(tenantId, prefix);
        String candidate = prefix + String.format("%04d", nextSequence);

        if (orderRepository.existsByTenantIdAndTrackingCode(tenantId, candidate)) {
            candidate = prefix + String.format("%04d", nextSequence + 1);
        }

        return candidate;
    }

    private int resolveNextSequence(UUID tenantId, String prefix) {
        return orderRepository.findTopByTenantIdAndTrackingCodeStartingWithOrderByCreatedAtDesc(tenantId, prefix)
                .map(Order::getTrackingCode)
                .map(this::extractSequence)
                .map(current -> current + 1)
                .orElse(1);
    }

    private int extractSequence(String trackingCode) {
        int lastDash = trackingCode.lastIndexOf('-');
        if (lastDash < 0 || lastDash == trackingCode.length() - 1) {
            return 0;
        }

        String token = trackingCode.substring(lastDash + 1);
        try {
            return Integer.parseInt(token);
        } catch (NumberFormatException ex) {
            return 0;
        }
    }

    private UUID requiredTenantId() {
        UUID tenantId = TenantContext.getCurrentTenantId();
        if (tenantId == null) {
            throw new BusinessException("Tenant context is required");
        }
        return tenantId;
    }
}
