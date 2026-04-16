package com.saas.modules.identity.services;

import com.saas.core.exceptions.BusinessException;
import com.saas.modules.identity.models.RefreshToken;
import com.saas.modules.identity.models.User;
import com.saas.modules.identity.models.UserRole;
import com.saas.modules.identity.repositories.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RefreshTokenService Unit Tests")
class RefreshTokenServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    private RefreshTokenService refreshTokenService;

    private User testUser;

    @BeforeEach
    void setUp() {
        refreshTokenService = new RefreshTokenService(refreshTokenRepository, 604800000L);
        testUser = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .role(UserRole.ADMIN_PYME)
                .tenantId(UUID.randomUUID())
                .activo(true)
                .build();
    }

    @Test
    @DisplayName("Should create a new refresh token")
    void shouldCreateNewRefreshToken() {
        when(refreshTokenRepository.save(any(RefreshToken.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        RefreshTokenService.TokenPair pair = refreshTokenService.createRefreshToken(testUser);

        assertThat(pair.rawToken()).isNotNull().isNotEmpty();
        assertThat(pair.refreshToken()).isNotNull();
        assertThat(pair.refreshToken().getUser()).isEqualTo(testUser);
        assertThat(pair.refreshToken().getRevoked()).isFalse();
        assertThat(pair.refreshToken().getExpiresAt()).isAfter(LocalDateTime.now());

        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("Should validate a valid token")
    void shouldValidateValidToken() {
        when(refreshTokenRepository.save(any(RefreshToken.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        RefreshTokenService.TokenPair pair = refreshTokenService.createRefreshToken(testUser);

        // Capture the saved token hash
        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(captor.capture());
        RefreshToken savedToken = captor.getValue();

        when(refreshTokenRepository.findByTokenHash(savedToken.getTokenHash()))
                .thenReturn(Optional.of(savedToken));

        RefreshToken result = refreshTokenService.validateRefreshToken(pair.rawToken());

        assertThat(result).isNotNull();
        assertThat(result.getUser()).isEqualTo(testUser);
    }

    @Test
    @DisplayName("Should reject an expired token")
    void shouldRejectExpiredToken() {
        RefreshToken expiredToken = RefreshToken.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .tokenHash("somehash")
                .expiresAt(LocalDateTime.now().minusDays(1))
                .revoked(false)
                .build();

        when(refreshTokenRepository.findByTokenHash(any()))
                .thenReturn(Optional.of(expiredToken));

        assertThatThrownBy(() -> refreshTokenService.validateRefreshToken("somerawtoken"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("expired");
    }

    @Test
    @DisplayName("Should reject a revoked token")
    void shouldRejectRevokedToken() {
        RefreshToken revokedToken = RefreshToken.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .tokenHash("somehash")
                .expiresAt(LocalDateTime.now().plusDays(7))
                .revoked(true)
                .build();

        when(refreshTokenRepository.findByTokenHash(any()))
                .thenReturn(Optional.of(revokedToken));

        assertThatThrownBy(() -> refreshTokenService.validateRefreshToken("somerawtoken"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("reused");

        // Reuse detection: should revoke ALL tokens for the user
        verify(refreshTokenRepository).revokeAllByUser(testUser);
    }

    @Test
    @DisplayName("Should rotate token - revoke old and create new")
    void shouldRotateToken() {
        RefreshToken oldToken = RefreshToken.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .tokenHash("oldhash")
                .expiresAt(LocalDateTime.now().plusDays(7))
                .revoked(false)
                .build();

        when(refreshTokenRepository.save(any(RefreshToken.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        RefreshTokenService.TokenPair newPair = refreshTokenService.rotateRefreshToken(oldToken);

        assertThat(oldToken.getRevoked()).isTrue();
        assertThat(newPair.rawToken()).isNotNull();
        assertThat(newPair.refreshToken()).isNotNull();

        // Save called twice: once for revoking old, once for creating new
        verify(refreshTokenRepository, times(2)).save(any(RefreshToken.class));
    }
}
