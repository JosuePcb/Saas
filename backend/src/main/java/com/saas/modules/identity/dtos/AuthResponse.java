package com.saas.modules.identity.dtos;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        UserResponse user
) {}
