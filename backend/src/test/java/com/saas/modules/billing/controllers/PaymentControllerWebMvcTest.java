package com.saas.modules.billing.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.saas.core.exceptions.GlobalExceptionHandler;
import com.saas.modules.billing.dtos.CreatePaymentRequest;
import com.saas.modules.billing.dtos.PaymentResponse;
import com.saas.modules.billing.models.PaymentMethod;
import com.saas.modules.billing.models.PaymentStatus;
import com.saas.modules.billing.services.PaymentQueryService;
import com.saas.modules.billing.services.PaymentSubmissionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
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

import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = PaymentController.class,
        excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = JwtAuthenticationFilter.class)
)
@AutoConfigureMockMvc(addFilters = true)
@Import({GlobalExceptionHandler.class, PaymentControllerWebMvcTest.TestSecurityConfig.class})
@DisplayName("PaymentController web mvc tests")
class PaymentControllerWebMvcTest {

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
    private PaymentSubmissionService paymentSubmissionService;

    @MockitoBean
    private PaymentQueryService paymentQueryService;

    @Test
    @WithMockUser(roles = "ADMIN_PYME")
    @DisplayName("POST /api/billing/payments creates payment for ADMIN_PYME")
    void shouldCreatePaymentForAdminPyme() throws Exception {
        CreatePaymentRequest request = new CreatePaymentRequest(
                PaymentMethod.PAGO_MOVIL,
                new BigDecimal("30.00"),
                "REF-API-001",
                LocalDateTime.now().minusMinutes(10),
                "https://cdn.local/evidence-001.png"
        );

        when(paymentSubmissionService.submit(any(CreatePaymentRequest.class))).thenReturn(new PaymentResponse(
                UUID.randomUUID(),
                UUID.randomUUID(),
                PaymentMethod.PAGO_MOVIL,
                PaymentStatus.PENDING_VALIDATION,
                new BigDecimal("30.00"),
                "REF-API-001",
                request.paymentDateTime(),
                request.evidenceUrl(),
                LocalDateTime.now()
        ));

        mockMvc.perform(post("/api/billing/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING_VALIDATION"));
    }

    @Test
    @WithMockUser(roles = "ADMIN_PYME")
    @DisplayName("POST /api/billing/payments rejects invalid payload with validation errors")
    void shouldRejectInvalidPayload() throws Exception {
        String invalidPayload = """
                {
                  "method": "PAGO_MOVIL",
                  "amount": -1,
                  "referenceNumber": "",
                  "paymentDateTime": null,
                  "evidenceUrl": ""
                }
                """;

        mockMvc.perform(post("/api/billing/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors", hasSize(greaterThan(0))));

        verify(paymentSubmissionService, never()).submit(any(CreatePaymentRequest.class));
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    @DisplayName("POST /api/billing/payments rejects SUPER_ADMIN")
    void shouldRejectSuperAdminOnTenantSubmitEndpoint() throws Exception {
        CreatePaymentRequest request = new CreatePaymentRequest(
                PaymentMethod.PAGO_MOVIL,
                new BigDecimal("10.00"),
                "REF-ROLE-001",
                LocalDateTime.now().minusMinutes(5),
                "https://cdn.local/evidence-role.png"
        );

        mockMvc.perform(post("/api/billing/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        verify(paymentSubmissionService, never()).submit(any(CreatePaymentRequest.class));
    }

    @Nested
    @DisplayName("GET /api/billing/payments")
    class ListPayments {

        @Test
        @WithMockUser(roles = "ADMIN_PYME")
        @DisplayName("returns current tenant payments")
        void shouldListCurrentTenantPayments() throws Exception {
            when(paymentQueryService.listCurrentTenantPayments(isNull())).thenReturn(List.of(
                    new PaymentResponse(
                            UUID.randomUUID(),
                            UUID.randomUUID(),
                            PaymentMethod.TRANSFERENCIA,
                            PaymentStatus.PENDING_VALIDATION,
                            new BigDecimal("90.00"),
                            "REF-LIST-1",
                            LocalDateTime.now().minusHours(3),
                            "https://cdn.local/evidence-1.png",
                            LocalDateTime.now().minusHours(2)
                    )
            ));

            mockMvc.perform(get("/api/billing/payments"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].referenceNumber").value("REF-LIST-1"));
        }
    }
}
