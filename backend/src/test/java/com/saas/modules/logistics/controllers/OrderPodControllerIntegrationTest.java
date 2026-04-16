package com.saas.modules.logistics.controllers;

import com.saas.core.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import com.saas.core.storage.ObjectStoragePort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@DisplayName("Order PoD controller integration tests")
class OrderPodControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("saas_test_logistics_order_pod_controller")
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

    @MockitoBean
    private ObjectStoragePort objectStoragePort;

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM order_status_history");
        jdbcTemplate.update("DELETE FROM route_stops");
        jdbcTemplate.update("DELETE FROM routes");
        jdbcTemplate.update("DELETE FROM orders");
        jdbcTemplate.update("DELETE FROM vehicles");
        jdbcTemplate.update("DELETE FROM tenants WHERE rif LIKE 'J-LGP-%'");
    }

    @Test
    @DisplayName("should upload PoD metadata and retrieve it within tenant")
    void shouldUploadPodMetadataAndRetrieveItWithinTenant() throws Exception {
        UUID tenantId = insertTenant("J-LGP-A");
        UUID orderId = insertOrder(tenantId, "TRK-POD0001-20260312-0001", "DELIVERED");

        MockMultipartFile file = new MockMultipartFile("file", "pod.png", "image/png", "png-bytes".getBytes());
        when(objectStoragePort.putObject(eq("pod-evidence-test"), any(String.class), any(), anyLong(), eq("image/png")))
                .thenAnswer(invocation -> invocation.getArgument(1));

        mockMvc.perform(multipart("/api/logistics/orders/{id}/pod", orderId)
                        .file(file)
                        .header("Authorization", bearer("DESPACHADOR", tenantId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderId").value(orderId.toString()))
                .andExpect(jsonPath("$.objectKey").exists())
                .andExpect(jsonPath("$.contentType").value("image/png"));

        mockMvc.perform(get("/api/logistics/orders/{id}/pod", orderId)
                        .header("Authorization", bearer("DESPACHADOR", tenantId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value(orderId.toString()))
                .andExpect(jsonPath("$.contentType").value("image/png"));
    }

    @Test
    @DisplayName("should reject invalid PoD content type with 400")
    void shouldRejectInvalidPodContentTypeWith400() throws Exception {
        UUID tenantId = insertTenant("J-LGP-A");
        UUID orderId = insertOrder(tenantId, "TRK-POD0001-20260312-0001", "DELIVERED");

        MockMultipartFile file = new MockMultipartFile("file", "pod.pdf", "application/pdf", "pdf-bytes".getBytes());

        mockMvc.perform(multipart("/api/logistics/orders/{id}/pod", orderId)
                        .file(file)
                        .header("Authorization", bearer("DESPACHADOR", tenantId)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Unsupported PoD content type"));
    }

    @Test
    @DisplayName("should enforce tenant isolation when retrieving PoD metadata")
    void shouldEnforceTenantIsolationWhenRetrievingPodMetadata() throws Exception {
        UUID tenantA = insertTenant("J-LGP-A");
        UUID tenantB = insertTenant("J-LGP-B");
        UUID orderId = insertOrder(tenantA, "TRK-POD0001-20260312-0001", "DELIVERED");

        jdbcTemplate.update(
                "UPDATE orders SET pod_object_key = ?, pod_content_type = ?, pod_size_bytes = ?, pod_uploaded_at = now() WHERE id = ?",
                "tenant-a/object-key",
                "image/png",
                100L,
                orderId
        );

        mockMvc.perform(get("/api/logistics/orders/{id}/pod", orderId)
                        .header("Authorization", bearer("DESPACHADOR", tenantB)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("should reject chofer role on PoD endpoints")
    void shouldRejectChoferRoleOnPodEndpoints() throws Exception {
        UUID tenantId = insertTenant("J-LGP-A");
        UUID orderId = insertOrder(tenantId, "TRK-POD0001-20260312-0001", "DELIVERED");
        MockMultipartFile file = new MockMultipartFile("file", "pod.png", "image/png", "png-bytes".getBytes());
        when(objectStoragePort.putObject(eq("pod-evidence-test"), any(String.class), any(), anyLong(), eq("image/png")))
                .thenAnswer(invocation -> invocation.getArgument(1));

        mockMvc.perform(multipart("/api/logistics/orders/{id}/pod", orderId)
                        .file(file)
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
}
