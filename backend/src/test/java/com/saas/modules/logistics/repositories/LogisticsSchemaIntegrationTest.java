package com.saas.modules.logistics.repositories;

import org.junit.jupiter.api.BeforeEach;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@DisplayName("Logistics schema integration tests")
class LogisticsSchemaIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("saas_test_logistics_schema")
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

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM tenants WHERE rif LIKE 'J-LOGISTICS-SCHEMA-%'");
        insertTenant("J-LOGISTICS-SCHEMA-A");
    }

    @Test
    @DisplayName("should create logistics tables with expected columns")
    void shouldCreateLogisticsTablesWithExpectedColumns() {
        assertTableHasColumns("vehicles", List.of(
                "id", "tenant_id", "plate", "state", "created_at", "updated_at"
        ));
        assertTableHasColumns("orders", List.of(
                "id", "tenant_id", "tracking_code", "status", "pod_object_key", "pod_content_type", "pod_size_bytes", "pod_uploaded_at",
                "normalized_address", "normalization_confidence", "normalization_fallback_used", "address_review_status", "normalized_at",
                "normalized_state", "normalized_municipio", "normalized_parroquia", "normalized_zona", "normalized_referencia",
                "normalized_latitude", "normalized_longitude",
                "created_at", "updated_at"
        ));
        assertTableHasColumns("routes", List.of(
                "id", "tenant_id", "vehicle_id", "driver_id", "status", "optimized_by_ai", "estimated_distance_km", "created_at", "updated_at"
        ));
        assertTableHasColumns("route_stops", List.of(
                "id", "route_id", "order_id", "stop_order", "eta", "created_at"
        ));
        assertTableHasColumns("order_status_history", List.of(
                "id", "order_id", "tenant_id", "status", "changed_at", "changed_by"
        ));
        assertTableHasColumns("sync_events", List.of(
                "id", "tenant_id", "device_id", "client_event_id", "route_id", "order_id", "event_type", "event_payload", "event_occurred_at", "received_at"
        ));
        assertTableHasColumns("sync_conflicts", List.of(
                "id", "tenant_id", "sync_event_id", "order_id", "conflict_type", "server_resolution", "created_at"
        ));
        assertTableHasColumns("ai_normalization_logs", List.of(
                "id", "tenant_id", "order_id", "raw_input_address", "normalized_output_payload", "normalization_confidence",
                "model_name", "normalization_status", "corrected_manually", "correction_payload", "created_at", "updated_at"
        ));
    }

    @Test
    @DisplayName("should create tenant-aware unique constraints and indexes")
    void shouldCreateTenantAwareUniqueConstraintsAndIndexes() {
        List<String> indexes = jdbcTemplate.queryForList(
                """
                SELECT indexdef
                FROM pg_indexes
                WHERE schemaname = 'public'
                  AND tablename IN ('vehicles', 'orders', 'routes', 'route_stops', 'order_status_history', 'sync_events', 'sync_conflicts', 'ai_normalization_logs')
                """,
                String.class
        );

        assertThat(indexes).anyMatch(index -> index.contains("UNIQUE") && index.contains("(tenant_id, plate)"));
        assertThat(indexes).anyMatch(index -> index.contains("UNIQUE") && index.contains("(tenant_id, tracking_code)"));
        assertThat(indexes).anyMatch(index -> index.contains("routes") && index.contains("(tenant_id, status"));
        assertThat(indexes).anyMatch(index -> index.contains("routes") && index.contains("(tenant_id, driver_id, status"));
        assertThat(indexes).anyMatch(index -> index.contains("route_stops") && index.contains("(route_id, stop_order"));
        assertThat(indexes).anyMatch(index -> index.contains("order_status_history") && index.contains("(order_id, changed_at"));
        assertThat(indexes).anyMatch(index -> index.contains("sync_events") && index.contains("UNIQUE")
                && index.contains("(tenant_id, device_id, client_event_id)"));
        assertThat(indexes).anyMatch(index -> index.contains("sync_events") && index.contains("(tenant_id, route_id, event_occurred_at"));
        assertThat(indexes).anyMatch(index -> index.contains("sync_conflicts") && index.contains("(tenant_id, order_id, created_at"));
        assertThat(indexes).anyMatch(index -> index.contains("orders") && index.contains("(tenant_id, address_review_status, normalized_at"));
        assertThat(indexes).anyMatch(index -> index.contains("orders") && index.contains("(tenant_id, normalized_state, normalized_municipio"));
        assertThat(indexes).anyMatch(index -> index.contains("routes") && index.contains("(tenant_id, optimized_by_ai, status, created_at"));
        assertThat(indexes).anyMatch(index -> index.contains("ai_normalization_logs")
                && index.contains("(tenant_id, order_id, created_at"));
        assertThat(indexes).anyMatch(index -> index.contains("ai_normalization_logs")
                && index.contains("(tenant_id, normalization_status, created_at"));
    }

    @Test
    @DisplayName("should create expected check constraints for PRD-alignment columns")
    void shouldCreateExpectedCheckConstraintsForPrdAlignmentColumns() {
        List<String> constraints = jdbcTemplate.queryForList(
                """
                SELECT conname
                FROM pg_constraint
                WHERE conname IN (
                    'chk_routes_estimated_distance_km',
                    'chk_tenants_lifecycle_dates',
                    'chk_ai_normalization_logs_confidence',
                    'chk_ai_normalization_logs_status'
                )
                """,
                String.class
        );

        assertThat(constraints).containsExactlyInAnyOrder(
                "chk_routes_estimated_distance_km",
                "chk_tenants_lifecycle_dates",
                "chk_ai_normalization_logs_confidence",
                "chk_ai_normalization_logs_status"
        );
    }

    @Test
    @DisplayName("should use double precision for ai log normalization confidence")
    void shouldUseDoublePrecisionForAiLogNormalizationConfidence() {
        String dataType = jdbcTemplate.queryForObject(
                """
                SELECT data_type
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'ai_normalization_logs'
                  AND column_name = 'normalization_confidence'
                """,
                String.class
        );

        assertThat(dataType).isEqualTo("double precision");
    }

    @Test
    @DisplayName("should use double precision for orders normalization confidence")
    void shouldUseDoublePrecisionForOrdersNormalizationConfidence() {
        String dataType = jdbcTemplate.queryForObject(
                """
                SELECT data_type
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'orders'
                  AND column_name = 'normalization_confidence'
                """,
                String.class
        );

        assertThat(dataType).isEqualTo("double precision");
    }

    @Test
    @DisplayName("should use double precision for orders normalized coordinates")
    void shouldUseDoublePrecisionForOrdersNormalizedCoordinates() {
        List<String> dataTypes = jdbcTemplate.queryForList(
                """
                SELECT data_type
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'orders'
                  AND column_name IN ('normalized_latitude', 'normalized_longitude')
                ORDER BY column_name
                """,
                String.class
        );

        assertThat(dataTypes).containsExactly("double precision", "double precision");
    }

    private void assertTableHasColumns(String tableName, List<String> expectedColumns) {
        List<String> columns = jdbcTemplate.queryForList(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = ?
                """,
                String.class,
                tableName
        );

        assertThat(columns).containsAll(expectedColumns);
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
}
