package com.saas.modules.logistics.dtos;

public record RouteSyncUploadResponse(
        int processedEvents,
        int acceptedEvents,
        int duplicateEvents,
        int conflictEvents
) {
}
