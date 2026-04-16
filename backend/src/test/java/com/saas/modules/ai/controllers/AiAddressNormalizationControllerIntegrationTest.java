package com.saas.modules.ai.controllers;

import com.saas.core.security.JwtService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
@DisplayName("AI address normalization integration tests")
class AiAddressNormalizationControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("saas_test_ai_normalization")
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

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM ai_normalization_logs");
        jdbcTemplate.update("DELETE FROM order_status_history");
        jdbcTemplate.update("DELETE FROM route_stops");
        jdbcTemplate.update("DELETE FROM routes");
        jdbcTemplate.update("DELETE FROM orders");
        jdbcTemplate.update("DELETE FROM vehicles");
        jdbcTemplate.update("DELETE FROM tenants WHERE rif LIKE 'J-AI-%'");
    }

    @Test
    @DisplayName("should enforce 401 and 403 for AI normalization endpoint")
    void shouldEnforce401And403ForAiNormalizationEndpoint() throws Exception {
        UUID tenantId = insertTenant("J-AI-AUTH");
        UUID orderId = insertOrder(tenantId, "TRK-AIAUTH-20260312-0001", "CREATED");

        mockMvc.perform(post("/api/ai/address-normalizations/{orderId}", orderId)
                        .contentType("application/json")
                        .content("""
                                {"rawAddress":"Av. Principal 123, Caracas"}
                                """))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/ai/address-normalizations/{orderId}", orderId)
                        .header("Authorization", bearer("CHOFER", tenantId))
                        .contentType("application/json")
                        .content("""
                                {"rawAddress":"Av. Principal 123, Caracas"}
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("should enforce 401 and 403 for manual correction endpoint")
    void shouldEnforce401And403ForManualCorrectionEndpoint() throws Exception {
        UUID tenantId = insertTenant("J-AI-MANUAL-AUTH");
        UUID orderId = insertOrder(tenantId, "TRK-AIMANUALAUTH-20260312-0001", "CREATED");

        mockMvc.perform(post("/api/ai/address-normalizations/{orderId}/manual-correction", orderId)
                        .contentType("application/json")
                        .content("""
                                {
                                  "normalizedAddress":"Av. Libertador, Torre Norte",
                                  "normalizedState":"Distrito Capital",
                                  "normalizedMunicipio":"Libertador",
                                  "normalizedParroquia":"Catedral",
                                  "normalizedZona":"Centro",
                                  "normalizedReferencia":"Frente a la plaza",
                                  "normalizedLatitude":10.5048,
                                  "normalizedLongitude":-66.9208
                                }
                                """))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/ai/address-normalizations/{orderId}/manual-correction", orderId)
                        .header("Authorization", bearer("CHOFER", tenantId))
                        .contentType("application/json")
                        .content("""
                                {
                                  "normalizedAddress":"Av. Libertador, Torre Norte",
                                  "normalizedState":"Distrito Capital",
                                  "normalizedMunicipio":"Libertador",
                                  "normalizedParroquia":"Catedral",
                                  "normalizedZona":"Centro",
                                  "normalizedReferencia":"Frente a la plaza",
                                  "normalizedLatitude":10.5048,
                                  "normalizedLongitude":-66.9208
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("should enforce 401 and 403 for latest attempts endpoint")
    void shouldEnforce401And403ForLatestAttemptsEndpoint() throws Exception {
        UUID tenantId = insertTenant("J-AI-ATTEMPTS-AUTH");
        UUID orderId = insertOrder(tenantId, "TRK-AIATTEMPTSAUTH-20260312-0001", "CREATED");

        mockMvc.perform(get("/api/ai/address-normalizations/{orderId}/attempts/latest", orderId))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/ai/address-normalizations/{orderId}/attempts/latest", orderId)
                        .header("Authorization", bearer("CHOFER", tenantId)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("should normalize with Gemini-only fallback and persist log")
    void shouldNormalizeWithGeminiOnlyFallbackAndPersistLog() throws Exception {
        UUID tenantId = insertTenant("J-AI-NORM");
        UUID orderId = insertOrder(tenantId, "TRK-AINORM-20260312-0001", "CREATED");

        mockMvc.perform(post("/api/ai/address-normalizations/{orderId}", orderId)
                        .header("Authorization", bearer("DESPACHADOR", tenantId))
                        .contentType("application/json")
                        .content("""
                                {"rawAddress":"Sector Centro"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.modelName").value("gemini"))
                .andExpect(jsonPath("$.fallbackUsed").value(true))
                .andExpect(jsonPath("$.reviewStatus").value("REVIEW_REQUIRED"))
                .andExpect(jsonPath("$.confidence").value(0.65));

        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM ai_normalization_logs WHERE tenant_id = ? AND order_id = ? AND model_name = 'gemini'",
                Integer.class,
                tenantId,
                orderId
        );
        String status = jdbcTemplate.queryForObject(
                "SELECT normalization_status FROM ai_normalization_logs WHERE tenant_id = ? AND order_id = ? ORDER BY created_at DESC LIMIT 1",
                String.class,
                tenantId,
                orderId
        );

        assertThat(count).isEqualTo(1);
        assertThat(status).isEqualTo("FALLBACK");
    }

    @Test
    @DisplayName("should persist manual correction and keep tenant isolation")
    void shouldPersistManualCorrectionAndKeepTenantIsolation() throws Exception {
        UUID tenantA = insertTenant("J-AI-A");
        UUID tenantB = insertTenant("J-AI-B");
        UUID orderId = insertOrder(tenantA, "TRK-AICORR-20260312-0001", "CREATED");

        mockMvc.perform(post("/api/ai/address-normalizations/{orderId}", orderId)
                        .header("Authorization", bearer("DESPACHADOR", tenantA))
                        .contentType("application/json")
                        .content("""
                                {"rawAddress":"Sector Centro"}
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/ai/address-normalizations/{orderId}/manual-correction", orderId)
                        .header("Authorization", bearer("DESPACHADOR", tenantB))
                        .contentType("application/json")
                        .content("""
                                {
                                  "normalizedAddress":"Av. Libertador, Torre Norte",
                                  "normalizedState":"Distrito Capital",
                                  "normalizedMunicipio":"Libertador",
                                  "normalizedParroquia":"Catedral",
                                  "normalizedZona":"Centro",
                                  "normalizedReferencia":"Frente a la plaza",
                                  "normalizedLatitude":10.5048,
                                  "normalizedLongitude":-66.9208
                                }
                                """))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/ai/address-normalizations/{orderId}/manual-correction", orderId)
                        .header("Authorization", bearer("DESPACHADOR", tenantA))
                        .contentType("application/json")
                        .content("""
                                {
                                  "normalizedAddress":"Av. Libertador, Torre Norte",
                                  "normalizedState":"Distrito Capital",
                                  "normalizedMunicipio":"Libertador",
                                  "normalizedParroquia":"Catedral",
                                  "normalizedZona":"Centro",
                                  "normalizedReferencia":"Frente a la plaza",
                                  "normalizedLatitude":10.5048,
                                  "normalizedLongitude":-66.9208
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reviewStatus").value("REVIEW_APPROVED"))
                .andExpect(jsonPath("$.normalizationStatus").value("MANUAL_CORRECTED"))
                .andExpect(jsonPath("$.correctedManually").value(true));

        String reviewStatus = jdbcTemplate.queryForObject(
                "SELECT address_review_status FROM orders WHERE id = ?",
                String.class,
                orderId
        );
        String normalizationStatus = jdbcTemplate.queryForObject(
                "SELECT normalization_status FROM ai_normalization_logs WHERE order_id = ? ORDER BY created_at DESC LIMIT 1",
                String.class,
                orderId
        );
        Boolean corrected = jdbcTemplate.queryForObject(
                "SELECT corrected_manually FROM ai_normalization_logs WHERE order_id = ? ORDER BY created_at DESC LIMIT 1",
                Boolean.class,
                orderId
        );

        assertThat(reviewStatus).isEqualTo("REVIEW_APPROVED");
        assertThat(normalizationStatus).isEqualTo("MANUAL_CORRECTED");
        assertThat(corrected).isTrue();

        mockMvc.perform(get("/api/ai/address-normalizations/{orderId}/attempts/latest", orderId)
                        .header("Authorization", bearer("DESPACHADOR", tenantA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value(orderId.toString()))
                .andExpect(jsonPath("$.normalizationStatus").value("MANUAL_CORRECTED"));
    }

    @Test
    @DisplayName("should enforce 401 and 403 for route optimization preview endpoint")
    void shouldEnforce401And403ForRouteOptimizationPreviewEndpoint() throws Exception {
        UUID tenantId = insertTenant("J-AI-RP-AUTH");
        UUID vehicleId = insertVehicle(tenantId, "RTE-AI-001", "ACTIVE");
        UUID orderId = insertOrder(tenantId, "TRK-AIROUTEPREV-20260314-0001", "CREATED");

        mockMvc.perform(post("/api/ai/address-normalizations/routes/optimization/preview")
                        .contentType("application/json")
                        .content("""
                                {"vehicleId":"%s","orderIds":["%s"]}
                                """.formatted(vehicleId, orderId)))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/ai/address-normalizations/routes/optimization/preview")
                        .header("Authorization", bearer("CHOFER", tenantId))
                        .contentType("application/json")
                        .content("""
                                {"vehicleId":"%s","orderIds":["%s"]}
                                """.formatted(vehicleId, orderId)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("should enforce 401 and 403 for route optimization confirm endpoint")
    void shouldEnforce401And403ForRouteOptimizationConfirmEndpoint() throws Exception {
        UUID tenantId = insertTenant("J-AI-RC-AUTH");
        UUID vehicleId = insertVehicle(tenantId, "RTE-AI-002", "ACTIVE");
        UUID orderId = insertOrder(tenantId, "TRK-AIROUTECONF-20260314-0001", "CREATED");

        mockMvc.perform(post("/api/ai/address-normalizations/routes/optimization/confirm")
                        .contentType("application/json")
                        .content("""
                                {
                                  "vehicleId":"%s",
                                  "orderIds":["%s"],
                                  "optimizedOrderIds":["%s"],
                                  "previewSignature":"abc",
                                  "optimizedByAi":false,
                                  "estimatedDistanceKm":0.0
                                }
                                """.formatted(vehicleId, orderId, orderId)))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/ai/address-normalizations/routes/optimization/confirm")
                        .header("Authorization", bearer("CHOFER", tenantId))
                        .contentType("application/json")
                        .content("""
                                {
                                  "vehicleId":"%s",
                                  "orderIds":["%s"],
                                  "optimizedOrderIds":["%s"],
                                  "previewSignature":"abc",
                                  "optimizedByAi":false,
                                  "estimatedDistanceKm":0.0
                                }
                                """.formatted(vehicleId, orderId, orderId)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("should preview and confirm optimized route for dispatcher")
    void shouldPreviewAndConfirmOptimizedRouteForDispatcher() throws Exception {
        UUID tenantId = insertTenant("J-AI-ROUTE-FLOW");
        UUID dispatcherId = UUID.randomUUID();
        UUID vehicleId = insertVehicle(tenantId, "RTE-AI-003", "ACTIVE");
        UUID orderA = insertOrderWithCoordinates(tenantId, "TRK-AIROUTE-20260314-0001", "CREATED", 10.5000, -66.9000);
        UUID orderB = insertOrderWithCoordinates(tenantId, "TRK-AIROUTE-20260314-0002", "CREATED", 10.5400, -66.9400);
        UUID orderC = insertOrderWithCoordinates(tenantId, "TRK-AIROUTE-20260314-0003", "CREATED", 10.5200, -66.9100);

        String previewBody = """
                {
                  "vehicleId":"%s",
                  "driverId":"%s",
                  "orderIds":["%s","%s","%s"]
                }
                """.formatted(vehicleId, dispatcherId, orderA, orderB, orderC);

        String previewResponse = mockMvc.perform(post("/api/ai/address-normalizations/routes/optimization/preview")
                        .header("Authorization", bearerWithUserId("DESPACHADOR", tenantId, dispatcherId))
                        .contentType("application/json")
                        .content(previewBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.optimizedByAi").value(true))
                .andExpect(jsonPath("$.optimizedOrderIds").isArray())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode previewJson = objectMapper.readTree(previewResponse);
        String signature = previewJson.get("previewSignature").asText();
        String optimizedOrderA = previewJson.get("optimizedOrderIds").get(0).asText();
        String optimizedOrderB = previewJson.get("optimizedOrderIds").get(1).asText();
        String optimizedOrderC = previewJson.get("optimizedOrderIds").get(2).asText();
        double estimatedDistanceKm = previewJson.get("estimatedDistanceKm").asDouble();

        String confirmBody = """
                {
                  "vehicleId":"%s",
                  "driverId":"%s",
                  "orderIds":["%s","%s","%s"],
                  "optimizedOrderIds":["%s","%s","%s"],
                  "previewSignature":"%s",
                  "optimizedByAi":true,
                  "estimatedDistanceKm":%s
                }
                """.formatted(
                vehicleId,
                dispatcherId,
                orderA,
                orderB,
                orderC,
                optimizedOrderA,
                optimizedOrderB,
                optimizedOrderC,
                signature,
                estimatedDistanceKm
        );

        mockMvc.perform(post("/api/ai/address-normalizations/routes/optimization/confirm")
                        .header("Authorization", bearerWithUserId("DESPACHADOR", tenantId, dispatcherId))
                        .contentType("application/json")
                        .content(confirmBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.route.status").value("ASSIGNED"))
                .andExpect(jsonPath("$.route.optimizedByAi").value(true));

        Integer routeCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM routes WHERE tenant_id = ? AND optimized_by_ai = true",
                Integer.class,
                tenantId
        );
        Integer assignedCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM orders WHERE tenant_id = ? AND status = 'ASSIGNED'",
                Integer.class,
                tenantId
        );

        assertThat(routeCount).isEqualTo(1);
        assertThat(assignedCount).isEqualTo(3);
    }

    @Test
    @DisplayName("should fallback preview for more than 50 stops")
    void shouldFallbackPreviewForMoreThan50Stops() throws Exception {
        UUID tenantId = insertTenant("J-AI-ROUTE-LIMIT");
        UUID vehicleId = insertVehicle(tenantId, "RTE-AI-004", "ACTIVE");

        StringBuilder idsBuilder = new StringBuilder();
        for (int i = 0; i < 51; i++) {
            UUID orderId = insertOrder(tenantId, "TRK-AILIMIT-20260314-" + String.format("%04d", i), "CREATED");
            if (i > 0) {
                idsBuilder.append(',');
            }
            idsBuilder.append('"').append(orderId).append('"');
        }

        mockMvc.perform(post("/api/ai/address-normalizations/routes/optimization/preview")
                        .header("Authorization", bearer("DESPACHADOR", tenantId))
                        .contentType("application/json")
                        .content("""
                                {
                                  "vehicleId":"%s",
                                  "orderIds":[%s]
                                }
                                """.formatted(vehicleId, idsBuilder)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.optimizedByAi").value(false))
                .andExpect(jsonPath("$.fallbackReason").value("Route optimization is available for up to 50 stops; using original order"));
    }

    private String bearer(String role, UUID tenantId) {
        String token = jwtService.generateAccessToken(UUID.randomUUID(), role.toLowerCase() + "@test.com", role, tenantId);
        return "Bearer " + token;
    }

    private UUID insertTenant(String suffix) {
        return jdbcTemplate.queryForObject(
                """
                INSERT INTO tenants(nombre, rif, status, created_at, updated_at)
                VALUES (?, ?, 'TRIAL', now(), now())
                RETURNING id
                """,
                UUID.class,
                "Tenant " + suffix,
                suffix
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

    private UUID insertOrderWithCoordinates(UUID tenantId,
                                            String trackingCode,
                                            String status,
                                            double latitude,
                                            double longitude) {
        return jdbcTemplate.queryForObject(
                """
                INSERT INTO orders(tenant_id, tracking_code, status, normalized_address, normalized_latitude, normalized_longitude, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, now(), now())
                RETURNING id
                """,
                UUID.class,
                tenantId,
                trackingCode,
                status,
                "Addr " + trackingCode,
                latitude,
                longitude
        );
    }

    private UUID insertVehicle(UUID tenantId, String plate, String state) {
        return jdbcTemplate.queryForObject(
                """
                INSERT INTO vehicles(tenant_id, plate, state, created_at, updated_at)
                VALUES (?, ?, ?, now(), now())
                RETURNING id
                """,
                UUID.class,
                tenantId,
                plate,
                state
        );
    }

    private String bearerWithUserId(String role, UUID tenantId, UUID userId) {
        String token = jwtService.generateAccessToken(userId, role.toLowerCase() + "@test.com", role, tenantId);
        return "Bearer " + token;
    }
}
