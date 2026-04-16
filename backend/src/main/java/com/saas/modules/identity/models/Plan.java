package com.saas.modules.identity.models;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Plan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(name = "precio_usd", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioUsd;

    @Column(name = "max_choferes", nullable = false)
    private Integer maxChoferes;

    @Column(name = "max_ordenes_mes", nullable = false)
    private Integer maxOrdenesMes;

    @Column(name = "max_vehiculos", nullable = false)
    private Integer maxVehiculos;

    @Column(name = "tiene_ia", nullable = false)
    @Builder.Default
    private Boolean tieneIa = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
