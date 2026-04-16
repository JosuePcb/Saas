package com.saas.modules.logistics.models;

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
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "tracking_code", nullable = false, length = 40)
    private String trackingCode;

    @Column(nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    @Column(name = "pod_object_key", length = 400)
    private String podObjectKey;

    @Column(name = "pod_content_type", length = 120)
    private String podContentType;

    @Column(name = "pod_size_bytes")
    private Long podSizeBytes;

    @Column(name = "pod_uploaded_at")
    private LocalDateTime podUploadedAt;

    @Column(name = "normalized_address", length = 500)
    private String normalizedAddress;

    @Column(name = "normalized_state", length = 120)
    private String normalizedState;

    @Column(name = "normalized_municipio", length = 120)
    private String normalizedMunicipio;

    @Column(name = "normalized_parroquia", length = 120)
    private String normalizedParroquia;

    @Column(name = "normalized_zona", length = 120)
    private String normalizedZona;

    @Column(name = "normalized_referencia", length = 500)
    private String normalizedReferencia;

    @Column(name = "normalized_latitude")
    private Double normalizedLatitude;

    @Column(name = "normalized_longitude")
    private Double normalizedLongitude;

    @Column(name = "normalization_confidence")
    private Double normalizationConfidence;

    @Column(name = "normalization_fallback_used", nullable = false)
    @Builder.Default
    private boolean normalizationFallbackUsed = false;

    @Column(name = "address_review_status", length = 30)
    @Enumerated(EnumType.STRING)
    private AddressReviewStatus addressReviewStatus;

    @Column(name = "normalized_at")
    private LocalDateTime normalizedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
