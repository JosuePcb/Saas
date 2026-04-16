package com.saas.modules.identity.dtos;

import jakarta.validation.constraints.*;

/**
 * DTO for tenant + admin user registration.
 */
public record RegisterRequest(
        @NotBlank(message = "Company name is required")
        @Size(min = 2, max = 200, message = "Company name must be between 2 and 200 characters")
        String nombreEmpresa,

        @NotBlank(message = "RIF is required")
        @Pattern(regexp = "^[JVGEP]-\\d{8}-\\d$", message = "RIF must follow format: J-12345678-9")
        String rif,

        @NotBlank(message = "Email is required")
        @Email(message = "Must be a valid email address")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
        String password,

        @NotBlank(message = "Phone is required")
        @Pattern(regexp = "^\\+58\\d{10}$", message = "Phone must follow format: +584141234567")
        String telefono,

        @NotBlank(message = "First name is required")
        String nombre,

        @NotBlank(message = "Last name is required")
        String apellido
) {}
