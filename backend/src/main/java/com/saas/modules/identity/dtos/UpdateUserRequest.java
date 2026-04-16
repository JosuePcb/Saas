package com.saas.modules.identity.dtos;

import com.saas.modules.identity.models.UserRole;

public record UpdateUserRequest(
        String nombre,
        String apellido,
        String telefono,
        UserRole role,
        Boolean activo
) {}
