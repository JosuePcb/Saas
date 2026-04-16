package com.saas.modules.ai.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.saas.modules.ai.dtos.AddressNormalizationResult;
import com.saas.modules.logistics.models.AddressReviewStatus;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class GeminiAddressNormalizationAdapterImpl implements GeminiAddressNormalizationAdapter {

    private static final double AUTO_ACCEPT_THRESHOLD = 0.80;
    private static final String MODEL_NAME = "gemini";

    private final ObjectProvider<ChatModel> chatModelProvider;
    private final ObjectMapper objectMapper;

    public GeminiAddressNormalizationAdapterImpl(ObjectProvider<ChatModel> chatModelProvider,
                                                 ObjectMapper objectMapper) {
        this.chatModelProvider = chatModelProvider;
        this.objectMapper = objectMapper;
    }

    @Override
    public AddressNormalizationResult normalize(String rawAddress) {
        String cleanedInput = rawAddress == null ? "" : rawAddress.trim();
        if (cleanedInput.isBlank()) {
            return fallback(cleanedInput, "empty-input");
        }

        ChatModel chatModel = chatModelProvider.getIfAvailable();
        if (chatModel == null) {
            return fallback(cleanedInput, "gemini-unavailable");
        }

        try {
            Map<String, Object> payload = ChatClient.create(chatModel)
                    .prompt()
                    .system(systemPrompt())
                    .user(userPrompt(cleanedInput))
                    .call()
                    .entity(Map.class);
            if (payload == null || payload.isEmpty()) {
                return fallback(cleanedInput, "empty-model-payload");
            }

            String normalizedAddress = readString(payload, "normalizedAddress", cleanedInput);
            String normalizedState = readString(payload, "normalizedState", null);
            String normalizedMunicipio = readString(payload, "normalizedMunicipio", null);
            String normalizedParroquia = readString(payload, "normalizedParroquia", null);
            String normalizedZona = readString(payload, "normalizedZona", null);
            String normalizedReferencia = readString(payload, "normalizedReferencia", null);
            Double normalizedLatitude = readDouble(payload, "normalizedLatitude");
            Double normalizedLongitude = readDouble(payload, "normalizedLongitude");
            double confidence = clamp(readDouble(payload, "confidence"), 0.65);

            boolean fallbackUsed = confidence < AUTO_ACCEPT_THRESHOLD;
            AddressReviewStatus reviewStatus = fallbackUsed
                    ? AddressReviewStatus.REVIEW_REQUIRED
                    : AddressReviewStatus.AUTO_ACCEPTED;

            return new AddressNormalizationResult(
                    normalizedAddress,
                    normalizedState,
                    normalizedMunicipio,
                    normalizedParroquia,
                    normalizedZona,
                    normalizedReferencia,
                    normalizedLatitude,
                    normalizedLongitude,
                    confidence,
                    fallbackUsed,
                    reviewStatus,
                    MODEL_NAME,
                    safePayload(payload),
                    fallbackUsed ? "low-confidence" : null
            );
        } catch (Exception ex) {
            return fallback(cleanedInput, "gemini-error");
        }
    }

    private String systemPrompt() {
        return """
                You are a Venezuelan logistics address normalizer.
                Return only valid JSON with keys:
                normalizedAddress, normalizedState, normalizedMunicipio, normalizedParroquia,
                normalizedZona, normalizedReferencia, normalizedLatitude, normalizedLongitude, confidence.
                confidence must be a number from 0.0 to 1.0.
                Use null for unknown fields.
                """;
    }

    private String userPrompt(String rawAddress) {
        return "Normalize this Venezuelan address: " + rawAddress;
    }

    private AddressNormalizationResult fallback(String cleanedInput, String reason) {
        return new AddressNormalizationResult(
                cleanedInput,
                null,
                null,
                null,
                null,
                cleanedInput,
                null,
                null,
                0.65,
                true,
                AddressReviewStatus.REVIEW_REQUIRED,
                MODEL_NAME,
                null,
                reason
        );
    }

    private String safePayload(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (Exception ex) {
            return null;
        }
    }

    private String readString(Map<String, Object> payload, String key, String defaultValue) {
        Object value = payload.get(key);
        if (value == null) {
            return defaultValue;
        }
        String text = value.toString().trim();
        return text.isBlank() ? defaultValue : text;
    }

    private Double readDouble(Map<String, Object> payload, String key) {
        Object value = payload.get(key);
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private double clamp(Double value, double defaultValue) {
        double resolved = value == null ? defaultValue : value;
        if (resolved < 0.0) {
            return 0.0;
        }
        return Math.min(resolved, 1.0);
    }
}
