import { api } from '@/lib/axios'

export interface VehicleResponse {
    id: string
    plate: string
    active: boolean
    createdAt: string
    updatedAt: string
}

export interface CreateVehicleRequest {
    plate: string
}

export interface UpdateVehicleRequest {
    plate?: string
    active?: boolean
}

export const vehiclesApi = {
    getAll: async () => {
        const response = await api.get<VehicleResponse[]>('/api/logistics/vehicles')
        return response.data
    },

    getById: async (id: string) => {
        const response = await api.get<VehicleResponse>(`/api/logistics/vehicles/${id}`)
        return response.data
    },

    create: async (data: CreateVehicleRequest) => {
        const response = await api.post<VehicleResponse>('/api/logistics/vehicles', data)
        return response.data
    },

    update: async (id: string, data: UpdateVehicleRequest) => {
        const response = await api.put<VehicleResponse>(`/api/logistics/vehicles/${id}`, data)
        return response.data
    },

    delete: async (id: string) => {
        await api.delete(`/api/logistics/vehicles/${id}`)
    },
}