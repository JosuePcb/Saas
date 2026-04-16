package com.saas.modules.identity.services;

import com.saas.core.exceptions.BusinessException;
import com.saas.modules.identity.models.RefreshToken;
import com.saas.modules.identity.models.User;
import com.saas.modules.identity.repositories.RefreshTokenRepository;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.UUID;

/**
 * Manages refresh token lifecycle: creation, validation, rotation, and revocation.
 * Stores SHA-256 hash of the raw token (never the raw value).
 */
@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final long refreshTokenExpirationMs;

    public RefreshTokenService(
            RefreshTokenRepository refreshTokenRepository,
            @Value("${app.jwt.refresh-token-expiration-ms}") long refreshTokenExpirationMs) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    /**
     * Creates a new refresh token for the given user.
     * Returns both the raw token (to send to client) and the persisted entity.
     */
    @Transactional
    public TokenPair createRefreshToken(User user) {
        String rawToken = UUID.randomUUID().toString();
        String tokenHash = hashToken(rawToken);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpirationMs / 1000))
                .revoked(false)
                .build();

        refreshTokenRepository.save(refreshToken);

        return new TokenPair(rawToken, refreshToken);
    }

    /**
     * Validates a raw refresh token.
     * If the token is revoked (reuse detected), revokes ALL tokens for that user.
     *
     * @throws BusinessException if token is invalid, expired, or revoked
     */
    @Transactional
    public RefreshToken validateRefreshToken(String rawToken) {
        String tokenHash = hashToken(rawToken);

        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BusinessException("Invalid refresh token", HttpStatus.UNAUTHORIZED));

        // Reuse detection: if token was already revoked, someone is reusing it
        if (refreshToken.getRevoked()) {
            // Security breach: revoke ALL tokens for this user
            refreshTokenRepository.revokeAllByUser(refreshToken.getUser());
            throw new BusinessException("Refresh token reused; all sessions revoked", HttpStatus.UNAUTHORIZED);
        }

        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Refresh token expired", HttpStatus.UNAUTHORIZED);
        }

        return refreshToken;
    }

    /**
     * Rotates a refresh token: revokes the old one and creates a new one.
     */
    @Transactional
    public TokenPair rotateRefreshToken(RefreshToken oldToken) {
        // Revoke the old token
        oldToken.setRevoked(true);
        refreshTokenRepository.save(oldToken);

        // Create a new one
        return createRefreshToken(oldToken.getUser());
    }

    /**
     * SHA-256 hash of the raw token for secure storage.
     */
    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    /**
     * Pair of raw token (for client) and persisted entity (for server).
     */
    public record TokenPair(String rawToken, RefreshToken refreshToken) {}
}
