package com.saas.modules.identity.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.saas.modules.identity.dtos.LoginRequest;
import com.saas.modules.identity.dtos.RefreshRequest;
import com.saas.modules.identity.dtos.RegisterRequest;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Base64;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("AuthController Integration Tests")
class AuthControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("saas_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static String refreshToken;
    private static String rotatedRefreshToken;

    @Test
    @Order(1)
    @DisplayName("POST /api/auth/register - Should register tenant successfully (201)")
    void shouldRegisterSuccessfully() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Test PYME", "J-99999999-9", "admin@testpyme.com",
                "TestPass123!", "+584141234567", "Juan", "Pérez"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("admin@testpyme.com"))
                .andExpect(jsonPath("$.user.role").value("ADMIN_PYME"));
    }

    @Test
    @Order(2)
    @DisplayName("POST /api/auth/register - Should reject duplicate RIF (409)")
    void shouldRejectDuplicateRif() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Another PYME", "J-99999999-9", "other@testpyme.com",
                "TestPass123!", "+584142345678", "Pedro", "García"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("RIF already registered"));
    }

    @Test
    @Order(3)
    @DisplayName("POST /api/auth/register - Should reject duplicate email (409)")
    void shouldRejectDuplicateEmail() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Yet Another PYME", "J-88888888-8", "admin@testpyme.com",
                "TestPass123!", "+584143456789", "María", "López"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Email already registered"));
    }

    @Test
    @Order(4)
    @DisplayName("POST /api/auth/register - Should reject invalid data (400)")
    void shouldRejectInvalidData() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "", "invalid-rif", "not-an-email", "short", "123", "", ""
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors").isArray())
                .andExpect(jsonPath("$.fieldErrors", hasSize(greaterThan(0))));
    }

    @Test
    @Order(5)
    @DisplayName("POST /api/auth/login - Should login successfully (200)")
    void shouldLoginSuccessfully() throws Exception {
        LoginRequest request = new LoginRequest("admin@testpyme.com", "TestPass123!");

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andReturn();

        // Save refresh token for next test
        String body = result.getResponse().getContentAsString();
        refreshToken = objectMapper.readTree(body).get("refreshToken").asText();
    }

    @Test
    @Order(6)
    @DisplayName("POST /api/auth/login - Should reject invalid credentials (401)")
    void shouldRejectInvalidCredentials() throws Exception {
        LoginRequest request = new LoginRequest("admin@testpyme.com", "WrongPassword!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid credentials"));
    }

    @Test
    @Order(7)
    @DisplayName("POST /api/auth/refresh - Should refresh token successfully (200)")
    void shouldRefreshTokenSuccessfully() throws Exception {
        Assumptions.assumeTrue(refreshToken != null, "Refresh token from login test required");

        RefreshRequest request = new RefreshRequest(refreshToken);

        MvcResult result = mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        rotatedRefreshToken = objectMapper.readTree(body).get("refreshToken").asText();
    }

    @Test
    @Order(8)
    @DisplayName("POST /api/auth/refresh - Should reject reused refresh token (401)")
    void shouldRejectReusedRefreshToken() throws Exception {
        Assumptions.assumeTrue(refreshToken != null, "Refresh token from login test required");

        // This token was already used in the previous test (rotated)
        RefreshRequest request = new RefreshRequest(refreshToken);

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Refresh token reused; all sessions revoked"));
    }

    @Test
    @Order(9)
    @DisplayName("POST /api/auth/refresh - Should reject invalid refresh token (401)")
    void shouldRejectInvalidRefreshToken() throws Exception {
        RefreshRequest request = new RefreshRequest("not-a-valid-refresh-token");

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Invalid refresh token"));
    }

    @Test
    @Order(10)
    @DisplayName("POST /api/auth/refresh - Should reject expired refresh token (401)")
    void shouldRejectExpiredRefreshToken() throws Exception {
        Assumptions.assumeTrue(rotatedRefreshToken != null, "Rotated refresh token required");

        String tokenHash = hashToken(rotatedRefreshToken);
        jdbcTemplate.update("UPDATE refresh_tokens SET expires_at = ? WHERE token_hash = ?",
                LocalDateTime.now().minusMinutes(5), tokenHash);

        RefreshRequest request = new RefreshRequest(rotatedRefreshToken);

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Refresh token expired"));
    }

    private static String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
