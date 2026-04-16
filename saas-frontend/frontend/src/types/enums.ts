export enum Role {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN_PYME = 'ADMIN_PYME',
    DESPACHADOR = 'DESPACHADOR',
    CHOFER = 'CHOFER',
}

export enum OrderStatus {
    PENDIENTE = 'PENDIENTE',
    ASIGNADA = 'ASIGNADA',
    EN_RUTA = 'EN_RUTA',
    ENTREGADO = 'ENTREGADO',
    FALLIDO = 'FALLIDO',
    REPROGRAMADA = 'REPROGRAMADA',
}

export enum VehicleStatus {
    DISPONIBLE = 'DISPONIBLE',
    EN_RUTA = 'EN_RUTA',
    MANTENIMIENTO = 'MANTENIMIENTO',
}

export enum TenantStatus {
    TRIAL = 'TRIAL',
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}