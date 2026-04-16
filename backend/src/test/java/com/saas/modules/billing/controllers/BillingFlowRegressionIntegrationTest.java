package com.saas.modules.billing.controllers;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.saas.core.security.JwtService;
import com.saas.modules.billing.dtos.CreatePaymentRequest;
import com.saas.modules.billing.dtos.PaymentDecision;
import com.saas.modules.billing.dtos.PaymentDecisionRequest;
import com.saas.modules.billing.models.PaymentMethod;
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
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@DisplayName("Billing end-to-end regression integration tests")
class BillingFlowRegressionIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("saas_test_billing_flow_regression")
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

    private UUID tenantA;
    private UUID tenantB;
    private String tenantAToken;
    private String tenantBToken;
    private String superAdminToken;

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM payments");
        jdbcTemplate.update("DELETE FROM tenants WHERE rif LIKE 'J-BILLING-FLOW-%'");

        LocalDateTime now = LocalDateTime.now();
        tenantA = insertTenant("J-BILLING-FLOW-A", now.plusDays(7), "TRIAL");
        tenantB = insertTenant("J-BILLING-FLOW-B", now.plusDays(7), "TRIAL");

        tenantAToken = jwtService.generateAccessToken(
                UUID.randomUUID(),
                "admin.a@tenant.com",
                UserRole.ADMIN_PYME.name(),
                tenantA
        );
        tenantBToken = jwtService.generateAccessToken(
                UUID.randomUUID(),
                "admin.b@tenant.com",
                UserRole.ADMIN_PYME.name(),
                tenantB
        );
        superAdminToken = jwtService.generateAccessToken(
                UUID.randomUUID(),
                "superadmin@saas.com",
                UserRole.SUPER_ADMIN.name(),
                null
        );
    }

    @Test
    @DisplayName("tenant submit to superadmin approve updates tenant and keeps isolation")
    void shouldCoverSubmitApproveAndIsolation() throws Exception {
        UUID tenantAPaymentId = submitPayment(tenantAToken, "REF-FLOW-A-001");
        submitPayment(tenantBToken, "REF-FLOW-B-001");

        mockMvc.perform(get("/api/billing/payments")
                        .header("Authorization", "Bearer " + tenantAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].referenceNumber").value("REF-FLOW-A-001"));

        PaymentDecisionRequest approveRequest = new PaymentDecisionRequest(
                PaymentDecision.APPROVE,
                "Approved in end-to-end regression"
        );

        mockMvc.perform(post("/api/admin/billing/payments/{id}/decision", tenantAPaymentId)
                        .header("Authorization", "Bearer " + superAdminToken)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(approveRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        String tenantAStatus = jdbcTemplate.queryForObject(
                "SELECT status FROM tenants WHERE id = ?",
                String.class,
                tenantA
        );
        Timestamp tenantACutoff = jdbcTemplate.queryForObject(
                "SELECT fecha_corte FROM tenants WHERE id = ?",
                Timestamp.class,
                tenantA
        );
        Timestamp reviewedAt = jdbcTemplate.queryForObject(
                "SELECT reviewed_at FROM payments WHERE id = ?",
                Timestamp.class,
                tenantAPaymentId
        );
        String tenantBStatus = jdbcTemplate.queryForObject(
                "SELECT status FROM tenants WHERE id = ?",
                String.class,
                tenantB
        );

        assertThat(tenantAStatus).isEqualTo("ACTIVE");
        assertThat(tenantACutoff).isNotNull();
        assertThat(reviewedAt).isNotNull();
        assertThat(Duration.between(
                reviewedAt.toLocalDateTime().plusMonths(1),
                tenantACutoff.toLocalDateTime()).abs())
                .isLessThanOrEqualTo(Duration.ofSeconds(2));
        assertThat(tenantBStatus).isEqualTo("TRIAL");

        PaymentDecisionRequest rejectRequest = new PaymentDecisionRequest(PaymentDecision.REJECT, "Too late");
        mockMvc.perform(post("/api/admin/billing/payments/{id}/decision", tenantAPaymentId)
                        .header("Authorization", "Bearer " + superAdminToken)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(rejectRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Payment decision can only be applied from PENDING_VALIDATION"));
    }

    @Test
    @DisplayName("reject decision suspends tenant without mutating cutoff")
    void shouldSuspendTenantOnRejectWithoutChangingCutoff() throws Exception {
        UUID tenantBPaymentId = submitPayment(tenantBToken, "REF-FLOW-B-002");
        Timestamp cutoffBefore = jdbcTemplate.queryForObject(
                "SELECT fecha_corte FROM tenants WHERE id = ?",
                Timestamp.class,
                tenantB
        );

        PaymentDecisionRequest rejectRequest = new PaymentDecisionRequest(
                PaymentDecision.REJECT,
                "Rejected in end-to-end regression"
        );

        mockMvc.perform(post("/api/admin/billing/payments/{id}/decision", tenantBPaymentId)
                        .header("Authorization", "Bearer " + superAdminToken)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(rejectRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));

        String tenantBStatus = jdbcTemplate.queryForObject(
                "SELECT status FROM tenants WHERE id = ?",
                String.class,
                tenantB
        );
        Timestamp cutoffAfter = jdbcTemplate.queryForObject(
                "SELECT fecha_corte FROM tenants WHERE id = ?",
                Timestamp.class,
                tenantB
        );

        assertThat(tenantBStatus).isEqualTo("SUSPENDED");
        assertThat(cutoffAfter).isEqualTo(cutoffBefore);
    }

    private UUID submitPayment(String token, String referenceNumber) throws Exception {
        CreatePaymentRequest request = new CreatePaymentRequest(
                PaymentMethod.PAGO_MOVIL,
                new BigDecimal("49.99"),
                referenceNumber,
                LocalDateTime.now().minusMinutes(20),
                "https://cdn.local/e2e-evidence.png"
        );

        MvcResult result = mockMvc.perform(post("/api/billing/payments")
                        .header("Authorization", "Bearer " + token)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING_VALIDATION"))
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        return UUID.fromString(body.get("id").asText());
    }

    private UUID insertTenant(String rif, LocalDateTime fechaCorte, String status) {
        return jdbcTemplate.queryForObject(
                """
                INSERT INTO tenants(nombre, rif, status, fecha_corte, created_at, updated_at)
                VALUES (?, ?, ?, ?, now(), now())
                RETURNING id
                """,
                UUID.class,
                "Tenant " + rif,
                rif,
                status,
                Timestamp.valueOf(fechaCorte)
        );
    }
}
