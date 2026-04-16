package com.saas.modules.identity.dtos;

import com.saas.modules.identity.models.UserRole;
import jakarta.validation.constraints.*;

public record CreateUserRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Must be a valid email address")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
        String password,

        @NotBlank(message = "First name is required")
        String nombre,

        @NotBlank(message = "Last name is required")
        String apellido,

        String telefono,

        @NotNull(message = "Role is required")
        UserRole role
) {}
