import { api } from '@/lib/axios'
import { Role } from '@/types/enums'

export interface UserResponse {
    id: string
    email: string
    nombre: string
    apellido: string
    role: Role
    activo: boolean
    tenantId?: string
}

export interface AuthResponse {
    accessToken: string
    refreshToken: string
    user: UserResponse
}

export interface LoginRequest {
    email: string
    password: string
}

export interface RegisterRequest {
    email: string
    password: string
    nombre: string
    apellido: string
    tenantName: string
    phone?: string
}

export interface RefreshRequest {
    refreshToken: string
}

export const authApi = {
    login: async (data: LoginRequest) => {
        const response = await api.post<AuthResponse>('/api/auth/login', data)
        return response.data
    },

    register: async (data: RegisterRequest) => {
        const response = await api.post<AuthResponse>('/api/auth/register', data)
        return response.data
    },

    refresh: async (refreshToken: string) => {
        const response = await api.post<AuthResponse>('/api/auth/refresh', { refreshToken })
        return response.data
    },
}