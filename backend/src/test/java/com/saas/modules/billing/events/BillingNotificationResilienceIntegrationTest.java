package com.saas.modules.billing.events;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.saas.core.security.JwtService;
import com.saas.modules.billing.dtos.PaymentDecision;
import com.saas.modules.billing.dtos.PaymentDecisionRequest;
import com.saas.modules.billing.notifications.BillingNotificationAdapter;
import com.saas.modules.identity.models.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@DisplayName("Billing notification resilience integration tests")
class BillingNotificationResilienceIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("saas_test_billing_notification_resilience")
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

    @MockitoBean
    private BillingNotificationAdapter notificationAdapter;

    private String superAdminToken;
    private UUID reviewerId;
    private UUID tenantId;
    private UUID pendingPaymentId;

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM payments");
        jdbcTemplate.update("DELETE FROM tenants WHERE rif LIKE 'J-BILLING-NOTIF-%'");

        reviewerId = UUID.randomUUID();
        superAdminToken = jwtService.generateAccessToken(reviewerId, "superadmin@saas.com", UserRole.SUPER_ADMIN.name(), null);

        tenantId = insertTenant("J-BILLING-NOTIF-A", "TRIAL");
        pendingPaymentId = insertPayment(tenantId, "PENDING_VALIDATION", "REF-NOTIF-1", LocalDateTime.now().minusHours(2));
    }

    @Test
    @DisplayName("adapter failure does not rollback approve decision flow")
    void shouldNotRollbackDecisionWhenNotificationAdapterFails() throws Exception {
        doThrow(new RuntimeException("notification adapter unavailable"))
                .when(notificationAdapter)
                .sendPaymentApproved(any(PaymentDecisionEvent.class));

        PaymentDecisionRequest request = new PaymentDecisionRequest(PaymentDecision.APPROVE, "Approved despite notification outage");

        mockMvc.perform(post("/api/admin/billing/payments/{id}/decision", pendingPaymentId)
                        .header("Authorization", "Bearer " + superAdminToken)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        String paymentStatus = jdbcTemplate.queryForObject(
                "SELECT status FROM payments WHERE id = ?",
                String.class,
                pendingPaymentId
        );
        String tenantStatus = jdbcTemplate.queryForObject(
                "SELECT status FROM tenants WHERE id = ?",
                String.class,
                tenantId
        );

        org.assertj.core.api.Assertions.assertThat(paymentStatus).isEqualTo("APPROVED");
        org.assertj.core.api.Assertions.assertThat(tenantStatus).isEqualTo("ACTIVE");
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
