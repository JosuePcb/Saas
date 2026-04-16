package com.saas.modules.logistics.controllers;

import com.saas.core.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MvcResult;
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
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@DisplayName("RouteController integration tests")
class RouteControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("saas_test_logistics_route_controller")
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
        jdbcTemplate.update("DELETE FROM tenants WHERE rif LIKE 'J-LGR-%'");
    }

    @Test
    @DisplayName("should create route and assign orders")
    void shouldCreateRouteAndAssignOrders() throws Exception {
        UUID tenantId = insertTenant("J-LGR-A");
        UUID vehicleId = insertVehicle(tenantId, "RTE001", "ACTIVE");
        UUID orderA = insertOrder(tenantId, "TRK-AAAA1111-20260312-0101", "CREATED");
        UUID orderB = insertOrder(tenantId, "TRK-AAAA1111-20260312-0102", "CREATED");
        insertHistory(orderA, tenantId, "CREATED");
        insertHistory(orderB, tenantId, "CREATED");

        mockMvc.perform(post("/api/logistics/routes")
                        .header("Authorization", bearer("DESPACHADOR", tenantId))
                        .contentType("application/json")
                        .content("""
                                {"vehicleId":"%s","orderIds":["%s","%s"]}
                                """.formatted(vehicleId, orderA, orderB)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ASSIGNED"))
                .andExpect(jsonPath("$.orderIds", hasSize(2)));
    }

    @Test
    @DisplayName("should reject route create when order already assigned")
    void shouldRejectRouteCreateWhenOrderAlreadyAssigned() throws Exception {
        UUID tenantId = insertTenant("J-LGR-A");
        UUID vehicleId = insertVehicle(tenantId, "RTE001", "ACTIVE");
        UUID orderId = insertOrder(tenantId, "TRK-AAAA1111-20260312-0101", "ASSIGNED");
        insertHistory(orderId, tenantId, "CREATED");
        insertHistory(orderId, tenantId, "ASSIGNED");

        mockMvc.perform(post("/api/logistics/routes")
                        .header("Authorization", bearer("DESPACHADOR", tenantId))
                        .contentType("application/json")
                        .content("""
                                {"vehicleId":"%s","orderIds":["%s"]}
                                """.formatted(vehicleId, orderId)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Only CREATED orders can be assigned to a route"));
    }

    @Test
    @DisplayName("should start and complete route with execution status updates")
    void shouldStartAndCompleteRouteWithExecutionStatusUpdates() throws Exception {
        UUID tenantId = insertTenant("J-LGR-A");
        UUID dispatcherId = UUID.randomUUID();
        UUID vehicleId = insertVehicle(tenantId, "RTE001", "ACTIVE");
        UUID orderId = insertOrder(tenantId, "TRK-AAAA1111-20260312-0101", "CREATED");
        insertHistory(orderId, tenantId, "CREATED");

        MvcResult createResult = mockMvc.perform(post("/api/logistics/routes")
                        .header("Authorization", bearerWithUserId("DESPACHADOR", tenantId, dispatcherId))
                        .contentType("application/json")
                        .content("""
                                {"vehicleId":"%s","orderIds":["%s"]}
                                """.formatted(vehicleId, orderId)))
                .andExpect(status().isCreated())
                .andReturn();

        String routeId = createResult.getResponse().getContentAsString().replaceAll(".*\"id\":\"([^\"]+)\".*", "$1");

        mockMvc.perform(post("/api/logistics/routes/{id}/start", routeId)
                        .header("Authorization", bearerWithUserId("DESPACHADOR", tenantId, dispatcherId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        mockMvc.perform(post("/api/logistics/routes/{id}/complete", routeId)
                        .header("Authorization", bearerWithUserId("DESPACHADOR", tenantId, dispatcherId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        String orderStatus = jdbcTemplate.queryForObject("SELECT status FROM orders WHERE id = ?", String.class, orderId);
        String routeStatus = jdbcTemplate.queryForObject("SELECT status FROM routes WHERE id = ?", String.class, UUID.fromString(routeId));
        Integer deliveredHistory = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM order_status_history WHERE order_id = ? AND status = 'DELIVERED'",
                Integer.class,
                orderId
        );
        UUID inTransitChangedBy = jdbcTemplate.queryForObject(
                "SELECT changed_by FROM order_status_history WHERE order_id = ? AND status = 'IN_TRANSIT' ORDER BY changed_at DESC LIMIT 1",
                UUID.class,
                orderId
        );
        UUID deliveredChangedBy = jdbcTemplate.queryForObject(
                "SELECT changed_by FROM order_status_history WHERE order_id = ? AND status = 'DELIVERED' ORDER BY changed_at DESC LIMIT 1",
                UUID.class,
                orderId
        );

        assertThat(orderStatus).isEqualTo("DELIVERED");
        assertThat(routeStatus).isEqualTo("COMPLETED");
        assertThat(deliveredHistory).isEqualTo(1);
        assertThat(inTransitChangedBy).isEqualTo(dispatcherId);
        assertThat(deliveredChangedBy).isEqualTo(dispatcherId);
    }

    @Test
    @DisplayName("should reject chofer role on route management endpoints")
    void shouldRejectChoferRoleOnRouteManagementEndpoints() throws Exception {
        UUID tenantId = insertTenant("J-LGR-A");
        UUID vehicleId = insertVehicle(tenantId, "RTE001", "ACTIVE");
        UUID orderId = insertOrder(tenantId, "TRK-AAAA1111-20260312-0101", "CREATED");

        mockMvc.perform(post("/api/logistics/routes")
                        .header("Authorization", bearer("CHOFER", tenantId))
                        .contentType("application/json")
                        .content("""
                                {"vehicleId":"%s","orderIds":["%s"]}
                                """.formatted(vehicleId, orderId)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("should return assigned route payload for authenticated chofer")
    void shouldReturnAssignedRoutePayloadForAuthenticatedChofer() throws Exception {
        UUID tenantId = insertTenant("J-LGR-A");
        UUID driverId = UUID.randomUUID();
        UUID vehicleId = insertVehicle(tenantId, "RTE001", "ACTIVE");
        UUID orderId = insertOrder(tenantId, "TRK-CHOFER-20260312-0001", "ASSIGNED");
        UUID routeId = insertRoute(tenantId, vehicleId, driverId, "ASSIGNED");
        insertRouteStop(routeId, orderId, 1);

        mockMvc.perform(get("/api/logistics/routes/assigned")
                        .header("Authorization", bearerWithUserId("CHOFER", tenantId, driverId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].routeId").value(routeId.toString()))
                .andExpect(jsonPath("$[0].status").value("ASSIGNED"))
                .andExpect(jsonPath("$[0].stops", hasSize(1)))
                .andExpect(jsonPath("$[0].stops[0].trackingCode").value("TRK-CHOFER-20260312-0001"));
    }

    @Test
    @DisplayName("should include nullable eta in assigned route stop payload")
    void shouldIncludeNullableEtaInAssignedRouteStopPayload() throws Exception {
        UUID tenantId = insertTenant("J-LGR-A");
        UUID driverId = UUID.randomUUID();
        UUID vehicleId = insertVehicle(tenantId, "RTE001", "ACTIVE");
        UUID orderId = insertOrder(tenantId, "TRK-CHOFER-20260312-0001", "ASSIGNED");
        UUID routeId = insertRoute(tenantId, vehicleId, driverId, "ASSIGNED");
        insertRouteStop(routeId, orderId, 1);

        mockMvc.perform(get("/api/logistics/routes/assigned")
                        .header("Authorization", bearerWithUserId("CHOFER", tenantId, driverId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].stops[0].eta", nullValue()));
    }

    @Test
    @DisplayName("should reject non chofer role on driver endpoints")
    void shouldRejectNonChoferRoleOnDriverEndpoints() throws Exception {
        UUID tenantId = insertTenant("J-LGR-A");

        mockMvc.perform(get("/api/logistics/routes/assigned")
                        .header("Authorization", bearer("DESPACHADOR", tenantId)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("should allow chofer to progress route ASSIGNED to IN_PROGRESS to COMPLETED")
    void shouldAllowChoferToProgressRouteAssignedToInProgressToCompleted() throws Exception {
        UUID tenantId = insertTenant("J-LGR-A");
        UUID driverId = UUID.randomUUID();
        UUID vehicleId = insertVehicle(tenantId, "RTE001", "ACTIVE");
        UUID orderId = insertOrder(tenantId, "TRK-CHOFER-20260312-0001", "ASSIGNED");
        UUID routeId = insertRoute(tenantId, vehicleId, driverId, "ASSIGNED");
        insertRouteStop(routeId, orderId, 1);

        mockMvc.perform(post("/api/logistics/routes/{id}/driver-start", routeId)
                        .header("Authorization", bearerWithUserId("CHOFER", tenantId, driverId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        mockMvc.perform(post("/api/logistics/routes/{id}/driver-complete", routeId)
                        .header("Authorization", bearerWithUserId("CHOFER", tenantId, driverId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        String routeStatus = jdbcTemplate.queryForObject("SELECT status FROM routes WHERE id = ?", String.class, routeId);
        String orderStatus = jdbcTemplate.queryForObject("SELECT status FROM orders WHERE id = ?", String.class, orderId);
        UUID inTransitChangedBy = jdbcTemplate.queryForObject(
                "SELECT changed_by FROM order_status_history WHERE order_id = ? AND status = 'IN_TRANSIT' ORDER BY changed_at DESC LIMIT 1",
                UUID.class,
                orderId
        );
        UUID deliveredChangedBy = jdbcTemplate.queryForObject(
                "SELECT changed_by FROM order_status_history WHERE order_id = ? AND status = 'DELIVERED' ORDER BY changed_at DESC LIMIT 1",
                UUID.class,
                orderId
        );

        assertThat(routeStatus).isEqualTo("COMPLETED");
        assertThat(orderStatus).isEqualTo("DELIVERED");
        assertThat(inTransitChangedBy).isEqualTo(driverId);
        assertThat(deliveredChangedBy).isEqualTo(driverId);
    }

    @Test
    @DisplayName("should return 404 when chofer tries to progress route from another tenant")
    void shouldReturn404WhenChoferTriesToProgressRouteFromAnotherTenant() throws Exception {
        UUID tenantA = insertTenant("J-LGR-A");
        UUID tenantB = insertTenant("J-LGR-B");
        UUID driverA = UUID.randomUUID();
        UUID vehicleId = insertVehicle(tenantA, "RTE001", "ACTIVE");
        UUID routeId = insertRoute(tenantA, vehicleId, driverA, "ASSIGNED");

        mockMvc.perform(post("/api/logistics/routes/{id}/driver-start", routeId)
                        .header("Authorization", bearerWithUserId("CHOFER", tenantB, driverA)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("should return 409 when chofer tries invalid route progression")
    void shouldReturn409WhenChoferTriesInvalidRouteProgression() throws Exception {
        UUID tenantId = insertTenant("J-LGR-A");
        UUID driverId = UUID.randomUUID();
        UUID vehicleId = insertVehicle(tenantId, "RTE001", "ACTIVE");
        UUID orderId = insertOrder(tenantId, "TRK-CHOFER-20260312-0001", "ASSIGNED");
        UUID routeId = insertRoute(tenantId, vehicleId, driverId, "ASSIGNED");
        insertRouteStop(routeId, orderId, 1);

        mockMvc.perform(post("/api/logistics/routes/{id}/driver-complete", routeId)
                        .header("Authorization", bearerWithUserId("CHOFER", tenantId, driverId)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Route must be IN_PROGRESS before completion"));
    }

    @Test
    @DisplayName("should return offline route packet for authenticated chofer")
    void shouldReturnOfflineRoutePacketForAuthenticatedChofer() throws Exception {
        UUID tenantId = insertTenant("J-LGR-A");
        UUID driverId = UUID.randomUUID();
        UUID vehicleId = insertVehicle(tenantId, "RTE001", "ACTIVE");
        UUID orderId = insertOrderWithNormalization(tenantId, "TRK-OFFLINE-20260313-0001", "ASSIGNED", "Av. Principal 123", 0.95, false);
        UUID routeId = insertRoute(tenantId, vehicleId, driverId, "ASSIGNED");
        insertRouteStop(routeId, orderId, 1);

        mockMvc.perform(get("/api/logistics/routes/{id}/offline-packet", routeId)
                        .header("Authorization", bearerWithUserId("CHOFER", tenantId, driverId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.routeId").value(routeId.toString()))
                .andExpect(jsonPath("$.status").value("ASSIGNED"))
                .andExpect(jsonPath("$.stops", hasSize(1)))
                .andExpect(jsonPath("$.stops[0].trackingCode").value("TRK-OFFLINE-20260313-0001"))
                .andExpect(jsonPath("$.stops[0].normalizedAddress").value("Av. Principal 123"))
                .andExpect(jsonPath("$.stops[0].normalizationConfidence").value(0.95))
                .andExpect(jsonPath("$.stops[0].normalizationFallbackUsed").value(false));
    }

    @Test
    @DisplayName("should reject non chofer role on offline packet endpoint")
    void shouldRejectNonChoferRoleOnOfflinePacketEndpoint() throws Exception {
        UUID tenantId = insertTenant("J-LGR-A");
        UUID routeId = UUID.randomUUID();

        mockMvc.perform(get("/api/logistics/routes/{id}/offline-packet", routeId)
                        .header("Authorization", bearer("DESPACHADOR", tenantId)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("should return 404 for offline packet outside tenant scope")
    void shouldReturn404ForOfflinePacketOutsideTenantScope() throws Exception {
        UUID tenantA = insertTenant("J-LGR-A");
        UUID tenantB = insertTenant("J-LGR-B");
        UUID driverA = UUID.randomUUID();
        UUID vehicleId = insertVehicle(tenantA, "RTE001", "ACTIVE");
        UUID routeId = insertRoute(tenantA, vehicleId, driverA, "ASSIGNED");

        mockMvc.perform(get("/api/logistics/routes/{id}/offline-packet", routeId)
                        .header("Authorization", bearerWithUserId("CHOFER", tenantB, driverA)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("should upload route sync events for authenticated chofer")
    void shouldUploadRouteSyncEventsForAuthenticatedChofer() throws Exception {
        UUID tenantId = insertTenant("J-LGR-A");
        UUID driverId = UUID.randomUUID();
        UUID vehicleId = insertVehicle(tenantId, "RTE001", "ACTIVE");
        UUID orderId = insertOrder(tenantId, "TRK-SYNC-20260313-0001", "ASSIGNED");
        UUID routeId = insertRoute(tenantId, vehicleId, driverId, "ASSIGNED");
        insertRouteStop(routeId, orderId, 1);

        mockMvc.perform(post("/api/logistics/routes/{id}/sync", routeId)
                        .header("Authorization", bearerWithUserId("CHOFER", tenantId, driverId))
                        .contentType("application/json")
                        .content("""
                                {
                                  "deviceId":"%s",
                                  "events":[
                                    {
                                      "clientEventId":"evt-001",
                                      "eventType":"STATUS_CHANGE",
                                      "orderId":"%s",
                                      "targetStatus":"IN_TRANSIT",
                                      "eventOccurredAt":"2026-03-13T10:10:10"
                                    }
                                  ]
                                }
                                """.formatted(UUID.randomUUID(), orderId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.processedEvents").value(1))
                .andExpect(jsonPath("$.acceptedEvents").value(1))
                .andExpect(jsonPath("$.duplicateEvents").value(0))
                .andExpect(jsonPath("$.conflictEvents").value(0));

        String orderStatus = jdbcTemplate.queryForObject("SELECT status FROM orders WHERE id = ?", String.class, orderId);
        assertThat(orderStatus).isEqualTo("IN_TRANSIT");
    }

    @Test
    @DisplayName("should reject malformed route sync status-change payload with standardized validation errors")
    void shouldRejectMalformedRouteSyncStatusChangePayloadWithStandardizedValidationErrors() throws Exception {
        UUID tenantId = insertTenant("J-LGR-A");
        UUID driverId = UUID.randomUUID();
        UUID vehicleId = insertVehicle(tenantId, "RTE001", "ACTIVE");
        UUID routeId = insertRoute(tenantId, vehicleId, driverId, "ASSIGNED");

        mockMvc.perform(post("/api/logistics/routes/{id}/sync", routeId)
                        .header("Authorization", bearerWithUserId("CHOFER", tenantId, driverId))
                        .contentType("application/json")
                        .content("""
                                {
                                  "deviceId":"%s",
                                  "events":[
                                    {
                                      "clientEventId":"evt-invalid-001",
                                      "eventType":"STATUS_CHANGE",
                                      "eventOccurredAt":"2026-03-13T10:15:10"
                                    }
                                  ]
                                }
                                """.formatted(UUID.randomUUID())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.fieldErrors", hasSize(1)));
    }

    @Test
    @DisplayName("should keep idempotency for repeated route sync event")
    void shouldKeepIdempotencyForRepeatedRouteSyncEvent() throws Exception {
        UUID tenantId = insertTenant("J-LGR-A");
        UUID driverId = UUID.randomUUID();
        UUID vehicleId = insertVehicle(tenantId, "RTE001", "ACTIVE");
        UUID orderId = insertOrder(tenantId, "TRK-SYNC-20260313-0002", "ASSIGNED");
        UUID routeId = insertRoute(tenantId, vehicleId, driverId, "ASSIGNED");
        insertRouteStop(routeId, orderId, 1);
        UUID deviceId = UUID.randomUUID();

        String payload = """
                {
                  "deviceId":"%s",
                  "events":[
                    {
                      "clientEventId":"evt-dup-001",
                      "eventType":"STATUS_CHANGE",
                      "orderId":"%s",
                      "targetStatus":"IN_TRANSIT",
                      "eventOccurredAt":"2026-03-13T10:20:10"
                    }
                  ]
                }
                """.formatted(deviceId, orderId);

        mockMvc.perform(post("/api/logistics/routes/{id}/sync", routeId)
                        .header("Authorization", bearerWithUserId("CHOFER", tenantId, driverId))
                        .contentType("application/json")
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.acceptedEvents").value(1))
                .andExpect(jsonPath("$.duplicateEvents").value(0));

        mockMvc.perform(post("/api/logistics/routes/{id}/sync", routeId)
                        .header("Authorization", bearerWithUserId("CHOFER", tenantId, driverId))
                        .contentType("application/json")
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.acceptedEvents").value(0))
                .andExpect(jsonPath("$.duplicateEvents").value(1));
    }

    @Test
    @DisplayName("should return conflicts and preserve server state on invalid sync transition")
    void shouldReturnConflictsAndPreserveServerStateOnInvalidSyncTransition() throws Exception {
        UUID tenantId = insertTenant("J-LGR-A");
        UUID driverId = UUID.randomUUID();
        UUID vehicleId = insertVehicle(tenantId, "RTE001", "ACTIVE");
        UUID orderId = insertOrder(tenantId, "TRK-SYNC-20260313-0003", "CREATED");
        UUID routeId = insertRoute(tenantId, vehicleId, driverId, "ASSIGNED");
        insertRouteStop(routeId, orderId, 1);

        mockMvc.perform(post("/api/logistics/routes/{id}/sync", routeId)
                        .header("Authorization", bearerWithUserId("CHOFER", tenantId, driverId))
                        .contentType("application/json")
                        .content("""
                                {
                                  "deviceId":"%s",
                                  "events":[
                                    {
                                      "clientEventId":"evt-conflict-001",
                                      "eventType":"STATUS_CHANGE",
                                      "orderId":"%s",
                                      "targetStatus":"DELIVERED",
                                      "eventOccurredAt":"2026-03-13T10:30:10"
                                    }
                                  ]
                                }
                                """.formatted(UUID.randomUUID(), orderId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.acceptedEvents").value(0))
                .andExpect(jsonPath("$.conflictEvents").value(1));

        String orderStatus = jdbcTemplate.queryForObject("SELECT status FROM orders WHERE id = ?", String.class, orderId);
        Integer conflictCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sync_conflicts WHERE tenant_id = ? AND order_id = ?",
                Integer.class,
                tenantId,
                orderId
        );

        assertThat(orderStatus).isEqualTo("CREATED");
        assertThat(conflictCount).isEqualTo(1);
    }

    @Test
    @DisplayName("should reject non chofer role on route sync endpoint")
    void shouldRejectNonChoferRoleOnRouteSyncEndpoint() throws Exception {
        UUID tenantId = insertTenant("J-LGR-A");
        UUID routeId = UUID.randomUUID();

        mockMvc.perform(post("/api/logistics/routes/{id}/sync", routeId)
                        .header("Authorization", bearer("DESPACHADOR", tenantId))
                        .contentType("application/json")
                        .content("""
                                {"deviceId":"%s","events":[]}
                                """.formatted(UUID.randomUUID())))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("should enforce tenant and driver scope on route sync endpoint")
    void shouldEnforceTenantAndDriverScopeOnRouteSyncEndpoint() throws Exception {
        UUID tenantA = insertTenant("J-LGR-A");
        UUID tenantB = insertTenant("J-LGR-B");
        UUID driverA = UUID.randomUUID();
        UUID vehicleId = insertVehicle(tenantA, "RTE001", "ACTIVE");
        UUID orderId = insertOrder(tenantA, "TRK-SYNC-20260313-0004", "ASSIGNED");
        UUID routeId = insertRoute(tenantA, vehicleId, driverA, "ASSIGNED");
        insertRouteStop(routeId, orderId, 1);

        mockMvc.perform(post("/api/logistics/routes/{id}/sync", routeId)
                        .header("Authorization", bearerWithUserId("CHOFER", tenantB, driverA))
                        .contentType("application/json")
                        .content("""
                                {
                                  "deviceId":"%s",
                                  "events":[
                                    {
                                      "clientEventId":"evt-tenant-001",
                                      "eventType":"STATUS_CHANGE",
                                      "orderId":"%s",
                                      "targetStatus":"IN_TRANSIT",
                                      "eventOccurredAt":"2026-03-13T10:40:10"
                                    }
                                  ]
                                }
                                """.formatted(UUID.randomUUID(), orderId)))
                .andExpect(status().isNotFound());
    }

    private String bearer(String role, UUID tenantId) {
        String token = jwtService.generateAccessToken(UUID.randomUUID(), role.toLowerCase() + "@test.com", role, tenantId);
        return "Bearer " + token;
    }

    private String bearerWithUserId(String role, UUID tenantId, UUID userId) {
        String token = jwtService.generateAccessToken(userId, role.toLowerCase() + "@test.com", role, tenantId);
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

    private UUID insertOrderWithNormalization(UUID tenantId,
                                              String trackingCode,
                                              String status,
                                              String normalizedAddress,
                                              double confidence,
                                              boolean fallbackUsed) {
        return jdbcTemplate.queryForObject(
                """
                INSERT INTO orders(
                    tenant_id,
                    tracking_code,
                    status,
                    normalized_address,
                    normalization_confidence,
                    normalization_fallback_used,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, now(), now())
                RETURNING id
                """,
                UUID.class,
                tenantId,
                trackingCode,
                status,
                normalizedAddress,
                confidence,
                fallbackUsed
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
