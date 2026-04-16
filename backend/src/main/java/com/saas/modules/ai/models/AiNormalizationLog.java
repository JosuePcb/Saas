package com.saas.modules.ai.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ai_normalization_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiNormalizationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "order_id", nullable = false)
    private UUID orderId;

    @Column(name = "raw_input_address", nullable = false)
    private String rawInputAddress;

    @Column(name = "normalized_output_payload")
    private String normalizedOutputPayload;

    @Column(name = "normalization_confidence")
    private Double normalizationConfidence;

    @Column(name = "model_name", nullable = false, length = 120)
    private String modelName;

    @Enumerated(EnumType.STRING)
    @Column(name = "normalization_status", nullable = false, length = 30)
    private AiNormalizationStatus normalizationStatus;

    @Column(name = "corrected_manually", nullable = false)
    @Builder.Default
    private boolean correctedManually = false;

    @Column(name = "correction_payload")
    private String correctionPayload;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
