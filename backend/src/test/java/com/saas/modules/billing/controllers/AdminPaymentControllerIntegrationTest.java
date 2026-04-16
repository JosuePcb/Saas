package com.saas.modules.billing.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.saas.core.security.JwtService;
import com.saas.modules.billing.dtos.PaymentDecision;
import com.saas.modules.billing.dtos.PaymentDecisionRequest;
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
@DisplayName("AdminPaymentController integration tests")
class AdminPaymentControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("saas_test_billing_admin")
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
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String superAdminToken;
    private String adminPymeToken;
    private UUID reviewerId;
    private UUID tenantA;
    private UUID pendingPaymentId;
    private UUID approvedPaymentId;

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM payments");
        jdbcTemplate.update("DELETE FROM tenants WHERE rif LIKE 'J-BILLING-ADMIN-%'");

        reviewerId = UUID.randomUUID();
        superAdminToken = jwtService.generateAccessToken(reviewerId, "superadmin@saas.com", UserRole.SUPER_ADMIN.name(), null);
        adminPymeToken = jwtService.generateAccessToken(UUID.randomUUID(), "admin@tenant.com", UserRole.ADMIN_PYME.name(), UUID.randomUUID());

        tenantA = insertTenant("J-BILLING-ADMIN-A", "TRIAL");
        UUID tenantB = insertTenant("J-BILLING-ADMIN-B", "TRIAL");

        pendingPaymentId = insertPayment(tenantA, "PENDING_VALIDATION", "REF-ADM-PEND-1", LocalDateTime.now().minusHours(3));
        insertPayment(tenantB, "PENDING_VALIDATION", "REF-ADM-PEND-2", LocalDateTime.now().minusHours(2));
        approvedPaymentId = insertPayment(tenantA, "APPROVED", "REF-ADM-APP-1", LocalDateTime.now().minusHours(1));
    }

    @Test
    @DisplayName("GET /api/admin/billing/payments returns only pending queue for SUPER_ADMIN")
    void shouldReturnPendingQueueForSuperAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/billing/payments")
                        .header("Authorization", "Bearer " + superAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].status").value("PENDING_VALIDATION"));
    }

    @Test
    @DisplayName("GET /api/admin/billing/payments rejects ADMIN_PYME")
    void shouldRejectAdminPymeOnAdminQueue() throws Exception {
        mockMvc.perform(get("/api/admin/billing/payments")
                        .header("Authorization", "Bearer " + adminPymeToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/admin/billing/payments/{id}/decision approve updates payment and tenant")
    void shouldApprovePaymentAndActivateTenant() throws Exception {
        PaymentDecisionRequest request = new PaymentDecisionRequest(PaymentDecision.APPROVE, "Validated by operations");

        mockMvc.perform(post("/api/admin/billing/payments/{id}/decision", pendingPaymentId)
                        .header("Authorization", "Bearer " + superAdminToken)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.decisionComment").value("Validated by operations"));

        String tenantStatus = jdbcTemplate.queryForObject(
                "SELECT status FROM tenants WHERE id = ?",
                String.class,
                tenantA
        );
        Timestamp reviewedAt = jdbcTemplate.queryForObject(
                "SELECT reviewed_at FROM payments WHERE id = ?",
                Timestamp.class,
                pendingPaymentId
        );
        UUID reviewedBy = jdbcTemplate.queryForObject(
                "SELECT reviewed_by_user_id FROM payments WHERE id = ?",
                UUID.class,
                pendingPaymentId
        );

        org.assertj.core.api.Assertions.assertThat(tenantStatus).isEqualTo("ACTIVE");
        org.assertj.core.api.Assertions.assertThat(reviewedAt).isNotNull();
        org.assertj.core.api.Assertions.assertThat(reviewedBy).isEqualTo(reviewerId);
    }

    @Test
    @DisplayName("POST /api/admin/billing/payments/{id}/decision rejects transition from non-pending")
    void shouldRejectDecisionFromNonPendingStatus() throws Exception {
        PaymentDecisionRequest request = new PaymentDecisionRequest(PaymentDecision.REJECT, "Late review");

        mockMvc.perform(post("/api/admin/billing/payments/{id}/decision", approvedPaymentId)
                        .header("Authorization", "Bearer " + superAdminToken)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Payment decision can only be applied from PENDING_VALIDATION"));
    }

    private UUID insertTenant(String rif, String status) {
        return jdbcTemplate.queryForObject(
                """
                INSERT INTO tenants(nombre, rif, status, created_at, updated_at)
                VALUES (?, ?, ?, now(), now())
                RETURNING id
                """,
                UUID.class,
                "Tenant " + rif,
                rif,
                status
        );
    }

    private UUID insertPayment(UUID tenantId, String status, String reference, LocalDateTime createdAt) {
        return jdbcTemplate.queryForObject(
                """
                INSERT INTO payments(tenant_id, method, status, amount, reference_number, payment_date_time, evidence_url, created_at, updated_at)
                VALUES (?, 'PAGO_MOVIL', ?, ?, ?, ?, ?, ?, ?)
                RETURNING id
                """,
                UUID.class,
                tenantId,
                status,
                new BigDecimal("50.00"),
                reference,
                Timestamp.valueOf(createdAt.minusMinutes(30)),
                "https://cdn.local/integration-evidence.png",
                Timestamp.valueOf(createdAt),
                Timestamp.valueOf(createdAt)
        );
    }
}
