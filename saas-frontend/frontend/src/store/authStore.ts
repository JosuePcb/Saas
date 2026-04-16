import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Role } from '@/types/enums'

interface User {
    id: string
    email: string
    nombre: string
    apellido: string
    role: Role
    tenantId: string | null
}

interface AuthState {
    user: User | null
    accessToken: string | null
    setAuth: (user: User, token: string) => void
    clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            setAuth: (user, accessToken) => set({ user, accessToken }),
            clearAuth: () => set({ user: null, accessToken: null }),
        }),
        { name: 'auth-storage' }
    )
)