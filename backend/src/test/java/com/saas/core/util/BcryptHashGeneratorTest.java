package com.saas.core.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("BCrypt Hash Generator — used to generate V4 migration hash")
class BcryptHashGeneratorTest {

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);

    @Test
    @DisplayName("Generate and verify SuperAdmin password hash")
    void generateSuperAdminHash() {
        String rawPassword = "SuperAdmin123!";

        // Generate the hash
        String hash = encoder.encode(rawPassword);

        // Print it so we can copy it to the migration
        System.out.println("=== SuperAdmin BCrypt Hash ===");
        System.out.println("Password: " + rawPassword);
        System.out.println("Hash:     " + hash);
        System.out.println("==============================");

        // Verify it works
        assertThat(encoder.matches(rawPassword, hash)).isTrue();
        assertThat(encoder.matches("WrongPassword", hash)).isFalse();
    }
}
