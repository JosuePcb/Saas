package com.saas.modules.ai.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ManualAddressCorrectionRequest(
        @NotBlank(message = "Normalized address is required")
        @Size(max = 500, message = "Normalized address must not exceed 500 characters")
        String normalizedAddress,
        @Size(max = 120, message = "Normalized state must not exceed 120 characters")
        String normalizedState,
        @Size(max = 120, message = "Normalized municipio must not exceed 120 characters")
        String normalizedMunicipio,
        @Size(max = 120, message = "Normalized parroquia must not exceed 120 characters")
        String normalizedParroquia,
        @Size(max = 120, message = "Normalized zona must not exceed 120 characters")
        String normalizedZona,
        @Size(max = 500, message = "Normalized referencia must not exceed 500 characters")
        String normalizedReferencia,
        Double normalizedLatitude,
        Double normalizedLongitude
) {
}
