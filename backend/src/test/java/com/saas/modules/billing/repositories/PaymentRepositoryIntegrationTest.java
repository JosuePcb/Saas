package com.saas.modules.billing.repositories;

import com.saas.modules.billing.models.Payment;
import com.saas.modules.billing.models.PaymentMethod;
import com.saas.modules.billing.models.PaymentStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@DisplayName("PaymentRepository integration tests")
class PaymentRepositoryIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("saas_test_billing_repo")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private UUID tenantA;
    private UUID tenantB;

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM payments");
        jdbcTemplate.update("DELETE FROM tenants WHERE rif LIKE 'J-BILLING-REPO-%'");

        tenantA = insertTenant("J-BILLING-REPO-A");
        tenantB = insertTenant("J-BILLING-REPO-B");
    }

    @Test
    @DisplayName("should create payments table with expected columns")
    void shouldCreatePaymentsTableWithExpectedColumns() {
        List<String> columns = jdbcTemplate.queryForList(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'payments'
                """,
                String.class
        );

        assertThat(columns).contains(
                "id",
                "tenant_id",
                "method",
                "status",
                "amount",
                "reference_number",
                "payment_date_time",
                "evidence_url",
                "created_at",
                "updated_at"
        );
    }

    @Test
    @DisplayName("should return only tenant-scoped payments filtered by status and sorted by createdAt")
    void shouldReturnTenantScopedPayments() {
        Payment tenantPendingOld = buildPayment(tenantA, PaymentStatus.PENDING_VALIDATION,
                LocalDateTime.now().minusHours(3));
        Payment tenantPendingNew = buildPayment(tenantA, PaymentStatus.PENDING_VALIDATION,
                LocalDateTime.now().minusHours(1));
        Payment tenantApproved = buildPayment(tenantA, PaymentStatus.APPROVED,
                LocalDateTime.now().minusHours(2));
        Payment otherTenant = buildPayment(tenantB, PaymentStatus.PENDING_VALIDATION,
                LocalDateTime.now().minusHours(4));

        paymentRepository.saveAll(List.of(tenantPendingOld, tenantPendingNew, tenantApproved, otherTenant));

        List<Payment> pendingPayments = paymentRepository
                .findByTenantIdAndStatusOrderByCreatedAtDesc(tenantA, PaymentStatus.PENDING_VALIDATION);

        assertThat(pendingPayments).hasSize(2);
        assertThat(pendingPayments).allMatch(payment -> payment.getTenantId().equals(tenantA));
        assertThat(pendingPayments).allMatch(payment -> payment.getStatus() == PaymentStatus.PENDING_VALIDATION);
        assertThat(pendingPayments.get(0).getCreatedAt()).isAfter(pendingPayments.get(1).getCreatedAt());
    }

    @Test
    @DisplayName("should create index for tenant status createdAt lookup")
    void shouldCreateTenantStatusCreatedAtIndex() {
        List<String> indexes = jdbcTemplate.queryForList(
                """
                SELECT indexdef
                FROM pg_indexes
                WHERE schemaname = 'public' AND tablename = 'payments'
                """,
                String.class
        );

        assertThat(indexes)
                .anyMatch(index -> index.contains("(tenant_id, status, created_at"));
    }

    private Payment buildPayment(UUID tenantId, PaymentStatus status, LocalDateTime createdAt) {
        Payment payment = Payment.builder()
                .tenantId(tenantId)
                .method(PaymentMethod.PAGO_MOVIL)
                .status(status)
                .amount(new BigDecimal("100.00"))
                .referenceNumber(UUID.randomUUID().toString())
                .paymentDateTime(LocalDateTime.now().minusDays(1))
                .evidenceUrl("https://evidence.local/payment.png")
                .createdAt(createdAt)
                .updatedAt(createdAt)
                .build();
        return payment;
    }

    private UUID insertTenant(String rif) {
        return jdbcTemplate.queryForObject(
                """
                INSERT INTO tenants(nombre, rif, status, created_at, updated_at)
                VALUES (?, ?, 'TRIAL', now(), now())
                RETURNING id
                """,
                UUID.class,
                "Tenant " + rif,
                rif
        );
    }
}
