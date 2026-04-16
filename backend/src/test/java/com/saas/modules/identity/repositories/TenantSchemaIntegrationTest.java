package com.saas.modules.identity.repositories;

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

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@DisplayName("Tenant schema integration tests")
class TenantSchemaIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("saas_test_tenant_schema")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("should expose tenant suspension and reactivation audit columns")
    void shouldExposeTenantSuspensionAndReactivationAuditColumns() {
        List<String> columns = jdbcTemplate.queryForList(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'tenants'
                """,
                String.class
        );

        assertThat(columns).contains(
                "suspended_at",
                "suspended_by",
                "suspension_reason",
                "reactivated_at",
                "reactivated_by",
                "reactivation_reason",
                "status_changed_at"
        );
    }

    @Test
    @DisplayName("should create tenant lifecycle constraint and status suspension index")
    void shouldCreateTenantLifecycleConstraintAndStatusSuspensionIndex() {
        List<String> constraints = jdbcTemplate.queryForList(
                """
                SELECT conname
                FROM pg_constraint
                WHERE conname = 'chk_tenants_lifecycle_dates'
                """,
                String.class
        );
        List<String> indexes = jdbcTemplate.queryForList(
                """
                SELECT indexdef
                FROM pg_indexes
                WHERE schemaname = 'public'
                  AND tablename = 'tenants'
                """,
                String.class
        );

        assertThat(constraints).contains("chk_tenants_lifecycle_dates");
        assertThat(indexes).anyMatch(index -> index.contains("idx_tenants_status_suspended_at")
                && index.contains("(status, suspended_at DESC)"));
    }
}
