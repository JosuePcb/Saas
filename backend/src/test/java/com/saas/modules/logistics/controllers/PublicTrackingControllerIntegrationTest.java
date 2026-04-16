package com.saas.modules.logistics.controllers;

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

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@DisplayName("Public tracking integration tests")
class PublicTrackingControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("saas_test_public_tracking")
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
        jdbcTemplate.update("DELETE FROM order_status_history");
        jdbcTemplate.update("DELETE FROM route_stops");
        jdbcTemplate.update("DELETE FROM routes");
        jdbcTemplate.update("DELETE FROM orders");
        jdbcTemplate.update("DELETE FROM vehicles");
        jdbcTemplate.update("DELETE FROM users WHERE email LIKE '%@t.com'");
        jdbcTemplate.update("DELETE FROM tenants WHERE rif LIKE 'J-LGT-%'");
    }

    @Test
    @DisplayName("should allow anonymous public tracking lookup")
    void shouldAllowAnonymousPublicTrackingLookup() throws Exception {
        UUID tenantId = insertTenant("J-LGT-A");
        UUID driverId = insertDriver(tenantId, "driver-a@t.com", "Carlos", "Perez");
        UUID vehicleId = insertVehicle(tenantId, "AA-TRK-1");
        UUID orderId = insertOrder(tenantId, "TRK-PUBLICA-20260312-0001", "IN_TRANSIT");
        UUID routeId = insertRoute(tenantId, vehicleId, driverId, "IN_PROGRESS");
        insertRouteStop(routeId, orderId, 1);
        insertHistory(orderId, tenantId, "CREATED");
        insertHistory(orderId, tenantId, "ASSIGNED");
        insertHistory(orderId, tenantId, "IN_TRANSIT");

        mockMvc.perform(get("/api/tracking/{trackingCode}", "TRK-PUBLICA-20260312-0001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trackingCode").value("TRK-PUBLICA-20260312-0001"))
                .andExpect(jsonPath("$.currentStatus").value("IN_TRANSIT"))
                .andExpect(jsonPath("$.driverFirstName").value("Carlos"))
                .andExpect(jsonPath("$.eta", nullValue()))
                .andExpect(jsonPath("$.history", hasSize(3)));
    }

    @Test
    @DisplayName("should include nullable enrichment fields in tracking response")
    void shouldIncludeNullableEnrichmentFieldsInTrackingResponse() throws Exception {
        UUID tenantId = insertTenant("J-LGT-B");
        UUID orderId = insertOrder(tenantId, "TRK-PUBLICD-20260312-0001", "CREATED");
        insertHistory(orderId, tenantId, "CREATED");

        mockMvc.perform(get("/api/tracking/{trackingCode}", "TRK-PUBLICD-20260312-0001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trackingCode").value("TRK-PUBLICD-20260312-0001"))
                .andExpect(jsonPath("$.driverFirstName", nullValue()))
                .andExpect(jsonPath("$.eta", nullValue()))
                .andExpect(jsonPath("$.history", hasSize(1)));
    }

    @Test
    @DisplayName("should not require auth for public tracking endpoint")
    void shouldNotRequireAuthForPublicTrackingEndpoint() throws Exception {
        UUID tenantId = insertTenant("J-LGT-A");
        UUID orderId = insertOrder(tenantId, "TRK-PUBLICB-20260312-0001", "CREATED");
        insertHistory(orderId, tenantId, "CREATED");

        mockMvc.perform(get("/api/tracking/{trackingCode}", "TRK-PUBLICB-20260312-0001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trackingCode").value("TRK-PUBLICB-20260312-0001"));
    }

    @Test
    @DisplayName("should allow anonymous lookup in canonical tracking endpoint")
    void shouldAllowAnonymousLookupInCanonicalTrackingEndpoint() throws Exception {
        UUID tenantId = insertTenant("J-LGT-CAN");
        UUID orderId = insertOrder(tenantId, "TRK-CANON-20260312-0001", "CREATED");
        insertHistory(orderId, tenantId, "CREATED");

        mockMvc.perform(get("/api/public/tracking/{trackingCode}", "TRK-CANON-20260312-0001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trackingCode").value("TRK-CANON-20260312-0001"))
                .andExpect(jsonPath("$.currentStatus").value("CREATED"));
    }

    @Test
    @DisplayName("should return 404 for unknown tracking code")
    void shouldReturn404ForUnknownTrackingCode() throws Exception {
        mockMvc.perform(get("/api/tracking/{trackingCode}", "TRK-UNKNOWN-20260312-9999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"));
    }

    @Test
    @DisplayName("should keep logistics order endpoint protected with 401 without token")
    void shouldKeepLogisticsOrderEndpointProtectedWith401WithoutToken() throws Exception {
        mockMvc.perform(get("/api/logistics/orders/{id}/history", UUID.randomUUID()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Authentication required"));
    }

    @Test
    @DisplayName("should return 403 for chofer in protected logistics endpoint")
    void shouldReturn403ForChoferInProtectedLogisticsEndpoint() throws Exception {
        UUID tenantId = insertTenant("J-LGT-A");
        UUID orderId = insertOrder(tenantId, "TRK-PUBLICC-20260312-0001", "CREATED");
        insertHistory(orderId, tenantId, "CREATED");

        mockMvc.perform(get("/api/logistics/orders/{id}/history", orderId)
                        .header("Authorization", bearer("CHOFER", tenantId)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"))
                .andExpect(jsonPath("$.message").value("Insufficient permissions"));
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

    private UUID insertVehicle(UUID tenantId, String plate) {
        return jdbcTemplate.queryForObject(
                """
                INSERT INTO vehicles(tenant_id, plate, state, created_at, updated_at)
                VALUES (?, ?, 'ACTIVE', now(), now())
                RETURNING id
                """,
                UUID.class,
                tenantId,
                plate
        );
    }

    private UUID insertDriver(UUID tenantId, String email, String nombre, String apellido) {
        return jdbcTemplate.queryForObject(
                """
                INSERT INTO users(tenant_id, email, password_hash, nombre, apellido, telefono, role, activo, created_at, updated_at)
                VALUES (?, ?, 'hash', ?, ?, null, 'CHOFER', true, now(), now())
                RETURNING id
                """,
                UUID.class,
                tenantId,
                email,
                nombre,
                apellido
        );
    }

    private UUID insertRoute(UUID tenantId, UUID vehicleId, UUID driverId, String status) {
        return jdbcTemplate.queryForObject(
                """
                INSERT INTO routes(tenant_id, vehicle_id, driver_id, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, now(), now())
                RETURNING id
                """,
                UUID.class,
                tenantId,
                vehicleId,
                driverId,
                status
        );
    }

    private void insertRouteStop(UUID routeId, UUID orderId, int stopOrder) {
        jdbcTemplate.update(
                """
                INSERT INTO route_stops(route_id, order_id, stop_order, created_at)
                VALUES (?, ?, ?, now())
                """,
                routeId,
                orderId,
                stopOrder
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
