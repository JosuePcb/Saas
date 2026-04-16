package com.saas.modules.logistics;

import com.saas.core.storage.ObjectStoragePort;
import com.saas.modules.logistics.controllers.LogisticsHealthController;
import com.saas.modules.logistics.repositories.OrderRepository;
import com.saas.modules.logistics.repositories.OrderStatusHistoryRepository;
import com.saas.modules.logistics.repositories.RouteRepository;
import com.saas.modules.logistics.repositories.RouteStopRepository;
import com.saas.modules.logistics.repositories.VehicleRepository;
import com.saas.modules.logistics.services.LogisticsHealthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@DisplayName("Logistics module wiring tests")
class LogisticsModuleWiringTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("saas_test_logistics_wiring")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private LogisticsHealthController logisticsHealthController;

    @Autowired
    private LogisticsHealthService logisticsHealthService;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private RouteRepository routeRepository;

    @Autowired
    private RouteStopRepository routeStopRepository;

    @Autowired
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Autowired
    private ObjectStoragePort objectStoragePort;

    @Test
    @DisplayName("should wire logistics controllers services repositories and storage contract")
    void shouldWireLogisticsModuleBeans() {
        assertThat(logisticsHealthController).isNotNull();
        assertThat(logisticsHealthService).isNotNull();
        assertThat(vehicleRepository).isNotNull();
        assertThat(orderRepository).isNotNull();
        assertThat(routeRepository).isNotNull();
        assertThat(routeStopRepository).isNotNull();
        assertThat(orderStatusHistoryRepository).isNotNull();
        assertThat(objectStoragePort).isNotNull();
    }
}
