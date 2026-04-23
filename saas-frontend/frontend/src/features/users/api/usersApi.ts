import { api } from '@/lib/axios'
import { UserResponse } from '@/features/auth/api/authApi'

export interface CreateUserRequest {
    email: string
    password: string
    nombre: string
    apellido: string
    role: string
    phone?: string
}

export interface UpdateUserRequest {
    nombre?: string
    apellido?: string
    email?: string
    phone?: string
    activo?: boolean
}

export const usersApi = {
    getAll: async () => {
        const response = await api.get<UserResponse[]>('/api/users')
        return response.data
    },

    getById: async (id: string) => {
        const response = await api.get<UserResponse>(`/api/users/${id}`)
        return response.data
    },

    create: async (data: CreateUserRequest) => {
        const response = await api.post<UserResponse>('/api/users', data)
        return response.data
    },

    update: async (id: string, data: UpdateUserRequest) => {
        const response = await api.put<UserResponse>(`/api/users/${id}`, data)
        return response.data
    },

    delete: async (id: string) => {
        await api.delete(`/api/users/${id}`)
    },
}