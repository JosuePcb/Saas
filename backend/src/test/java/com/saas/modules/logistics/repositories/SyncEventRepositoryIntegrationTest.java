package com.saas.modules.logistics.repositories;

import com.saas.modules.logistics.models.SyncEvent;
import com.saas.modules.logistics.models.SyncEventType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@DisplayName("SyncEvent repository integration tests")
class SyncEventRepositoryIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("saas_test_sync_event_repo")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private SyncEventRepository syncEventRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private UUID tenantId;
    private UUID routeId;
    private UUID orderId;
    private UUID deviceId;

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM sync_conflicts");
        jdbcTemplate.update("DELETE FROM sync_events");
        jdbcTemplate.update("DELETE FROM route_stops");
        jdbcTemplate.update("DELETE FROM routes");
        jdbcTemplate.update("DELETE FROM orders");
        jdbcTemplate.update("DELETE FROM vehicles");
        jdbcTemplate.update("DELETE FROM tenants WHERE rif LIKE 'J-SYNC-EVENT-REPO-%'");

        tenantId = insertTenant("J-SYNC-EVENT-REPO-A");
        UUID vehicleId = insertVehicle(tenantId, "A01TEST");
        routeId = insertRoute(tenantId, vehicleId);
        orderId = insertOrder(tenantId, "TRK-SYNC-20260313-0001");
        deviceId = UUID.randomUUID();
    }

    @Test
    @DisplayName("should enforce unique tenant device and client event id for idempotency")
    void shouldEnforceUniqueTenantDeviceAndClientEventIdForIdempotency() {
        String clientEventId = "evt-001";

        syncEventRepository.save(buildSyncEvent(clientEventId));

        assertThatThrownBy(() -> syncEventRepository.saveAndFlush(buildSyncEvent(clientEventId)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    private SyncEvent buildSyncEvent(String clientEventId) {
        return SyncEvent.builder()
                .tenantId(tenantId)
                .deviceId(deviceId)
                .clientEventId(clientEventId)
                .routeId(routeId)
                .orderId(orderId)
                .eventType(SyncEventType.STATUS_CHANGE)
                .eventPayload("{\"status\":\"IN_TRANSIT\"}")
                .eventOccurredAt(LocalDateTime.now().minusMinutes(1))
                .build();
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

    private UUID insertRoute(UUID tenantId, UUID vehicleId) {
        return jdbcTemplate.queryForObject(
                """
                INSERT INTO routes(tenant_id, vehicle_id, status, created_at, updated_at)
                VALUES (?, ?, 'ASSIGNED', now(), now())
                RETURNING id
                """,
                UUID.class,
                tenantId,
                vehicleId
        );
    }

    private UUID insertOrder(UUID tenantId, String trackingCode) {
        return jdbcTemplate.queryForObject(
                """
                INSERT INTO orders(tenant_id, tracking_code, status, created_at, updated_at)
                VALUES (?, ?, 'ASSIGNED', now(), now())
                RETURNING id
                """,
                UUID.class,
                tenantId,
                trackingCode
        );
    }
}
