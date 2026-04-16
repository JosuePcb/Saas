package com.saas.modules.identity.services;

import com.saas.core.exceptions.BusinessException;
import com.saas.core.exceptions.DuplicateResourceException;
import com.saas.core.exceptions.TenantSuspendedException;
import com.saas.core.security.JwtService;
import com.saas.modules.identity.dtos.*;
import com.saas.modules.identity.models.*;
import com.saas.modules.identity.repositories.TenantRepository;
import com.saas.modules.identity.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Handles tenant registration, user authentication, and token management.
 */
@Service
public class AuthService {

    // Default Starter plan ID (seeded in V1 migration)
    private static final UUID STARTER_PLAN_ID = UUID.fromString("a0000000-0000-0000-0000-000000000001");

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final UserMapper userMapper;

    public AuthService(TenantRepository tenantRepository, UserRepository userRepository,
                        PasswordEncoder passwordEncoder, JwtService jwtService,
                        RefreshTokenService refreshTokenService, UserMapper userMapper) {
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.userMapper = userMapper;
    }

    /**
     * Registers a new tenant with an ADMIN_PYME user.
     * Tenant starts in TRIAL status with 7-day access.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check for duplicates
        if (tenantRepository.existsByRif(request.rif())) {
            throw new DuplicateResourceException("RIF already registered");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("Email already registered");
        }

        // Create tenant in TRIAL status
        Tenant tenant = Tenant.builder()
                .nombre(request.nombreEmpresa())
                .rif(request.rif())
                .status(TenantStatus.TRIAL)
                .statusChangedAt(LocalDateTime.now())
                .planId(STARTER_PLAN_ID)
                .fechaRegistro(LocalDateTime.now())
                .fechaCorte(LocalDateTime.now().plusDays(7))
                .build();
        tenant = tenantRepository.save(tenant);

        // Create admin user
        User user = User.builder()
                .tenantId(tenant.getId())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .nombre(request.nombre())
                .apellido(request.apellido())
                .telefono(request.telefono())
                .role(UserRole.ADMIN_PYME)
                .activo(true)
                .build();
        user = userRepository.save(user);

        // Generate tokens
        String accessToken = jwtService.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name(), tenant.getId());
        RefreshTokenService.TokenPair refreshPair = refreshTokenService.createRefreshToken(user);

        return new AuthResponse(accessToken, refreshPair.rawToken(), userMapper.toResponse(user));
    }

    /**
     * Authenticates a user with email + password.
     * Validates user is active and tenant is not suspended/cancelled.
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BusinessException("Invalid credentials", HttpStatus.UNAUTHORIZED));

        if (!user.getActivo()) {
            throw new BusinessException("Account disabled", HttpStatus.UNAUTHORIZED);
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BusinessException("Invalid credentials", HttpStatus.UNAUTHORIZED);
        }

        // Check tenant status (SuperAdmin has no tenant)
        if (user.getTenantId() != null) {
            Tenant tenant = tenantRepository.findById(user.getTenantId())
                    .orElseThrow(() -> new BusinessException("Tenant not found", HttpStatus.UNAUTHORIZED));

            if (tenant.getStatus() == TenantStatus.SUSPENDED || tenant.getStatus() == TenantStatus.CANCELLED) {
                throw new TenantSuspendedException();
            }
        }

        // Generate tokens
        String accessToken = jwtService.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name(), user.getTenantId());
        RefreshTokenService.TokenPair refreshPair = refreshTokenService.createRefreshToken(user);

        return new AuthResponse(accessToken, refreshPair.rawToken(), userMapper.toResponse(user));
    }

    /**
     * Refreshes an access token using a valid refresh token.
     * Implements refresh token rotation.
     */
    @Transactional
    public AuthResponse refreshToken(RefreshRequest request) {
        RefreshToken oldToken = refreshTokenService.validateRefreshToken(request.refreshToken());
        User user = oldToken.getUser();

        RefreshTokenService.TokenPair newPair = refreshTokenService.rotateRefreshToken(oldToken);
        String accessToken = jwtService.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name(), user.getTenantId());

        return new AuthResponse(accessToken, newPair.rawToken(), userMapper.toResponse(user));
    }
}
