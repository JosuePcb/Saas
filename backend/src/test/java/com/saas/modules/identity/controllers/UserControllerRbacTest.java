package com.saas.modules.identity.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.saas.core.exceptions.GlobalExceptionHandler;
import com.saas.modules.identity.dtos.CreateUserRequest;
import com.saas.modules.identity.dtos.UserResponse;
import com.saas.modules.identity.models.UserRole;
import com.saas.modules.identity.services.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.context.annotation.FilterType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.web.SecurityFilterChain;
import com.saas.core.security.JwtAuthenticationFilter;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests RBAC enforcement on UserController using @WebMvcTest (no Docker/DB required).
 * Verifies that only ADMIN_PYME and SUPER_ADMIN roles can access user management endpoints.
 */
@WebMvcTest(
        controllers = UserController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = JwtAuthenticationFilter.class)
)
@AutoConfigureMockMvc(addFilters = true)
@Import({GlobalExceptionHandler.class, UserControllerRbacTest.TestSecurityConfig.class})
@DisplayName("UserController RBAC Tests")
class UserControllerRbacTest {

    @TestConfiguration
    @EnableMethodSecurity
    static class TestSecurityConfig {

        @Bean
        SecurityFilterChain testSecurityFilterChain(HttpSecurity http) throws Exception {
            return http
                    .csrf(csrf -> csrf.disable())
                    .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                    .httpBasic(Customizer.withDefaults())
                    .build();
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UserService userService;

    @BeforeEach
    void clearMockInvocations() {
        clearInvocations(userService);
    }

    @Nested
    @DisplayName("GET /api/users — Role Access Control")
    class ListUsers {

        @Test
        @WithMockUser(roles = "ADMIN_PYME")
        @DisplayName("ADMIN_PYME should access user list")
        void adminPymeShouldAccessUserList() throws Exception {
            when(userService.getAllUsers()).thenReturn(List.of());

            mockMvc.perform(get("/api/users"))
                    .andExpect(status().isOk());
        }

        @Test
        @WithMockUser(roles = "SUPER_ADMIN")
        @DisplayName("SUPER_ADMIN should access user list")
        void superAdminShouldAccessUserList() throws Exception {
            when(userService.getAllUsers()).thenReturn(List.of());

            mockMvc.perform(get("/api/users"))
                    .andExpect(status().isOk());
        }

        @Test
         @WithMockUser(roles = "CHOFER")
         @DisplayName("CHOFER should be rejected from user list (403)")
         void choferShouldBeRejected() throws Exception {
             mockMvc.perform(get("/api/users"))
                     .andExpect(status().isForbidden());

             verify(userService, never()).getAllUsers();
          }

        @Test
         @WithMockUser(roles = "DESPACHADOR")
         @DisplayName("DESPACHADOR should be rejected from user list (403)")
         void despachadorShouldBeRejected() throws Exception {
             mockMvc.perform(get("/api/users"))
                     .andExpect(status().isForbidden());

             verify(userService, never()).getAllUsers();
          }
    }

    @Nested
    @DisplayName("POST /api/users — Role Access Control")
    class CreateUser {

        private final String validRequestJson;

        CreateUser() throws Exception {
             CreateUserRequest request = new CreateUserRequest(
                     "new@example.com", "Password1!", "Test", "User",
                     null, UserRole.CHOFER
             );
             validRequestJson = new ObjectMapper().writeValueAsString(request);
         }

        @Test
        @WithMockUser(roles = "ADMIN_PYME")
        @DisplayName("ADMIN_PYME should create users (201)")
        void adminPymeShouldCreateUser() throws Exception {
            when(userService.createUser(any())).thenReturn(
                    new UserResponse(UUID.randomUUID(), "new@example.com", "Test", "User", UserRole.CHOFER, true));

            mockMvc.perform(post("/api/users")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(validRequestJson))
                    .andExpect(status().isCreated());
        }

        @Test
        @WithMockUser(roles = "SUPER_ADMIN")
        @DisplayName("SUPER_ADMIN should create users (201)")
        void superAdminShouldCreateUser() throws Exception {
            when(userService.createUser(any())).thenReturn(
                    new UserResponse(UUID.randomUUID(), "new@example.com", "Test", "User", UserRole.CHOFER, true));

            mockMvc.perform(post("/api/users")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(validRequestJson))
                    .andExpect(status().isCreated());
        }

        @Test
         @WithMockUser(roles = "CHOFER")
         @DisplayName("CHOFER should be rejected from creating users (403)")
         void choferShouldBeRejectedFromCreatingUser() throws Exception {
             mockMvc.perform(post("/api/users")
                             .contentType(MediaType.APPLICATION_JSON)
                             .content(validRequestJson))
                     .andExpect(status().isForbidden());

              verify(userService, never()).createUser(any());
           }

        @Test
         @WithMockUser(roles = "DESPACHADOR")
         @DisplayName("DESPACHADOR should be rejected from creating users (403)")
         void despachadorShouldBeRejectedFromCreatingUser() throws Exception {
             mockMvc.perform(post("/api/users")
                             .contentType(MediaType.APPLICATION_JSON)
                             .content(validRequestJson))
                     .andExpect(status().isForbidden());

              verify(userService, never()).createUser(any());
           }
    }


    @Nested
    @DisplayName("Unauthenticated requests")
    class Unauthenticated {

        @Test
        @DisplayName("Unauthenticated request should return 401")
        void unauthenticatedShouldReturn401() throws Exception {
            mockMvc.perform(get("/api/users"))
                    .andExpect(status().isUnauthorized());
        }
    }
}
