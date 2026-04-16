package com.saas.core.exceptions;

import org.springframework.http.HttpStatus;

/**
 * Thrown when a requested resource is not found. Maps to HTTP 404.
 */
public class ResourceNotFoundException extends BusinessException {

    public ResourceNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }

    public ResourceNotFoundException(String entity, String field, Object value) {
        super(String.format("%s not found with %s: %s", entity, field, value), HttpStatus.NOT_FOUND);
    }
}
