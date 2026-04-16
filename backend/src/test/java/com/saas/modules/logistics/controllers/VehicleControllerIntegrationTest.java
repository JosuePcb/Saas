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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@DisplayName("VehicleController integration tests")
class VehicleControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("saas_test_logistics_vehicle_controller")
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
        jdbcTemplate.update("DELETE FROM route_stops");
        jdbcTemplate.update("DELETE FROM routes");
        jdbcTemplate.update("DELETE FROM vehicles");
        jdbcTemplate.update("DELETE FROM tenants WHERE rif LIKE 'J-LGV-%'");
    }

    @Test
    @DisplayName("should create vehicle with ACTIVE initial state")
    void shouldCreateVehicleWithActiveInitialState() throws Exception {
        UUID tenantId = insertTenant("J-LGV-A");

        mockMvc.perform(post("/api/logistics/vehicles")
                        .header("Authorization", bearer("ADMIN_PYME", tenantId))
                        .contentType("application/json")
                        .content("""
                                {"plate":"ABC123"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.plate").value("ABC123"))
                .andExpect(jsonPath("$.state").value("ACTIVE"));

        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM vehicles WHERE tenant_id = ?",
                Integer.class,
                tenantId
        );
        assertThat(count).isEqualTo(1);
    }

    @Test
    @DisplayName("should reject duplicate plate in same tenant with 409")
    void shouldRejectDuplicatePlateInSameTenant() throws Exception {
        UUID tenantId = insertTenant("J-LGV-A");
        jdbcTemplate.update(
                "INSERT INTO vehicles(tenant_id, plate, state, created_at, updated_at) VALUES (?, ?, 'ACTIVE', now(), now())",
                tenantId,
                "ABC123"
        );

        mockMvc.perform(post("/api/logistics/vehicles")
                        .header("Authorization", bearer("DESPACHADOR", tenantId))
                        .contentType("application/json")
                        .content("""
                                {"plate":"ABC123"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Vehicle plate already exists in current tenant"));
    }

    @Test
    @DisplayName("should allow same plate in different tenants")
    void shouldAllowSamePlateInDifferentTenants() throws Exception {
        UUID tenantA = insertTenant("J-LGV-A");
        UUID tenantB = insertTenant("J-LGV-B");

        mockMvc.perform(post("/api/logistics/vehicles")
                        .header("Authorization", bearer("ADMIN_PYME", tenantA))
                        .contentType("application/json")
                        .content("""
                                {"plate":"ABC123"}
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/logistics/vehicles")
                        .header("Authorization", bearer("ADMIN_PYME", tenantB))
                        .contentType("application/json")
                        .content("""
                                {"plate":"ABC123"}
                                """))
                .andExpect(status().isCreated());

        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM vehicles WHERE plate = 'ABC123'",
                Integer.class
        );
        assertThat(count).isEqualTo(2);
    }

    @Test
    @DisplayName("should enforce tenant isolation on get by id")
    void shouldEnforceTenantIsolationOnGetById() throws Exception {
        UUID tenantA = insertTenant("J-LGV-A");
        UUID tenantB = insertTenant("J-LGV-B");

        UUID vehicleId = insertVehicle(tenantA, "ISO001", "ACTIVE");

        mockMvc.perform(get("/api/logistics/vehicles/{id}", vehicleId)
                        .header("Authorization", bearer("DESPACHADOR", tenantB)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("should block delete when vehicle is assigned to non-completed route")
    void shouldBlockDeleteWhenVehicleAssignedToActiveRoute() throws Exception {
        UUID tenantId = insertTenant("J-LGV-A");
        UUID vehicleId = insertVehicle(tenantId, "DEL001", "ACTIVE");
        insertRoute(tenantId, vehicleId, "ASSIGNED");

        mockMvc.perform(delete("/api/logistics/vehicles/{id}", vehicleId)
                        .header("Authorization", bearer("ADMIN_PYME", tenantId)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Vehicle is assigned to an active route"));
    }

    @Test
    @DisplayName("should update list and delete vehicle in tenant scope")
    void shouldUpdateListAndDeleteVehicleInTenantScope() throws Exception {
        UUID tenantId = insertTenant("J-LGV-A");
        UUID vehicleId = insertVehicle(tenantId, "UPD001", "ACTIVE");

        mockMvc.perform(put("/api/logistics/vehicles/{id}", vehicleId)
                        .header("Authorization", bearer("DESPACHADOR", tenantId))
                        .contentType("application/json")
                        .content("""
                                {"plate":"UPD002","state":"INACTIVE"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plate").value("UPD002"))
                .andExpect(jsonPath("$.state").value("INACTIVE"));

        mockMvc.perform(get("/api/logistics/vehicles")
                        .header("Authorization", bearer("ADMIN_PYME", tenantId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].plate").value("UPD002"));

        mockMvc.perform(delete("/api/logistics/vehicles/{id}", vehicleId)
                        .header("Authorization", bearer("ADMIN_PYME", tenantId)))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("should reject chofer role on vehicle endpoints")
    void shouldRejectChoferRoleOnVehicleEndpoints() throws Exception {
        UUID tenantId = insertTenant("J-LGV-A");

        mockMvc.perform(get("/api/logistics/vehicles")
                        .header("Authorization", bearer("CHOFER", tenantId)))
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
}
