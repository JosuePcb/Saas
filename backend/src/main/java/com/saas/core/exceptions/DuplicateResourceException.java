package com.saas.core.exceptions;

import org.springframework.http.HttpStatus;

/**
 * Thrown when trying to create a resource that already exists. Maps to HTTP 409.
 */
public class DuplicateResourceException extends BusinessException {

    public DuplicateResourceException(String message) {
        super(message, HttpStatus.CONFLICT);
    }
}
