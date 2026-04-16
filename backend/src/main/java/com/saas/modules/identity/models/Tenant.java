package com.saas.modules.identity.models;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tenants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String nombre;

    @Column(nullable = false, unique = true, length = 20)
    private String rif;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TenantStatus status;

    @Column(name = "plan_id")
    private UUID planId;

    @Column(name = "fecha_registro", nullable = false)
    @CreationTimestamp
    private LocalDateTime fechaRegistro;

    @Column(name = "fecha_corte")
    private LocalDateTime fechaCorte;

    @Column(name = "suspended_at")
    private LocalDateTime suspendedAt;

    @Column(name = "suspended_by")
    private UUID suspendedBy;

    @Column(name = "suspension_reason", length = 300)
    private String suspensionReason;

    @Column(name = "reactivated_at")
    private LocalDateTime reactivatedAt;

    @Column(name = "reactivated_by")
    private UUID reactivatedBy;

    @Column(name = "reactivation_reason", length = 300)
    private String reactivationReason;

    @Column(name = "status_changed_at", nullable = false)
    private LocalDateTime statusChangedAt;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "zona_operacion", length = 200)
    private String zonaOperacion;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
