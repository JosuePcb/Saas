package com.saas.modules.identity.controllers;

import com.saas.core.security.JwtService;
import com.saas.modules.identity.models.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@DisplayName("AdminTenantController integration tests")
class AdminTenantControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("saas_test_admin_tenants")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String superAdminToken;
    private String adminPymeToken;
    private UUID superAdminUserId;
    private UUID activeTenantId;
    private UUID suspendedTenantId;

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM payments");
        jdbcTemplate.update("DELETE FROM tenants WHERE rif LIKE 'J-ADM-TEN-%'");

        superAdminUserId = UUID.randomUUID();
        superAdminToken = jwtService.generateAccessToken(superAdminUserId, "superadmin@saas.com", UserRole.SUPER_ADMIN.name(), null);
        adminPymeToken = jwtService.generateAccessToken(UUID.randomUUID(), "admin@tenant.com", UserRole.ADMIN_PYME.name(), UUID.randomUUID());

        activeTenantId = insertTenant("J-ADM-TEN-A", "ACTIVE");
        suspendedTenantId = insertTenant("J-ADM-TEN-B", "SUSPENDED");

        insertPendingPayment(activeTenantId, "REF-ADM-TEN-1", LocalDateTime.now().minusHours(2));
        insertPendingPayment(activeTenantId, "REF-ADM-TEN-2", LocalDateTime.now().minusHours(1));
    }

    @Test
    @DisplayName("GET /api/admin/tenants requires SUPER_ADMIN")
    void shouldEnforceSuperAdminForTenantList() throws Exception {
        mockMvc.perform(get("/api/admin/tenants"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/admin/tenants")
                        .header("Authorization", "Bearer " + adminPymeToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/admin/tenants with status filter returns matching tenants")
    void shouldFilterTenantsByStatus() throws Exception {
        mockMvc.perform(get("/api/admin/tenants")
                        .param("status", "SUSPENDED")
                        .header("Authorization", "Bearer " + superAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(suspendedTenantId.toString()))
                .andExpect(jsonPath("$[0].status").value("SUSPENDED"));
    }

    @Test
    @DisplayName("GET /api/admin/tenants/metrics includes pending queue summary")
    void shouldReturnGlobalMetricsWithPendingQueue() throws Exception {
        mockMvc.perform(get("/api/admin/tenants/metrics")
                        .header("Authorization", "Bearer " + superAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalTenants").value(2))
                .andExpect(jsonPath("$.pendingPaymentQueueSize").value(2))
                .andExpect(jsonPath("$.tenantsWithPendingPayments").value(1));
    }

    @Test
    @DisplayName("POST /api/admin/tenants/{id}/suspend stores audited transition")
    void shouldSuspendTenantWithAuditMetadata() throws Exception {
        mockMvc.perform(post("/api/admin/tenants/{tenantId}/suspend", activeTenantId)
                        .header("Authorization", "Bearer " + superAdminToken)
                        .contentType("application/json")
                        .content("{\"reason\":\"Repeated fraud signals\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUSPENDED"))
                .andExpect(jsonPath("$.suspensionReason").value("Repeated fraud signals"));

        String updatedStatus = jdbcTemplate.queryForObject(
                "SELECT status FROM tenants WHERE id = ?",
                String.class,
                activeTenantId
        );
        UUID suspendedBy = jdbcTemplate.queryForObject(
                "SELECT suspended_by FROM tenants WHERE id = ?",
                UUID.class,
                activeTenantId
        );

        org.assertj.core.api.Assertions.assertThat(updatedStatus).isEqualTo("SUSPENDED");
        org.assertj.core.api.Assertions.assertThat(suspendedBy).isEqualTo(superAdminUserId);
    }

    @Test
    @DisplayName("POST /api/admin/tenants/{id}/reactivate re-enables suspended tenant")
    void shouldReactivateSuspendedTenant() throws Exception {
        mockMvc.perform(post("/api/admin/tenants/{tenantId}/reactivate", suspendedTenantId)
                        .header("Authorization", "Bearer " + superAdminToken)
                        .contentType("application/json")
                        .content("{\"reason\":\"Payment settled\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.reactivationReason").value("Payment settled"));

        String updatedStatus = jdbcTemplate.queryForObject(
                "SELECT status FROM tenants WHERE id = ?",
                String.class,
                suspendedTenantId
        );
        UUID reactivatedBy = jdbcTemplate.queryForObject(
                "SELECT reactivated_by FROM tenants WHERE id = ?",
                UUID.class,
                suspendedTenantId
        );

        org.assertj.core.api.Assertions.assertThat(updatedStatus).isEqualTo("ACTIVE");
        org.assertj.core.api.Assertions.assertThat(reactivatedBy).isEqualTo(superAdminUserId);
    }

    private UUID insertTenant(String rif, String status) {
        return jdbcTemplate.queryForObject(
                """
                INSERT INTO tenants(
                    nombre,
                    rif,
                    status,
                    status_changed_at,
                    created_at,
                    updated_at,
                    suspended_at
                )
                VALUES (?, ?, ?, now(), now(), now(), CASE WHEN ? = 'SUSPENDED' THEN now() ELSE NULL END)
                RETURNING id
                """,
                UUID.class,
                "Tenant " + rif,
                rif,
                status,
                status
        );
    }

    private UUID insertPendingPayment(UUID tenantId, String reference, LocalDateTime createdAt) {
        return jdbcTemplate.queryForObject(
                """
                INSERT INTO payments(tenant_id, method, status, amount, reference_number, payment_date_time, evidence_url, created_at, updated_at)
                VALUES (?, 'PAGO_MOVIL', 'PENDING_VALIDATION', ?, ?, ?, ?, ?, ?)
                RETURNING id
                """,
                UUID.class,
                tenantId,
                new BigDecimal("50.00"),
                reference,
                Timestamp.valueOf(createdAt.minusMinutes(20)),
                "https://cdn.local/admin-tenant-payment.png",
                Timestamp.valueOf(createdAt),
                Timestamp.valueOf(createdAt)
        );
    }
}
