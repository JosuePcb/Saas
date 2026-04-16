package com.saas.modules.identity.services;

import com.saas.core.exceptions.BusinessException;
import com.saas.core.exceptions.DuplicateResourceException;
import com.saas.core.exceptions.TenantSuspendedException;
import com.saas.core.security.JwtService;
import com.saas.modules.identity.dtos.*;
import com.saas.modules.identity.models.*;
import com.saas.modules.identity.repositories.TenantRepository;
import com.saas.modules.identity.repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Unit Tests")
class AuthServiceTest {

    @Mock
    private TenantRepository tenantRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private RefreshTokenService refreshTokenService;
    @Mock
    private UserMapper userMapper;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(tenantRepository, userRepository, passwordEncoder,
                jwtService, refreshTokenService, userMapper);
    }

    @Nested
    @DisplayName("Register")
    class Register {

        private RegisterRequest validRequest = new RegisterRequest(
                "Mi PYME", "J-12345678-9", "admin@mipyme.com",
                "Str0ng!Pass", "+584141234567", "Juan", "Pérez"
        );

        @Test
        @DisplayName("Should register tenant + admin user successfully")
        void shouldRegisterSuccessfully() {
            when(tenantRepository.existsByRif(anyString())).thenReturn(false);
            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(passwordEncoder.encode(anyString())).thenReturn("$2a$12$hashedpassword");
            when(tenantRepository.save(any(Tenant.class))).thenAnswer(inv -> {
                Tenant t = inv.getArgument(0);
                t.setId(UUID.randomUUID());
                return t;
            });
            when(userRepository.save(any(User.class))).thenAnswer(inv -> {
                User u = inv.getArgument(0);
                u.setId(UUID.randomUUID());
                return u;
            });
            when(jwtService.generateAccessToken(any(), anyString(), anyString(), any()))
                    .thenReturn("access-token");
            when(refreshTokenService.createRefreshToken(any()))
                    .thenReturn(new RefreshTokenService.TokenPair("refresh-token", RefreshToken.builder().build()));
            when(userMapper.toResponse(any(User.class)))
                    .thenReturn(new UserResponse(UUID.randomUUID(), "admin@mipyme.com", "Juan", "Pérez", UserRole.ADMIN_PYME, true));

            AuthResponse response = authService.register(validRequest);

            assertThat(response).isNotNull();
            assertThat(response.accessToken()).isEqualTo("access-token");
            assertThat(response.refreshToken()).isEqualTo("refresh-token");
            assertThat(response.user()).isNotNull();

            verify(tenantRepository).save(any(Tenant.class));
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Should reject duplicate RIF")
        void shouldRejectDuplicateRif() {
            when(tenantRepository.existsByRif("J-12345678-9")).thenReturn(true);

            assertThatThrownBy(() -> authService.register(validRequest))
                    .isInstanceOf(DuplicateResourceException.class)
                    .hasMessageContaining("RIF already registered");
        }

        @Test
        @DisplayName("Should reject duplicate email")
        void shouldRejectDuplicateEmail() {
            when(tenantRepository.existsByRif(anyString())).thenReturn(false);
            when(userRepository.existsByEmail("admin@mipyme.com")).thenReturn(true);

            assertThatThrownBy(() -> authService.register(validRequest))
                    .isInstanceOf(DuplicateResourceException.class)
                    .hasMessageContaining("Email already registered");
        }
    }

    @Nested
    @DisplayName("Login")
    class Login {

        private LoginRequest validLogin = new LoginRequest("admin@mipyme.com", "Str0ng!Pass");

        @Test
        @DisplayName("Should login successfully with valid credentials")
        void shouldLoginSuccessfully() {
            UUID tenantId = UUID.randomUUID();
            User user = User.builder()
                    .id(UUID.randomUUID())
                    .email("admin@mipyme.com")
                    .passwordHash("$2a$12$hashed")
                    .role(UserRole.ADMIN_PYME)
                    .tenantId(tenantId)
                    .activo(true)
                    .build();
            Tenant tenant = Tenant.builder()
                    .id(tenantId)
                    .status(TenantStatus.ACTIVE)
                    .build();

            when(userRepository.findByEmail("admin@mipyme.com")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("Str0ng!Pass", "$2a$12$hashed")).thenReturn(true);
            when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
            when(jwtService.generateAccessToken(any(), anyString(), anyString(), any())).thenReturn("access");
            when(refreshTokenService.createRefreshToken(any()))
                    .thenReturn(new RefreshTokenService.TokenPair("refresh", RefreshToken.builder().build()));
            when(userMapper.toResponse(any())).thenReturn(
                    new UserResponse(user.getId(), user.getEmail(), "Juan", "Pérez", UserRole.ADMIN_PYME, true));

            AuthResponse response = authService.login(validLogin);

            assertThat(response.accessToken()).isEqualTo("access");
            assertThat(response.refreshToken()).isEqualTo("refresh");
        }

        @Test
        @DisplayName("Should reject invalid password")
        void shouldRejectInvalidPassword() {
            User user = User.builder()
                    .email("admin@mipyme.com")
                    .passwordHash("$2a$12$hashed")
                    .activo(true)
                    .build();

            when(userRepository.findByEmail("admin@mipyme.com")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("Str0ng!Pass", "$2a$12$hashed")).thenReturn(false);

            assertThatThrownBy(() -> authService.login(validLogin))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Invalid credentials");
        }

        @Test
        @DisplayName("Should reject inactive user")
        void shouldRejectInactiveUser() {
            User user = User.builder()
                    .email("admin@mipyme.com")
                    .passwordHash("$2a$12$hashed")
                    .activo(false)
                    .build();

            when(userRepository.findByEmail("admin@mipyme.com")).thenReturn(Optional.of(user));

            assertThatThrownBy(() -> authService.login(validLogin))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Account disabled");
        }

        @Test
        @DisplayName("Should reject login for suspended tenant")
        void shouldRejectSuspendedTenant() {
            UUID tenantId = UUID.randomUUID();
            User user = User.builder()
                    .id(UUID.randomUUID())
                    .email("admin@mipyme.com")
                    .passwordHash("$2a$12$hashed")
                    .tenantId(tenantId)
                    .activo(true)
                    .build();
            Tenant tenant = Tenant.builder()
                    .id(tenantId)
                    .status(TenantStatus.SUSPENDED)
                    .build();

            when(userRepository.findByEmail("admin@mipyme.com")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("Str0ng!Pass", "$2a$12$hashed")).thenReturn(true);
            when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));

            assertThatThrownBy(() -> authService.login(validLogin))
                    .isInstanceOf(TenantSuspendedException.class);
        }

        @Test
        @DisplayName("Should reject user not found")
        void shouldRejectUserNotFound() {
            when(userRepository.findByEmail("admin@mipyme.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.login(validLogin))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Invalid credentials");
        }
    }

    @Nested
    @DisplayName("Refresh")
    class Refresh {

        @Test
        @DisplayName("Should refresh token successfully")
        void shouldRefreshSuccessfully() {
            User user = User.builder()
                    .id(UUID.randomUUID())
                    .email("test@example.com")
                    .role(UserRole.ADMIN_PYME)
                    .tenantId(UUID.randomUUID())
                    .build();
            RefreshToken oldToken = RefreshToken.builder()
                    .id(UUID.randomUUID())
                    .user(user)
                    .tokenHash("oldhash")
                    .expiresAt(LocalDateTime.now().plusDays(7))
                    .revoked(false)
                    .build();

            when(refreshTokenService.validateRefreshToken("old-raw-token")).thenReturn(oldToken);
            when(refreshTokenService.rotateRefreshToken(oldToken))
                    .thenReturn(new RefreshTokenService.TokenPair("new-refresh", RefreshToken.builder().build()));
            when(jwtService.generateAccessToken(any(), anyString(), anyString(), any())).thenReturn("new-access");
            when(userMapper.toResponse(any())).thenReturn(
                    new UserResponse(user.getId(), user.getEmail(), "Test", "User", UserRole.ADMIN_PYME, true));

            AuthResponse response = authService.refreshToken(new RefreshRequest("old-raw-token"));

            assertThat(response.accessToken()).isEqualTo("new-access");
            assertThat(response.refreshToken()).isEqualTo("new-refresh");
        }
    }
}
