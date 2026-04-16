package com.saas.modules.identity.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.saas.core.exceptions.GlobalExceptionHandler;
import com.saas.modules.identity.dtos.UserResponse;
import com.saas.modules.identity.models.UserRole;
import com.saas.modules.identity.dtos.UpdateUserRequest;
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
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.web.SecurityFilterChain;
import com.saas.core.security.JwtAuthenticationFilter;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = UserController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = JwtAuthenticationFilter.class)
)
@AutoConfigureMockMvc(addFilters = true)
@Import({GlobalExceptionHandler.class, UserControllerRbacDeleteUpdateTest.TestSecurityConfig.class})
@DisplayName("UserController RBAC Update/Delete Tests")
class UserControllerRbacDeleteUpdateTest {

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

    private String updatePayload() throws Exception {
        UpdateUserRequest request = new UpdateUserRequest("Updated", "User", null, null, null);
        return objectMapper.writeValueAsString(request);
    }

    @Nested
    @DisplayName("PUT /api/users/{id} — Role Access Control")
    class UpdateUser {

        @Test
        @WithMockUser(roles = "ADMIN_PYME")
        @DisplayName("ADMIN_PYME can update users (200)")
        void adminPymeCanUpdateUsers() throws Exception {
            UUID userId = UUID.randomUUID();
            when(userService.updateUser(org.mockito.ArgumentMatchers.eq(userId), org.mockito.ArgumentMatchers.any()))
                    .thenReturn(new UserResponse(userId, "updated@example.com", "Updated", "User", UserRole.CHOFER, true));

            mockMvc.perform(put("/api/users/" + userId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updatePayload()))
                    .andExpect(status().isOk());
        }

        @Test
        @WithMockUser(roles = "SUPER_ADMIN")
        @DisplayName("SUPER_ADMIN can update users (200)")
        void superAdminCanUpdateUsers() throws Exception {
            UUID userId = UUID.randomUUID();
            when(userService.updateUser(org.mockito.ArgumentMatchers.eq(userId), org.mockito.ArgumentMatchers.any()))
                    .thenReturn(new UserResponse(userId, "updated@example.com", "Updated", "User", UserRole.CHOFER, true));

            mockMvc.perform(put("/api/users/" + userId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updatePayload()))
                    .andExpect(status().isOk());
        }

        @Test
        @WithMockUser(roles = "CHOFER")
        @DisplayName("CHOFER cannot update users (403)")
        void choferCannotUpdateUsers() throws Exception {
            mockMvc.perform(put("/api/users/" + UUID.randomUUID())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updatePayload()))
                    .andExpect(status().isForbidden());

            verify(userService, never()).updateUser(any(), any());
        }

        @Test
        @WithMockUser(roles = "DESPACHADOR")
        @DisplayName("DESPACHADOR cannot update users (403)")
        void despachadorCannotUpdateUsers() throws Exception {
            mockMvc.perform(put("/api/users/" + UUID.randomUUID())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updatePayload()))
                    .andExpect(status().isForbidden());

            verify(userService, never()).updateUser(any(), any());
        }
    }

    @Nested
    @DisplayName("DELETE /api/users/{id} — Role Access Control")
    class DeleteUser {

        @Test
        @WithMockUser(roles = "ADMIN_PYME")
        @DisplayName("ADMIN_PYME can delete users (204)")
        void adminPymeCanDeleteUsers() throws Exception {
            mockMvc.perform(delete("/api/users/" + UUID.randomUUID()))
                    .andExpect(status().isNoContent());
        }

        @Test
        @WithMockUser(roles = "SUPER_ADMIN")
        @DisplayName("SUPER_ADMIN can delete users (204)")
        void superAdminCanDeleteUsers() throws Exception {
            mockMvc.perform(delete("/api/users/" + UUID.randomUUID()))
                    .andExpect(status().isNoContent());
        }

        @Test
        @WithMockUser(roles = "CHOFER")
        @DisplayName("CHOFER cannot delete users (403)")
        void choferCannotDeleteUsers() throws Exception {
            mockMvc.perform(delete("/api/users/" + UUID.randomUUID()))
                    .andExpect(status().isForbidden());

            verify(userService, never()).deleteUser(any());
        }

        @Test
        @WithMockUser(roles = "DESPACHADOR")
        @DisplayName("DESPACHADOR cannot delete users (403)")
        void despachadorCannotDeleteUsers() throws Exception {
            mockMvc.perform(delete("/api/users/" + UUID.randomUUID()))
                    .andExpect(status().isForbidden());

            verify(userService, never()).deleteUser(any());
        }
    }

    @Nested
    @DisplayName("Unauthenticated requests")
    class Unauthenticated {

        @Test
        @DisplayName("Unauthenticated update request returns 401")
        void unauthenticatedUpdateShouldReturn401() throws Exception {
            mockMvc.perform(put("/api/users/" + UUID.randomUUID())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updatePayload()))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Unauthenticated delete request returns 401")
        void unauthenticatedDeleteShouldReturn401() throws Exception {
            mockMvc.perform(delete("/api/users/" + UUID.randomUUID()))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Unauthenticated list request returns 401")
        void unauthenticatedListShouldReturn401() throws Exception {
            mockMvc.perform(get("/api/users"))
                    .andExpect(status().isUnauthorized());
        }
    }
}
