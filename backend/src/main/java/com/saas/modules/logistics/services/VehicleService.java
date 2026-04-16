package com.saas.modules.logistics.services;

import com.saas.core.exceptions.BusinessException;
import com.saas.core.exceptions.DuplicateResourceException;
import com.saas.core.exceptions.ResourceNotFoundException;
import com.saas.core.tenant.TenantContext;
import com.saas.modules.logistics.dtos.CreateVehicleRequest;
import com.saas.modules.logistics.dtos.UpdateVehicleRequest;
import com.saas.modules.logistics.dtos.VehicleMapper;
import com.saas.modules.logistics.dtos.VehicleResponse;
import com.saas.modules.logistics.models.RouteStatus;
import com.saas.modules.logistics.models.Vehicle;
import com.saas.modules.logistics.models.VehicleState;
import com.saas.modules.logistics.repositories.RouteRepository;
import com.saas.modules.logistics.repositories.VehicleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class VehicleService {

    private static final Set<RouteStatus> NON_COMPLETED_ROUTE_STATUSES =
            Set.of(RouteStatus.DRAFT, RouteStatus.ASSIGNED, RouteStatus.IN_PROGRESS);

    private final VehicleRepository vehicleRepository;
    private final RouteRepository routeRepository;
    private final VehicleMapper vehicleMapper;

    public VehicleService(VehicleRepository vehicleRepository,
                          RouteRepository routeRepository,
                          VehicleMapper vehicleMapper) {
        this.vehicleRepository = vehicleRepository;
        this.routeRepository = routeRepository;
        this.vehicleMapper = vehicleMapper;
    }

    @Transactional
    public VehicleResponse create(CreateVehicleRequest request) {
        UUID tenantId = requiredTenantId();
        String normalizedPlate = normalizePlate(request.plate());

        if (vehicleRepository.existsByTenantIdAndPlate(tenantId, normalizedPlate)) {
            throw new DuplicateResourceException("Vehicle plate already exists in current tenant");
        }

        Vehicle vehicle = vehicleMapper.toEntity(request);
        vehicle.setTenantId(tenantId);
        vehicle.setPlate(normalizedPlate);
        vehicle.setState(VehicleState.ACTIVE);

        return vehicleMapper.toResponse(vehicleRepository.save(vehicle));
    }

    @Transactional(readOnly = true)
    public List<VehicleResponse> list() {
        UUID tenantId = requiredTenantId();
        return vehicleRepository.findByTenantIdOrderByCreatedAtDesc(tenantId)
                .stream()
                .map(vehicleMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public VehicleResponse getById(UUID vehicleId) {
        return vehicleMapper.toResponse(getCurrentTenantVehicle(vehicleId));
    }

    @Transactional
    public VehicleResponse update(UUID vehicleId, UpdateVehicleRequest request) {
        Vehicle vehicle = getCurrentTenantVehicle(vehicleId);

        if (request.plate() != null && !request.plate().isBlank()) {
            String normalizedPlate = normalizePlate(request.plate());
            if (!normalizedPlate.equals(vehicle.getPlate())
                    && vehicleRepository.existsByTenantIdAndPlate(vehicle.getTenantId(), normalizedPlate)) {
                throw new DuplicateResourceException("Vehicle plate already exists in current tenant");
            }
            vehicle.setPlate(normalizedPlate);
        }

        if (request.state() != null) {
            vehicle.setState(request.state());
        }

        return vehicleMapper.toResponse(vehicleRepository.save(vehicle));
    }

    @Transactional
    public void delete(UUID vehicleId) {
        Vehicle vehicle = getCurrentTenantVehicle(vehicleId);
        boolean hasActiveRoute = routeRepository.existsByTenantIdAndVehicleIdAndStatusIn(
                vehicle.getTenantId(),
                vehicle.getId(),
                NON_COMPLETED_ROUTE_STATUSES
        );

        if (hasActiveRoute) {
            throw new BusinessException("Vehicle is assigned to an active route", HttpStatus.CONFLICT);
        }

        vehicleRepository.delete(vehicle);
    }

    @Transactional(readOnly = true)
    public void assertAssignable(UUID vehicleId) {
        Vehicle vehicle = getCurrentTenantVehicle(vehicleId);
        if (vehicle.getState() != VehicleState.ACTIVE) {
            throw new BusinessException("Vehicle is not assignable", HttpStatus.CONFLICT);
        }
    }

    private Vehicle getCurrentTenantVehicle(UUID vehicleId) {
        UUID tenantId = requiredTenantId();
        return vehicleRepository.findByIdAndTenantId(vehicleId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", vehicleId));
    }

    private UUID requiredTenantId() {
        UUID tenantId = TenantContext.getCurrentTenantId();
        if (tenantId == null) {
            throw new BusinessException("Tenant context is required");
        }
        return tenantId;
    }

    private String normalizePlate(String plate) {
        return plate.trim().toUpperCase();
    }
}
