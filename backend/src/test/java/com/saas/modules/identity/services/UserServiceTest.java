package com.saas.modules.identity.services;

import com.saas.core.exceptions.DuplicateResourceException;
import com.saas.core.exceptions.ResourceNotFoundException;
import com.saas.core.tenant.TenantContext;
import com.saas.modules.identity.dtos.*;
import com.saas.modules.identity.models.User;
import com.saas.modules.identity.models.UserRole;
import com.saas.modules.identity.repositories.UserRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService Unit Tests")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private UserMapper userMapper;

    private UserService userService;
    private UUID tenantId;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, passwordEncoder, userMapper);
        tenantId = UUID.randomUUID();
        TenantContext.setCurrentTenantId(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("Should create a user in current tenant")
    void shouldCreateUser() {
        CreateUserRequest request = new CreateUserRequest(
                "chofer@example.com", "Password1!", "Carlos", "López", "+584141234567", UserRole.CHOFER
        );
        when(userRepository.existsByEmail("chofer@example.com")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$12$hashed");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });
        when(userMapper.toResponse(any())).thenReturn(
                new UserResponse(UUID.randomUUID(), "chofer@example.com", "Carlos", "López", UserRole.CHOFER, true));

        UserResponse response = userService.createUser(request);

        assertThat(response).isNotNull();
        assertThat(response.email()).isEqualTo("chofer@example.com");
        assertThat(response.role()).isEqualTo(UserRole.CHOFER);

        // Verify user was created with current tenant
        var captor = org.mockito.ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getTenantId()).isEqualTo(tenantId);
    }

    @Test
    @DisplayName("Should reject duplicate email on create")
    void shouldRejectDuplicateEmail() {
        CreateUserRequest request = new CreateUserRequest(
                "existing@example.com", "Password1!", "Test", "User", null, UserRole.CHOFER
        );
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.createUser(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Email already registered");
    }

    @Test
    @DisplayName("Should get all users for current tenant")
    void shouldGetAllUsersForTenant() {
        User user = User.builder().id(UUID.randomUUID()).email("test@example.com")
                .tenantId(tenantId).role(UserRole.CHOFER).build();
        when(userRepository.findByTenantId(tenantId)).thenReturn(List.of(user));
        when(userMapper.toResponse(any())).thenReturn(
                new UserResponse(user.getId(), "test@example.com", "Test", "User", UserRole.CHOFER, true));

        List<UserResponse> users = userService.getAllUsers();

        assertThat(users).hasSize(1);
        verify(userRepository).findByTenantId(tenantId);
    }

    @Test
    @DisplayName("Should get user by id within tenant")
    void shouldGetUserByIdWithinTenant() {
        UUID userId = UUID.randomUUID();
        User user = User.builder().id(userId).email("test@example.com")
                .tenantId(tenantId).role(UserRole.CHOFER).build();
        when(userRepository.findByIdAndTenantId(userId, tenantId)).thenReturn(Optional.of(user));
        when(userMapper.toResponse(any())).thenReturn(
                new UserResponse(userId, "test@example.com", "Test", "User", UserRole.CHOFER, true));

        UserResponse response = userService.getUserById(userId);

        assertThat(response).isNotNull();
    }

    @Test
    @DisplayName("Should throw not found for user in different tenant")
    void shouldThrowNotFoundForDifferentTenant() {
        UUID userId = UUID.randomUUID();
        when(userRepository.findByIdAndTenantId(userId, tenantId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserById(userId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Should update user fields")
    void shouldUpdateUser() {
        UUID userId = UUID.randomUUID();
        User user = User.builder().id(userId).email("test@example.com")
                .nombre("Old").apellido("Name").tenantId(tenantId).activo(true)
                .role(UserRole.CHOFER).build();
        UpdateUserRequest request = new UpdateUserRequest("New", "Name", "+584149999999", null, null);

        when(userRepository.findByIdAndTenantId(userId, tenantId)).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(userMapper.toResponse(any())).thenReturn(
                new UserResponse(userId, "test@example.com", "New", "Name", UserRole.CHOFER, true));

        UserResponse response = userService.updateUser(userId, request);

        assertThat(response.nombre()).isEqualTo("New");
    }

    @Test
    @DisplayName("Should deactivate user")
    void shouldDeactivateUser() {
        UUID userId = UUID.randomUUID();
        User user = User.builder().id(userId).tenantId(tenantId).activo(true)
                .role(UserRole.CHOFER).build();
        UpdateUserRequest request = new UpdateUserRequest(null, null, null, null, false);

        when(userRepository.findByIdAndTenantId(userId, tenantId)).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(userMapper.toResponse(any())).thenReturn(
                new UserResponse(userId, "test@example.com", "Test", "User", UserRole.CHOFER, false));

        UserResponse response = userService.updateUser(userId, request);

        assertThat(response.activo()).isFalse();
    }
}
