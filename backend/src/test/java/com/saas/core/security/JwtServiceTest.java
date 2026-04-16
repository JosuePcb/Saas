package com.saas.core.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("JwtService Unit Tests")
class JwtServiceTest {

    private JwtService jwtService;

    // Base64 encoded secret (at least 256 bits for HS256)
    private static final String TEST_SECRET = "dGVzdC1qd3Qtc2VjcmV0LWtleS1mb3ItdW5pdC10ZXN0cy1vbmx5LXZlcnktbG9uZy1hbmQtc2VjdXJl";
    private static final long ACCESS_TOKEN_EXPIRATION = 900000L; // 15 min

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(TEST_SECRET, ACCESS_TOKEN_EXPIRATION);
    }

    @Test
    @DisplayName("Should generate a valid JWT token")
    void shouldGenerateValidToken() {
        UUID userId = UUID.randomUUID();
        UUID tenantId = UUID.randomUUID();

        String token = jwtService.generateAccessToken(userId, "test@example.com", "ADMIN_PYME", tenantId);

        assertThat(token).isNotNull().isNotEmpty();
        assertThat(jwtService.validateToken(token)).isTrue();
    }

    @Test
    @DisplayName("Should extract userId from token")
    void shouldExtractUserId() {
        UUID userId = UUID.randomUUID();
        UUID tenantId = UUID.randomUUID();

        String token = jwtService.generateAccessToken(userId, "test@example.com", "ADMIN_PYME", tenantId);

        assertThat(jwtService.extractUserId(token)).isEqualTo(userId);
    }

    @Test
    @DisplayName("Should extract email from token")
    void shouldExtractEmail() {
        UUID userId = UUID.randomUUID();
        UUID tenantId = UUID.randomUUID();

        String token = jwtService.generateAccessToken(userId, "test@example.com", "ADMIN_PYME", tenantId);

        assertThat(jwtService.extractEmail(token)).isEqualTo("test@example.com");
    }

    @Test
    @DisplayName("Should extract role from token")
    void shouldExtractRole() {
        UUID userId = UUID.randomUUID();
        UUID tenantId = UUID.randomUUID();

        String token = jwtService.generateAccessToken(userId, "test@example.com", "ADMIN_PYME", tenantId);

        assertThat(jwtService.extractRole(token)).isEqualTo("ADMIN_PYME");
    }

    @Test
    @DisplayName("Should extract tenantId from token")
    void shouldExtractTenantId() {
        UUID userId = UUID.randomUUID();
        UUID tenantId = UUID.randomUUID();

        String token = jwtService.generateAccessToken(userId, "test@example.com", "ADMIN_PYME", tenantId);

        assertThat(jwtService.extractTenantId(token)).isEqualTo(tenantId);
    }

    @Test
    @DisplayName("Should return null tenantId for SuperAdmin (no tenant)")
    void shouldReturnNullTenantIdForSuperAdmin() {
        UUID userId = UUID.randomUUID();

        String token = jwtService.generateAccessToken(userId, "super@admin.com", "SUPER_ADMIN", null);

        assertThat(jwtService.extractTenantId(token)).isNull();
    }

    @Test
    @DisplayName("Should reject expired token")
    void shouldRejectExpiredToken() {
        // Create service with 0ms expiration to generate expired token
        JwtService expiredService = new JwtService(TEST_SECRET, 0L);
        UUID userId = UUID.randomUUID();

        String token = expiredService.generateAccessToken(userId, "test@example.com", "ADMIN_PYME", UUID.randomUUID());

        assertThat(jwtService.validateToken(token)).isFalse();
    }

    @Test
    @DisplayName("Should reject malformed token")
    void shouldRejectMalformedToken() {
        assertThat(jwtService.validateToken("invalid.token.here")).isFalse();
    }

    @Test
    @DisplayName("Should reject null token")
    void shouldRejectNullToken() {
        assertThat(jwtService.validateToken(null)).isFalse();
    }

    @Test
    @DisplayName("Should reject empty token")
    void shouldRejectEmptyToken() {
        assertThat(jwtService.validateToken("")).isFalse();
    }
}
