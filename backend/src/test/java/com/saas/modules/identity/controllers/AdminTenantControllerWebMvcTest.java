package com.saas.modules.identity.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.saas.core.exceptions.GlobalExceptionHandler;
import com.saas.modules.identity.dtos.AdminTenantGlobalMetricsResponse;
import com.saas.modules.identity.dtos.AdminTenantSummaryResponse;
import com.saas.modules.identity.models.TenantStatus;
import com.saas.modules.identity.services.AdminTenantService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import com.saas.core.security.JwtAuthenticationFilter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = AdminTenantController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = JwtAuthenticationFilter.class)
)
@AutoConfigureMockMvc(addFilters = true)
@Import({GlobalExceptionHandler.class, AdminTenantControllerWebMvcTest.TestSecurityConfig.class})
@DisplayName("AdminTenantController web mvc tests")
class AdminTenantControllerWebMvcTest {

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
    private AdminTenantService adminTenantService;

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    @DisplayName("GET /api/admin/tenants returns tenant list for superadmin")
    void shouldListTenantsForSuperAdmin() throws Exception {
        when(adminTenantService.listTenants(null)).thenReturn(List.of(
                new AdminTenantSummaryResponse(
                        UUID.randomUUID(),
                        "Tenant A",
                        "J-ADM-TEN-1",
                        TenantStatus.ACTIVE,
                        UUID.randomUUID(),
                        LocalDateTime.now().minusDays(10),
                        LocalDateTime.now().plusDays(20),
                        LocalDateTime.now().minusDays(1),
                        null,
                        null,
                        null,
                        null,
                        2L
                )
        ));

        mockMvc.perform(get("/api/admin/tenants"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].pendingPayments").value(2));
    }

    @Test
    @WithMockUser(roles = "ADMIN_PYME")
    @DisplayName("GET /api/admin/tenants rejects non-superadmin")
    void shouldRejectTenantListForNonSuperAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/tenants"))
                .andExpect(status().isForbidden());

        verify(adminTenantService, never()).listTenants(any());
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    @DisplayName("GET /api/admin/tenants/metrics returns global metrics")
    void shouldReturnGlobalMetrics() throws Exception {
        when(adminTenantService.globalMetrics()).thenReturn(new AdminTenantGlobalMetricsResponse(
                4L,
                Map.of("ACTIVE", 2L, "TRIAL", 1L, "SUSPENDED", 1L, "CANCELLED", 0L),
                3L,
                2L
        ));

        mockMvc.perform(get("/api/admin/tenants/metrics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalTenants").value(4))
                .andExpect(jsonPath("$.pendingPaymentQueueSize").value(3));
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN", username = "11111111-1111-1111-1111-111111111111")
    @DisplayName("POST /api/admin/tenants/{id}/suspend applies suspension")
    void shouldSuspendTenant() throws Exception {
        UUID tenantId = UUID.randomUUID();
        when(adminTenantService.suspendTenant(eq(tenantId), eq("Repeated fraud signals"), any(UUID.class)))
                .thenReturn(new AdminTenantSummaryResponse(
                        tenantId,
                        "Tenant A",
                        "J-ADM-TEN-1",
                        TenantStatus.SUSPENDED,
                        UUID.randomUUID(),
                        LocalDateTime.now().minusDays(10),
                        LocalDateTime.now().plusDays(20),
                        LocalDateTime.now(),
                        LocalDateTime.now(),
                        "Repeated fraud signals",
                        null,
                        null,
                        1L
                ));

        mockMvc.perform(post("/api/admin/tenants/{tenantId}/suspend", tenantId)
                        .contentType("application/json")
                        .content("{\"reason\":\"Repeated fraud signals\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUSPENDED"));
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN", username = "not-a-uuid")
    @DisplayName("POST /api/admin/tenants/{id}/reactivate rejects invalid principal")
    void shouldRejectInvalidSuperAdminPrincipal() throws Exception {
        UUID tenantId = UUID.randomUUID();

        mockMvc.perform(post("/api/admin/tenants/{tenantId}/reactivate", tenantId)
                        .contentType("application/json")
                        .content("{\"reason\":\"Payment settled\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("SuperAdmin user id is invalid"));

        verify(adminTenantService, never()).reactivateTenant(any(UUID.class), any(String.class), any(UUID.class));
    }
}
