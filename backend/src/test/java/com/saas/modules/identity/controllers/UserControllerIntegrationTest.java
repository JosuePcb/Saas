package com.saas.modules.identity.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.saas.core.security.JwtService;
import com.saas.modules.identity.dtos.*;
import com.saas.modules.identity.models.UserRole;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
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

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("UserController Integration Tests")
class UserControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("saas_test_users")
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
    private JwtService jwtService;

    private static String accessToken;
    private static String createdUserId;

    @Test
    @Order(1)
    @DisplayName("Setup: Register tenant and get access token")
    void setupRegisterAndLogin() throws Exception {
        // Register a new tenant
        RegisterRequest registerRequest = new RegisterRequest(
                "User Test PYME", "J-77777777-7", "admin@usertestpyme.com",
                "TestPass123!", "+584141234567", "Admin", "User"
        );

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        accessToken = objectMapper.readTree(body).get("accessToken").asText();
    }

    @Test
    @Order(2)
    @DisplayName("POST /api/users - Should create user (201)")
    void shouldCreateUser() throws Exception {
        Assumptions.assumeTrue(accessToken != null);

        CreateUserRequest request = new CreateUserRequest(
                "chofer@testpyme.com", "ChoferPass1!", "Carlos", "López",
                "+584149999999", UserRole.CHOFER
        );

        MvcResult result = mockMvc.perform(post("/api/users")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("chofer@testpyme.com"))
                .andExpect(jsonPath("$.role").value("CHOFER"))
                .andReturn();

        String body = result.getResponse().getContentAsString();
        createdUserId = objectMapper.readTree(body).get("id").asText();
    }

    @Test
    @Order(3)
    @DisplayName("GET /api/users - Should list users (200)")
    void shouldListUsers() throws Exception {
        Assumptions.assumeTrue(accessToken != null);

        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @Order(4)
    @DisplayName("GET /api/users/{id} - Should get user by id (200)")
    void shouldGetUserById() throws Exception {
        Assumptions.assumeTrue(accessToken != null && createdUserId != null);

        mockMvc.perform(get("/api/users/" + createdUserId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("chofer@testpyme.com"));
    }

    @Test
    @Order(5)
    @DisplayName("PUT /api/users/{id} - Should update user (200)")
    void shouldUpdateUser() throws Exception {
        Assumptions.assumeTrue(accessToken != null && createdUserId != null);

        UpdateUserRequest request = new UpdateUserRequest("Carlos Updated", "López Updated", null, null, null);

        mockMvc.perform(put("/api/users/" + createdUserId)
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Carlos Updated"));
    }

    @Test
    @Order(6)
    @DisplayName("GET /api/users - Should reject unauthenticated request (401)")
    void shouldRejectUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(7)
    @DisplayName("DELETE /api/users/{id} - Should delete user (204)")
    void shouldDeleteUser() throws Exception {
        Assumptions.assumeTrue(accessToken != null && createdUserId != null);

        mockMvc.perform(delete("/api/users/" + createdUserId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isNoContent());
    }

    @Test
    @Order(8)
    @DisplayName("GET /api/users - SuperAdmin without tenant should access endpoint (200)")
    void superAdminWithoutTenantShouldAccessUsersEndpoint() throws Exception {
        String superAdminAccessToken = jwtService.generateAccessToken(
                UUID.randomUUID(), "superadmin@saas.com", UserRole.SUPER_ADMIN.name(), null);

        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + superAdminAccessToken))
                .andExpect(status().isOk());
    }
}
