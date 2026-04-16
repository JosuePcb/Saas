package com.saas.modules.logistics.models;

public enum OrderStatus {
    CREATED,
    ASSIGNED,
    IN_TRANSIT,
    DELIVERED,
    CANCELLED;

    public boolean canTransitionTo(OrderStatus nextStatus) {
        if (nextStatus == null || this == nextStatus) {
            return false;
        }

        return switch (this) {
            case CREATED -> nextStatus == ASSIGNED || nextStatus == CANCELLED;
            case ASSIGNED -> nextStatus == IN_TRANSIT || nextStatus == CANCELLED;
            case IN_TRANSIT -> nextStatus == DELIVERED || nextStatus == CANCELLED;
            case DELIVERED, CANCELLED -> false;
        };
    }
}
