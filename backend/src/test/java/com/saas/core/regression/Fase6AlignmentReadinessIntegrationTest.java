package com.saas.core.regression;

import com.saas.core.security.JwtService;
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
@DisplayName("Fase 6 alignment readiness integration checks")
class Fase6AlignmentReadinessIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("saas_test_fase6_alignment")
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
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM ai_normalization_logs");
        jdbcTemplate.update("DELETE FROM order_status_history");
        jdbcTemplate.update("DELETE FROM route_stops");
        jdbcTemplate.update("DELETE FROM routes");
        jdbcTemplate.update("DELETE FROM orders");
        jdbcTemplate.update("DELETE FROM vehicles");
        jdbcTemplate.update("DELETE FROM tenants WHERE rif LIKE 'J-F6-%'");
    }

    @Test
    @DisplayName("should keep legacy and canonical tracking endpoints aligned")
    void shouldKeepLegacyAndCanonicalTrackingEndpointsAligned() throws Exception {
        UUID tenantId = insertTenant("J-F6-TRACK");
        UUID orderId = insertOrder(tenantId, "TRK-F6-20260315-0001", "CREATED");
        insertHistory(orderId, tenantId, "CREATED");

        mockMvc.perform(get("/api/tracking/{trackingCode}", "TRK-F6-20260315-0001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trackingCode").value("TRK-F6-20260315-0001"))
                .andExpect(jsonPath("$.currentStatus").value("CREATED"));

        mockMvc.perform(get("/api/public/tracking/{trackingCode}", "TRK-F6-20260315-0001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trackingCode").value("TRK-F6-20260315-0001"))
                .andExpect(jsonPath("$.currentStatus").value("CREATED"));
    }

    @Test
    @DisplayName("should execute Gemini-only normalization path and persist gemini model log")
    void shouldExecuteGeminiOnlyNormalizationPathAndPersistGeminiModelLog() throws Exception {
        UUID tenantId = insertTenant("J-F6-AI");
        UUID orderId = insertOrder(tenantId, "TRK-F6-AI-20260315-0001", "CREATED");

        mockMvc.perform(post("/api/ai/address-normalizations/{orderId}", orderId)
                        .header("Authorization", bearer("DESPACHADOR", tenantId))
                        .contentType("application/json")
                        .content("""
                                {"rawAddress":"Sector Centro"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.modelName").value("gemini"))
                .andExpect(jsonPath("$.fallbackUsed").value(true));

        Integer logs = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM ai_normalization_logs WHERE tenant_id = ? AND order_id = ? AND model_name = 'gemini'",
                Integer.class,
                tenantId,
                orderId
        );

        assertThat(logs).isEqualTo(1);
    }

    @Test
    @DisplayName("should keep superadmin tenant panel protected")
    void shouldKeepSuperadminTenantPanelProtected() throws Exception {
        mockMvc.perform(get("/api/admin/tenants"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/admin/tenants")
                        .header("Authorization", bearer("ADMIN_PYME", UUID.randomUUID())))
                .andExpect(status().isForbidden());
    }

    private String bearer(String role, UUID tenantId) {
        String token = jwtService.generateAccessToken(UUID.randomUUID(), role.toLowerCase() + "@test.com", role, tenantId);
        return "Bearer " + token;
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

    private UUID insertOrder(UUID tenantId, String trackingCode, String status) {
        return jdbcTemplate.queryForObject(
                """
                INSERT INTO orders(tenant_id, tracking_code, status, created_at, updated_at)
                VALUES (?, ?, ?, now(), now())
                RETURNING id
                """,
                UUID.class,
                tenantId,
                trackingCode,
                status
        );
    }

    private void insertHistory(UUID orderId, UUID tenantId, String status) {
        jdbcTemplate.update(
                """
                INSERT INTO order_status_history(order_id, tenant_id, status, changed_at)
                VALUES (?, ?, ?, now())
                """,
                orderId,
                tenantId,
                status
        );
    }
}
