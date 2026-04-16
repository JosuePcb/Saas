package com.saas.core.exceptions;

import org.springframework.http.HttpStatus;

/**
 * Thrown when a tenant is suspended and cannot perform operations. Maps to HTTP 403.
 */
public class TenantSuspendedException extends BusinessException {

    public TenantSuspendedException() {
        super("Tenant suspended", HttpStatus.FORBIDDEN);
    }

    public TenantSuspendedException(String message) {
        super(message, HttpStatus.FORBIDDEN);
    }
}
