import { api } from '@/lib/axios'

export type RouteStatus = 'PENDIENTE' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA'

export interface RouteResponse {
    id: string
    vehicleId: string
    status: RouteStatus
    optimizedByAi: boolean
    estimatedDistanceKm: number
    orderIds: string[]
    createdAt: string
    updatedAt: string
}

export interface CreateRouteRequest {
    vehicleId?: string
    orderIds?: string[]
}

export interface DriverAssignedRouteResponse {
    id: string
    status: RouteStatus
    estimatedDistanceKm: number
    stops: DriverAssignedStopResponse[]
    startedAt?: string
}

export interface DriverAssignedStopResponse {
    id: string
    orderId: string
    sequence: number
    address: string
    status: string
    estimatedArrival?: string
}

export const routesApi = {
    getAll: async () => {
        const response = await api.get<RouteResponse[]>('/api/logistics/routes')
        return response.data
    },

    getById: async (id: string) => {
        const response = await api.get<RouteResponse>(`/api/logistics/routes/${id}`)
        return response.data
    },

    create: async (data: CreateRouteRequest) => {
        const response = await api.post<RouteResponse>('/api/logistics/routes', data)
        return response.data
    },

    start: async (id: string) => {
        const response = await api.post<RouteResponse>(`/api/logistics/routes/${id}/start`)
        return response.data
    },

    complete: async (id: string) => {
        const response = await api.post<RouteResponse>(`/api/logistics/routes/${id}/complete`)
        return response.data
    },

    getAssigned: async () => {
        const response = await api.get<DriverAssignedRouteResponse[]>('/api/logistics/routes/assigned')
        return response.data
    },

    startByDriver: async (id: string) => {
        const response = await api.post<RouteResponse>(`/api/logistics/routes/${id}/driver-start`)
        return response.data
    },

    completeByDriver: async (id: string) => {
        const response = await api.post<RouteResponse>(`/api/logistics/routes/${id}/driver-complete`)
        return response.data
    },
}