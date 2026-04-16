package com.saas.modules.ai.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.saas.core.exceptions.BusinessException;
import com.saas.core.exceptions.ResourceNotFoundException;
import com.saas.core.tenant.TenantContext;
import com.saas.modules.ai.dtos.AddressNormalizationAttemptResponse;
import com.saas.modules.ai.dtos.AddressNormalizationRequest;
import com.saas.modules.ai.dtos.AddressNormalizationResponse;
import com.saas.modules.ai.dtos.AddressNormalizationResult;
import com.saas.modules.ai.dtos.ManualAddressCorrectionRequest;
import com.saas.modules.ai.models.AiNormalizationLog;
import com.saas.modules.ai.models.AiNormalizationStatus;
import com.saas.modules.ai.repositories.AiNormalizationLogRepository;
import com.saas.modules.logistics.models.AddressReviewStatus;
import com.saas.modules.logistics.models.Order;
import com.saas.modules.logistics.repositories.OrderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class AiAddressNormalizationService {

    private static final double AUTO_ACCEPT_THRESHOLD = 0.80;

    private final OrderRepository orderRepository;
    private final AiNormalizationLogRepository aiNormalizationLogRepository;
    private final GeminiAddressNormalizationAdapter geminiAddressNormalizationAdapter;
    private final ObjectMapper objectMapper;

    public AiAddressNormalizationService(OrderRepository orderRepository,
                                         AiNormalizationLogRepository aiNormalizationLogRepository,
                                         GeminiAddressNormalizationAdapter geminiAddressNormalizationAdapter,
                                         ObjectMapper objectMapper) {
        this.orderRepository = orderRepository;
        this.aiNormalizationLogRepository = aiNormalizationLogRepository;
        this.geminiAddressNormalizationAdapter = geminiAddressNormalizationAdapter;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public AddressNormalizationResponse normalize(UUID orderId, AddressNormalizationRequest request) {
        UUID tenantId = requiredTenantId();
        Order order = findOrder(orderId, tenantId);

        AddressNormalizationResult result = geminiAddressNormalizationAdapter.normalize(request.rawAddress());
        AiNormalizationStatus status = resolveStatus(result);

        applyOrderNormalization(order, result);
        AiNormalizationLog log = saveLog(order.getId(), tenantId, request.rawAddress(), result, status);

        return new AddressNormalizationResponse(
                order.getNormalizedAddress(),
                order.getNormalizedState(),
                order.getNormalizedMunicipio(),
                order.getNormalizedParroquia(),
                order.getNormalizedZona(),
                order.getNormalizedReferencia(),
                order.getNormalizedLatitude(),
                order.getNormalizedLongitude(),
                result.confidence(),
                result.fallbackUsed(),
                result.reviewStatus(),
                result.modelName(),
                result.fallbackReason()
        );
    }

    @Transactional
    public AddressNormalizationAttemptResponse applyManualCorrection(UUID orderId, ManualAddressCorrectionRequest request) {
        UUID tenantId = requiredTenantId();
        Order order = findOrder(orderId, tenantId);

        order.setNormalizedAddress(request.normalizedAddress().trim());
        order.setNormalizedState(trimToNull(request.normalizedState()));
        order.setNormalizedMunicipio(trimToNull(request.normalizedMunicipio()));
        order.setNormalizedParroquia(trimToNull(request.normalizedParroquia()));
        order.setNormalizedZona(trimToNull(request.normalizedZona()));
        order.setNormalizedReferencia(trimToNull(request.normalizedReferencia()));
        order.setNormalizedLatitude(request.normalizedLatitude());
        order.setNormalizedLongitude(request.normalizedLongitude());
        order.setAddressReviewStatus(AddressReviewStatus.REVIEW_APPROVED);
        order.setNormalizationFallbackUsed(false);
        order.setNormalizedAt(LocalDateTime.now());
        orderRepository.save(order);

        AiNormalizationLog log = aiNormalizationLogRepository.findTopByOrderIdAndTenantIdOrderByCreatedAtDesc(orderId, tenantId)
                .orElseGet(() -> AiNormalizationLog.builder()
                        .orderId(orderId)
                        .tenantId(tenantId)
                        .rawInputAddress(request.normalizedAddress())
                        .modelName("gemini")
                        .normalizationStatus(AiNormalizationStatus.MANUAL_CORRECTED)
                        .build());

        log.setNormalizationStatus(AiNormalizationStatus.MANUAL_CORRECTED);
        log.setCorrectedManually(true);
        log.setCorrectionPayload(toJson(buildCorrectionPayload(order)));
        log.setNormalizedOutputPayload(toJson(buildOutputPayload(order, order.getNormalizationConfidence())));
        aiNormalizationLogRepository.save(log);

        return toAttemptResponse(order, log);
    }

    @Transactional(readOnly = true)
    public AddressNormalizationAttemptResponse getLatestAttempt(UUID orderId) {
        UUID tenantId = requiredTenantId();
        Order order = findOrder(orderId, tenantId);
        AiNormalizationLog log = aiNormalizationLogRepository.findTopByOrderIdAndTenantIdOrderByCreatedAtDesc(orderId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("AiNormalizationLog", "orderId", orderId));
        return toAttemptResponse(order, log);
    }

    private void applyOrderNormalization(Order order, AddressNormalizationResult result) {
        if (result.normalizedAddress() == null || result.normalizedAddress().isBlank()) {
            throw new BusinessException("Normalized address is required", HttpStatus.BAD_REQUEST);
        }
        if (result.confidence() < 0 || result.confidence() > 1) {
            throw new BusinessException("Normalization confidence must be between 0 and 1", HttpStatus.BAD_REQUEST);
        }

        AddressReviewStatus status = result.reviewStatus();
        if (status == AddressReviewStatus.AUTO_ACCEPTED && result.confidence() < AUTO_ACCEPT_THRESHOLD) {
            throw new BusinessException("AUTO_ACCEPTED requires confidence >= 0.80", HttpStatus.BAD_REQUEST);
        }

        order.setNormalizedAddress(result.normalizedAddress().trim());
        order.setNormalizedState(trimToNull(result.normalizedState()));
        order.setNormalizedMunicipio(trimToNull(result.normalizedMunicipio()));
        order.setNormalizedParroquia(trimToNull(result.normalizedParroquia()));
        order.setNormalizedZona(trimToNull(result.normalizedZona()));
        order.setNormalizedReferencia(trimToNull(result.normalizedReferencia()));
        order.setNormalizedLatitude(result.normalizedLatitude());
        order.setNormalizedLongitude(result.normalizedLongitude());
        order.setNormalizationConfidence(result.confidence());
        order.setNormalizationFallbackUsed(result.fallbackUsed());
        order.setAddressReviewStatus(status);
        order.setNormalizedAt(LocalDateTime.now());
        orderRepository.save(order);
    }

    private AiNormalizationLog saveLog(UUID orderId,
                                       UUID tenantId,
                                       String rawAddress,
                                       AddressNormalizationResult result,
                                       AiNormalizationStatus status) {
        AiNormalizationLog log = AiNormalizationLog.builder()
                .tenantId(tenantId)
                .orderId(orderId)
                .rawInputAddress(rawAddress)
                .normalizedOutputPayload(result.normalizedOutputPayload() != null
                        ? result.normalizedOutputPayload()
                        : toJson(buildOutputPayload(result)))
                .normalizationConfidence(result.confidence())
                .modelName(result.modelName())
                .normalizationStatus(status)
                .correctedManually(false)
                .build();
        return aiNormalizationLogRepository.save(log);
    }

    private AiNormalizationStatus resolveStatus(AddressNormalizationResult result) {
        if (result.fallbackUsed()) {
            return AiNormalizationStatus.FALLBACK;
        }
        if (result.reviewStatus() == AddressReviewStatus.REVIEW_REQUIRED) {
            return AiNormalizationStatus.MANUAL_REVIEW;
        }
        return AiNormalizationStatus.COMPLETED;
    }

    private AddressNormalizationAttemptResponse toAttemptResponse(Order order, AiNormalizationLog log) {
        return new AddressNormalizationAttemptResponse(
                order.getId(),
                log.getRawInputAddress(),
                order.getNormalizedAddress(),
                order.getNormalizedState(),
                order.getNormalizedMunicipio(),
                order.getNormalizedParroquia(),
                order.getNormalizedZona(),
                order.getNormalizedReferencia(),
                order.getNormalizedLatitude(),
                order.getNormalizedLongitude(),
                order.getNormalizationConfidence(),
                order.isNormalizationFallbackUsed(),
                order.getAddressReviewStatus(),
                log.getModelName(),
                log.getNormalizationStatus(),
                log.isCorrectedManually(),
                order.getNormalizedAt(),
                log.getCreatedAt()
        );
    }

    private Map<String, Object> buildOutputPayload(AddressNormalizationResult result) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("normalizedAddress", result.normalizedAddress());
        payload.put("normalizedState", result.normalizedState());
        payload.put("normalizedMunicipio", result.normalizedMunicipio());
        payload.put("normalizedParroquia", result.normalizedParroquia());
        payload.put("normalizedZona", result.normalizedZona());
        payload.put("normalizedReferencia", result.normalizedReferencia());
        payload.put("normalizedLatitude", result.normalizedLatitude());
        payload.put("normalizedLongitude", result.normalizedLongitude());
        payload.put("confidence", result.confidence());
        payload.put("fallbackUsed", result.fallbackUsed());
        payload.put("reviewStatus", result.reviewStatus());
        payload.put("modelName", result.modelName());
        payload.put("fallbackReason", result.fallbackReason());
        return payload;
    }

    private Map<String, Object> buildOutputPayload(Order order, Double confidence) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("normalizedAddress", order.getNormalizedAddress());
        payload.put("normalizedState", order.getNormalizedState());
        payload.put("normalizedMunicipio", order.getNormalizedMunicipio());
        payload.put("normalizedParroquia", order.getNormalizedParroquia());
        payload.put("normalizedZona", order.getNormalizedZona());
        payload.put("normalizedReferencia", order.getNormalizedReferencia());
        payload.put("normalizedLatitude", order.getNormalizedLatitude());
        payload.put("normalizedLongitude", order.getNormalizedLongitude());
        payload.put("confidence", confidence);
        payload.put("reviewStatus", order.getAddressReviewStatus());
        return payload;
    }

    private Map<String, Object> buildCorrectionPayload(Order order) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("normalizedAddress", order.getNormalizedAddress());
        payload.put("normalizedState", order.getNormalizedState());
        payload.put("normalizedMunicipio", order.getNormalizedMunicipio());
        payload.put("normalizedParroquia", order.getNormalizedParroquia());
        payload.put("normalizedZona", order.getNormalizedZona());
        payload.put("normalizedReferencia", order.getNormalizedReferencia());
        payload.put("normalizedLatitude", order.getNormalizedLatitude());
        payload.put("normalizedLongitude", order.getNormalizedLongitude());
        payload.put("reviewStatus", AddressReviewStatus.REVIEW_APPROVED.name());
        return payload;
    }

    private String toJson(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (Exception ex) {
            return null;
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private Order findOrder(UUID orderId, UUID tenantId) {
        return orderRepository.findByIdAndTenantId(orderId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
    }

    private UUID requiredTenantId() {
        UUID tenantId = TenantContext.getCurrentTenantId();
        if (tenantId == null) {
            throw new BusinessException("Tenant context is required");
        }
        return tenantId;
    }
}
