package com.saas.modules.identity.services;

import com.saas.core.exceptions.DuplicateResourceException;
import com.saas.core.exceptions.ResourceNotFoundException;
import com.saas.core.tenant.TenantContext;
import com.saas.modules.identity.dtos.*;
import com.saas.modules.identity.models.User;
import com.saas.modules.identity.repositories.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * CRUD operations for users within the current tenant scope.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                        UserMapper userMapper) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userMapper = userMapper;
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("Email already registered");
        }

        UUID tenantId = TenantContext.getCurrentTenantId();

        User user = User.builder()
                .tenantId(tenantId)
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .nombre(request.nombre())
                .apellido(request.apellido())
                .telefono(request.telefono())
                .role(request.role())
                .activo(true)
                .build();

        user = userRepository.save(user);
        return userMapper.toResponse(user);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        UUID tenantId = TenantContext.getCurrentTenantId();
        return userRepository.findByTenantId(tenantId).stream()
                .map(userMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(UUID userId) {
        UUID tenantId = TenantContext.getCurrentTenantId();
        User user = userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return userMapper.toResponse(user);
    }

    @Transactional
    public UserResponse updateUser(UUID userId, UpdateUserRequest request) {
        UUID tenantId = TenantContext.getCurrentTenantId();
        User user = userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (request.nombre() != null) user.setNombre(request.nombre());
        if (request.apellido() != null) user.setApellido(request.apellido());
        if (request.telefono() != null) user.setTelefono(request.telefono());
        if (request.role() != null) user.setRole(request.role());
        if (request.activo() != null) user.setActivo(request.activo());

        user = userRepository.save(user);
        return userMapper.toResponse(user);
    }

    @Transactional
    public void deleteUser(UUID userId) {
        UUID tenantId = TenantContext.getCurrentTenantId();
        User user = userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        userRepository.delete(user);
    }
}
