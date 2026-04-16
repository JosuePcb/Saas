package com.saas.modules.billing.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.saas.core.exceptions.GlobalExceptionHandler;
import com.saas.modules.billing.dtos.AdminPaymentResponse;
import com.saas.modules.billing.dtos.PaymentDecision;
import com.saas.modules.billing.dtos.PaymentDecisionRequest;
import com.saas.modules.billing.models.PaymentMethod;
import com.saas.modules.billing.models.PaymentStatus;
import com.saas.modules.billing.services.PaymentReviewService;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
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
        controllers = AdminPaymentController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = JwtAuthenticationFilter.class)
)
@AutoConfigureMockMvc(addFilters = true)
@Import({GlobalExceptionHandler.class, AdminPaymentControllerWebMvcTest.TestSecurityConfig.class})
@DisplayName("AdminPaymentController web mvc tests")
class AdminPaymentControllerWebMvcTest {

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
    private PaymentReviewService paymentReviewService;

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    @DisplayName("GET /api/admin/billing/payments returns pending review queue")
    void shouldListPendingQueueForSuperAdmin() throws Exception {
        when(paymentReviewService.listQueue(PaymentStatus.PENDING_VALIDATION)).thenReturn(List.of(
                new AdminPaymentResponse(
                        UUID.randomUUID(),
                        UUID.randomUUID(),
                        PaymentMethod.PAGO_MOVIL,
                        PaymentStatus.PENDING_VALIDATION,
                        new BigDecimal("70.00"),
                        "REF-Q-ADMIN-1",
                        LocalDateTime.now().minusHours(2),
                        "https://cdn.local/queue-admin-1.png",
                        LocalDateTime.now().minusHours(1),
                        null,
                        null,
                        null
                )
        ));

        mockMvc.perform(get("/api/admin/billing/payments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].status").value("PENDING_VALIDATION"));
    }

    @Test
    @WithMockUser(roles = "ADMIN_PYME")
    @DisplayName("GET /api/admin/billing/payments rejects non-superadmin")
    void shouldRejectNonSuperAdminQueueAccess() throws Exception {
        mockMvc.perform(get("/api/admin/billing/payments"))
                .andExpect(status().isForbidden());

        verify(paymentReviewService, never()).listQueue(any(PaymentStatus.class));
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN", username = "11111111-1111-1111-1111-111111111111")
    @DisplayName("POST /api/admin/billing/payments/{id}/decision applies approve decision")
    void shouldApplyApproveDecision() throws Exception {
        UUID paymentId = UUID.randomUUID();
        PaymentDecisionRequest request = new PaymentDecisionRequest(PaymentDecision.APPROVE, "Receipt validated");

        when(paymentReviewService.applyDecision(eq(paymentId), any(PaymentDecisionRequest.class), any(UUID.class)))
                .thenReturn(new AdminPaymentResponse(
                        paymentId,
                        UUID.randomUUID(),
                        PaymentMethod.TRANSFERENCIA,
                        PaymentStatus.APPROVED,
                        new BigDecimal("70.00"),
                        "REF-D-1",
                        LocalDateTime.now().minusHours(2),
                        "https://cdn.local/decision-admin-1.png",
                        LocalDateTime.now().minusHours(1),
                        "Receipt validated",
                        UUID.randomUUID(),
                        LocalDateTime.now()
                ));

        mockMvc.perform(post("/api/admin/billing/payments/{id}/decision", paymentId)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.decisionComment").value("Receipt validated"));
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    @DisplayName("POST /api/admin/billing/payments/{id}/decision rejects blank comment")
    void shouldRejectBlankComment() throws Exception {
        UUID paymentId = UUID.randomUUID();
        String invalidPayload = """
                {
                  "decision": "REJECT",
                  "comment": ""
                }
                """;

        mockMvc.perform(post("/api/admin/billing/payments/{id}/decision", paymentId)
                        .contentType("application/json")
                        .content(invalidPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors", hasSize(1)));

        verify(paymentReviewService, never()).applyDecision(eq(paymentId), any(PaymentDecisionRequest.class), any(UUID.class));
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN", username = "not-a-uuid")
    @DisplayName("POST /api/admin/billing/payments/{id}/decision rejects invalid reviewer principal")
    void shouldRejectInvalidReviewerPrincipal() throws Exception {
        UUID paymentId = UUID.randomUUID();
        PaymentDecisionRequest request = new PaymentDecisionRequest(PaymentDecision.APPROVE, "Receipt validated");

        mockMvc.perform(post("/api/admin/billing/payments/{id}/decision", paymentId)
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Reviewer user id is invalid"));

        verify(paymentReviewService, never()).applyDecision(eq(paymentId), any(PaymentDecisionRequest.class), any(UUID.class));
    }
}
