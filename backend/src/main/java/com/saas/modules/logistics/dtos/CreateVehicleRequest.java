package com.saas.modules.logistics.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateVehicleRequest(
        @NotBlank(message = "Plate is required")
        @Size(max = 20, message = "Plate must not exceed 20 characters")
        @Pattern(regexp = "^[A-Za-z0-9-]+$", message = "Plate format is invalid")
        String plate
) {
}
