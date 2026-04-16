package com.saas.modules.logistics.services;

import com.saas.core.exceptions.BusinessException;
import com.saas.core.exceptions.DuplicateResourceException;
import com.saas.core.exceptions.ResourceNotFoundException;
import com.saas.core.tenant.TenantContext;
import com.saas.modules.logistics.dtos.CreateVehicleRequest;
import com.saas.modules.logistics.dtos.UpdateVehicleRequest;
import com.saas.modules.logistics.dtos.VehicleMapper;
import com.saas.modules.logistics.dtos.VehicleResponse;
import com.saas.modules.logistics.models.Vehicle;
import com.saas.modules.logistics.models.VehicleState;
import com.saas.modules.logistics.repositories.RouteRepository;
import com.saas.modules.logistics.repositories.VehicleRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("VehicleService unit tests")
class VehicleServiceTest {

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private RouteRepository routeRepository;

    @Mock
    private VehicleMapper vehicleMapper;

    @InjectMocks
    private VehicleService vehicleService;

    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        TenantContext.setCurrentTenantId(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("should create vehicle in current tenant with ACTIVE state")
    void shouldCreateVehicleInCurrentTenantWithActiveState() {
        CreateVehicleRequest request = new CreateVehicleRequest("ABC123");

        Vehicle mapped = Vehicle.builder()
                .plate("ABC123")
                .build();

        Vehicle saved = Vehicle.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .plate("ABC123")
                .state(VehicleState.ACTIVE)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(vehicleRepository.existsByTenantIdAndPlate(tenantId, "ABC123")).thenReturn(false);
        when(vehicleMapper.toEntity(request)).thenReturn(mapped);
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(saved);
        when(vehicleMapper.toResponse(saved)).thenReturn(new VehicleResponse(
                saved.getId(),
                saved.getPlate(),
                saved.getState(),
                saved.getCreatedAt(),
                saved.getUpdatedAt()
        ));

        VehicleResponse response = vehicleService.create(request);

        assertThat(response.state()).isEqualTo(VehicleState.ACTIVE);
        ArgumentCaptor<Vehicle> captor = ArgumentCaptor.forClass(Vehicle.class);
        verify(vehicleRepository).save(captor.capture());
        assertThat(captor.getValue().getTenantId()).isEqualTo(tenantId);
        assertThat(captor.getValue().getState()).isEqualTo(VehicleState.ACTIVE);
    }

    @Test
    @DisplayName("should reject duplicate plate in same tenant")
    void shouldRejectDuplicatePlateInSameTenant() {
        when(vehicleRepository.existsByTenantIdAndPlate(tenantId, "ABC123")).thenReturn(true);

        assertThatThrownBy(() -> vehicleService.create(new CreateVehicleRequest("ABC123")))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Vehicle plate already exists");

        verify(vehicleRepository, never()).save(any(Vehicle.class));
    }

    @Test
    @DisplayName("should reject assignment when vehicle is in maintenance state")
    void shouldRejectAssignmentWhenVehicleInMaintenance() {
        UUID vehicleId = UUID.randomUUID();
        Vehicle vehicle = Vehicle.builder()
                .id(vehicleId)
                .tenantId(tenantId)
                .plate("XYZ111")
                .state(VehicleState.MAINTENANCE)
                .build();

        when(vehicleRepository.findByIdAndTenantId(vehicleId, tenantId)).thenReturn(Optional.of(vehicle));

        assertThatThrownBy(() -> vehicleService.assertAssignable(vehicleId))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Vehicle is not assignable")
                .extracting("status")
                .isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("should reject delete when vehicle is linked to active route")
    void shouldRejectDeleteWhenVehicleIsLinkedToActiveRoute() {
        UUID vehicleId = UUID.randomUUID();
        Vehicle vehicle = Vehicle.builder()
                .id(vehicleId)
                .tenantId(tenantId)
                .plate("XYZ111")
                .state(VehicleState.ACTIVE)
                .build();

        when(vehicleRepository.findByIdAndTenantId(vehicleId, tenantId)).thenReturn(Optional.of(vehicle));
        when(routeRepository.existsByTenantIdAndVehicleIdAndStatusIn(eq(tenantId), eq(vehicleId), anySet()))
                .thenReturn(true);

        assertThatThrownBy(() -> vehicleService.delete(vehicleId))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Vehicle is assigned to an active route")
                .extracting("status")
                .isEqualTo(HttpStatus.CONFLICT);

        verify(vehicleRepository, never()).delete(any(Vehicle.class));
    }

    @Test
    @DisplayName("should enforce tenant scope on reads")
    void shouldEnforceTenantScopeOnReads() {
        UUID vehicleId = UUID.randomUUID();
        when(vehicleRepository.findByIdAndTenantId(vehicleId, tenantId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> vehicleService.getById(vehicleId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("should list current tenant vehicles")
    void shouldListCurrentTenantVehicles() {
        Vehicle vehicle = Vehicle.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .plate("AAA111")
                .state(VehicleState.ACTIVE)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(vehicleRepository.findByTenantIdOrderByCreatedAtDesc(tenantId)).thenReturn(List.of(vehicle));
        when(vehicleMapper.toResponse(vehicle)).thenAnswer(invocation -> {
            Vehicle current = invocation.getArgument(0);
            return new VehicleResponse(
                    current.getId(),
                    current.getPlate(),
                    current.getState(),
                    current.getCreatedAt(),
                    current.getUpdatedAt()
            );
        });

        List<VehicleResponse> response = vehicleService.list();
        assertThat(response).hasSize(1);
        assertThat(response.get(0).plate()).isEqualTo("AAA111");
    }

    @Test
    @DisplayName("should update vehicle plate and state")
    void shouldUpdateVehiclePlateAndState() {
        UUID vehicleId = UUID.randomUUID();
        Vehicle vehicle = Vehicle.builder()
                .id(vehicleId)
                .tenantId(tenantId)
                .plate("OLD111")
                .state(VehicleState.ACTIVE)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(vehicleRepository.findByIdAndTenantId(vehicleId, tenantId)).thenReturn(Optional.of(vehicle));
        when(vehicleRepository.existsByTenantIdAndPlate(tenantId, "NEW111")).thenReturn(false);
        when(vehicleRepository.save(vehicle)).thenReturn(vehicle);
        when(vehicleMapper.toResponse(vehicle)).thenAnswer(invocation -> {
            Vehicle current = invocation.getArgument(0);
            return new VehicleResponse(
                    current.getId(),
                    current.getPlate(),
                    current.getState(),
                    current.getCreatedAt(),
                    current.getUpdatedAt()
            );
        });

        VehicleResponse response = vehicleService.update(vehicleId, new UpdateVehicleRequest("NEW111", VehicleState.INACTIVE));

        assertThat(response.plate()).isEqualTo("NEW111");
        assertThat(response.state()).isEqualTo(VehicleState.INACTIVE);
    }
}
