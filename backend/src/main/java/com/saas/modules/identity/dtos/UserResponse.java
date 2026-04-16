package com.saas.modules.identity.dtos;

import com.saas.modules.identity.models.UserRole;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String nombre,
        String apellido,
        UserRole role,
        Boolean activo
) {}
