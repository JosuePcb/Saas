package com.saas.core.security;

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

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@DisplayName("Security migration regression integration tests")
class SecurityMigrationRegressionIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("saas_test_security_migration_regression")
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

    @Test
    @DisplayName("should keep protected logistics endpoint returning 401 without token after migrations")
    void shouldKeepProtectedLogisticsEndpointReturning401WithoutTokenAfterMigrations() throws Exception {
        assertMigrationsApplied();

        mockMvc.perform(get("/api/logistics/orders/{id}/history", UUID.randomUUID()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Authentication required"));
    }

    @Test
    @DisplayName("should keep protected admin endpoint returning 403 for non-super-admin after migrations")
    void shouldKeepProtectedAdminEndpointReturning403ForNonSuperAdminAfterMigrations() throws Exception {
        assertMigrationsApplied();

        String adminPymeToken = jwtService.generateAccessToken(
                UUID.randomUUID(),
                "admin.pyme@migration.test",
                "ADMIN_PYME",
                UUID.randomUUID()
        );

        mockMvc.perform(get("/api/admin/billing/payments")
                        .header("Authorization", "Bearer " + adminPymeToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"))
                .andExpect(jsonPath("$.message").value("Insufficient permissions"));
    }

    private void assertMigrationsApplied() {
        Integer applied = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM flyway_schema_history
                WHERE version IN ('15', '16')
                  AND success = true
                """,
                Integer.class
        );

        if (applied == null || applied < 2) {
            throw new IllegalStateException("Expected V15 and V16 to be applied before security regression checks");
        }
    }
}
