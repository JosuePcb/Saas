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

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@DisplayName("OrderController integration tests")
class OrderControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("saas_test_logistics_order_controller")
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
        jdbcTemplate.update("DELETE FROM ai_normalization_logs");
        jdbcTemplate.update("DELETE FROM orders");
        jdbcTemplate.update("DELETE FROM vehicles");
        jdbcTemplate.update("DELETE FROM tenants WHERE rif LIKE 'J-LGO-%'");
    }

    @Test
    @DisplayName("should create order with tracking code and CREATED status")
    void shouldCreateOrderWithTrackingCodeAndCreatedStatus() throws Exception {
        UUID tenantId = insertTenant("J-LGO-A");

        mockMvc.perform(post("/api/logistics/orders")
                        .header("Authorization", bearer("DESPACHADOR", tenantId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.trackingCode").value(org.hamcrest.Matchers.startsWith("TRK-")))
                .andExpect(jsonPath("$.status").value("CREATED"));

        Integer orderCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM orders WHERE tenant_id = ?",
                Integer.class,
                tenantId
        );
        Integer historyCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM order_status_history WHERE tenant_id = ? AND status = 'CREATED'",
                Integer.class,
                tenantId
        );

        assertThat(orderCount).isEqualTo(1);
        assertThat(historyCount).isEqualTo(1);
    }

    @Test
    @DisplayName("should progress valid lifecycle and keep immutable history")
    void shouldProgressValidLifecycleAndKeepImmutableHistory() throws Exception {
        UUID tenantId = insertTenant("J-LGO-A");
        UUID orderId = insertOrder(tenantId, "TRK-AAAA1111-20260312-0001", "CREATED");
        insertHistory(orderId, tenantId, "CREATED");

        mockMvc.perform(patch("/api/logistics/orders/{id}/status", orderId)
                        .header("Authorization", bearer("DESPACHADOR", tenantId))
                        .contentType("application/json")
                        .content("""
                                {"status":"ASSIGNED"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ASSIGNED"));

        mockMvc.perform(get("/api/logistics/orders/{id}/history", orderId)
                        .header("Authorization", bearer("DESPACHADOR", tenantId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].status").value("CREATED"))
                .andExpect(jsonPath("$[1].status").value("ASSIGNED"));
    }

    @Test
    @DisplayName("should reject invalid lifecycle transition with 409")
    void shouldRejectInvalidLifecycleTransitionWith409() throws Exception {
        UUID tenantId = insertTenant("J-LGO-A");
        UUID orderId = insertOrder(tenantId, "TRK-AAAA1111-20260312-0001", "CREATED");
        insertHistory(orderId, tenantId, "CREATED");

        mockMvc.perform(patch("/api/logistics/orders/{id}/status", orderId)
                        .header("Authorization", bearer("DESPACHADOR", tenantId))
                        .contentType("application/json")
                        .content("""
                                {"status":"DELIVERED"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Invalid order status transition"));
    }

    @Test
    @DisplayName("should normalize order address and return structured normalization contract")
    void shouldNormalizeOrderAddressAndReturnStructuredNormalizationContract() throws Exception {
        UUID tenantId = insertTenant("J-LGO-A");
        UUID orderId = insertOrder(tenantId, "TRK-AAAA1111-20260312-0001", "CREATED");

        mockMvc.perform(post("/api/logistics/orders/{id}/normalize-address", orderId)
                        .header("Authorization", bearer("DESPACHADOR", tenantId))
                        .contentType("application/json")
                        .content("""
                                {"rawAddress":"Av. Principal 123, Caracas"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.normalizedAddress").isString())
                .andExpect(jsonPath("$.normalizedAddress").value(not("")))
                .andExpect(jsonPath("$.confidence").isNumber())
                .andExpect(jsonPath("$.fallbackUsed").isBoolean())
                .andExpect(jsonPath("$.reviewStatus").isString());
    }

    @Test
    @DisplayName("should reject malformed normalize request with standardized validation errors")
    void shouldRejectMalformedNormalizeRequestWithStandardizedValidationErrors() throws Exception {
        UUID tenantId = insertTenant("J-LGO-A");
        UUID orderId = insertOrder(tenantId, "TRK-AAAA1111-20260312-0001", "CREATED");

        mockMvc.perform(post("/api/logistics/orders/{id}/normalize-address", orderId)
                        .header("Authorization", bearer("DESPACHADOR", tenantId))
                        .contentType("application/json")
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.fieldErrors", hasSize(1)))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("rawAddress"));
    }

    @Test
    @DisplayName("should reject chofer role on normalize address endpoint")
    void shouldRejectChoferRoleOnNormalizeAddressEndpoint() throws Exception {
        UUID tenantId = insertTenant("J-LGO-A");
        UUID orderId = insertOrder(tenantId, "TRK-AAAA1111-20260312-0001", "CREATED");

        mockMvc.perform(post("/api/logistics/orders/{id}/normalize-address", orderId)
                        .header("Authorization", bearer("CHOFER", tenantId))
                        .contentType("application/json")
                        .content("""
                                {"rawAddress":"Av. Principal 123, Caracas"}
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("should enforce tenant isolation on normalize address endpoint")
    void shouldEnforceTenantIsolationOnNormalizeAddressEndpoint() throws Exception {
        UUID tenantA = insertTenant("J-LGO-A");
        UUID tenantB = insertTenant("J-LGO-B");
        UUID orderId = insertOrder(tenantA, "TRK-AAAA1111-20260312-0001", "CREATED");

        mockMvc.perform(post("/api/logistics/orders/{id}/normalize-address", orderId)
                        .header("Authorization", bearer("DESPACHADOR", tenantB))
                        .contentType("application/json")
                        .content("""
                                {"rawAddress":"Av. Principal 123, Caracas"}
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("should enforce tenant isolation on order history")
    void shouldEnforceTenantIsolationOnOrderHistory() throws Exception {
        UUID tenantA = insertTenant("J-LGO-A");
        UUID tenantB = insertTenant("J-LGO-B");
        UUID orderId = insertOrder(tenantA, "TRK-AAAA1111-20260312-0001", "CREATED");
        insertHistory(orderId, tenantA, "CREATED");

        mockMvc.perform(get("/api/logistics/orders/{id}/history", orderId)
                        .header("Authorization", bearer("DESPACHADOR", tenantB)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("should reject chofer role on order management endpoints")
    void shouldRejectChoferRoleOnOrderManagementEndpoints() throws Exception {
        UUID tenantId = insertTenant("J-LGO-A");

        mockMvc.perform(post("/api/logistics/orders")
                        .header("Authorization", bearer("CHOFER", tenantId)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("should return dispatcher tracking view scoped to authenticated tenant")
    void shouldReturnDispatcherTrackingViewScopedToAuthenticatedTenant() throws Exception {
        UUID tenantA = insertTenant("J-LGO-A");
        UUID tenantB = insertTenant("J-LGO-B");

        UUID orderA = insertOrder(tenantA, "TRK-AAAA1111-20260312-0001", "IN_TRANSIT");
        UUID orderB = insertOrder(tenantB, "TRK-BBBB2222-20260312-0001", "ASSIGNED");
        insertHistory(orderA, tenantA, "CREATED");
        insertHistory(orderA, tenantA, "ASSIGNED");
        insertHistory(orderA, tenantA, "IN_TRANSIT");
        insertHistory(orderB, tenantB, "CREATED");
        insertHistory(orderB, tenantB, "ASSIGNED");

        UUID vehicleA = insertVehicle(tenantA, "AA-001");
        UUID routeA = insertRoute(tenantA, vehicleA, "IN_PROGRESS");
        insertRouteStop(routeA, orderA, 1);

        mockMvc.perform(get("/api/logistics/orders/dispatcher-tracking")
                        .header("Authorization", bearer("DESPACHADOR", tenantA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orders", hasSize(1)))
                .andExpect(jsonPath("$.orders[0].orderId").value(orderA.toString()))
                .andExpect(jsonPath("$.orders[0].trackingCode").value("TRK-AAAA1111-20260312-0001"))
                .andExpect(jsonPath("$.orders[0].status").value("IN_TRANSIT"))
                .andExpect(jsonPath("$.orders[0].routeId").value(routeA.toString()))
                .andExpect(jsonPath("$.orders[0].lastStatusTimestamp").exists())
                .andExpect(jsonPath("$.orders[0].orderId", not(orderB.toString())));
    }

    @Test
    @DisplayName("should reject dispatcher tracking endpoint without token")
    void shouldRejectDispatcherTrackingEndpointWithoutToken() throws Exception {
        mockMvc.perform(get("/api/logistics/orders/dispatcher-tracking"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Authentication required"));
    }

    @Test
    @DisplayName("should reject chofer role for dispatcher tracking endpoint")
    void shouldRejectChoferRoleForDispatcherTrackingEndpoint() throws Exception {
        UUID tenantId = insertTenant("J-LGO-A");

        mockMvc.perform(get("/api/logistics/orders/dispatcher-tracking")
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

    private UUID insertRoute(UUID tenantId, UUID vehicleId, String status) {
        return jdbcTemplate.queryForObject(
                """
                INSERT INTO routes(tenant_id, vehicle_id, status, created_at, updated_at)
                VALUES (?, ?, ?, now(), now())
                RETURNING id
                """,
                UUID.class,
                tenantId,
                vehicleId,
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
