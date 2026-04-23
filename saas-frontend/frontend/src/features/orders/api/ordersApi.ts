import { api } from '@/lib/axios'

export type OrderStatus = 'PENDIENTE' | 'EN_PROCESO' | 'ENTREGADO' | 'CANCELADO'

export interface OrderResponse {
    id: string
    trackingCode: string
    status: OrderStatus
    createdAt: string
    updatedAt: string
}

export interface OrderHistoryResponse {
    id: string
    orderId: string
    status: OrderStatus
    changedBy: string
    changedAt: string
    notes?: string
}

export interface ChangeOrderStatusRequest {
    status: OrderStatus
    notes?: string
}

export interface DispatcherTrackingResponse {
    pendingCount: number
    inProgressCount: number
    deliveredCount: number
    orders: OrderResponse[]
}

export const ordersApi = {
    getAll: async () => {
        const response = await api.get<DispatcherTrackingResponse>('/api/logistics/orders/dispatcher-tracking')
        return response.data
    },

    create: async () => {
        const response = await api.post<OrderResponse>('/api/logistics/orders')
        return response.data
    },

    changeStatus: async (id: string, status: OrderStatus, notes?: string) => {
        const response = await api.patch<OrderResponse>(`/api/logistics/orders/${id}/status`, { status, notes })
        return response.data
    },

    getHistory: async (id: string) => {
        const response = await api.get<OrderHistoryResponse[]>(`/api/logistics/orders/${id}/history`)
        return response.data
    },

    getTracking: async () => {
        const response = await api.get<DispatcherTrackingResponse>('/api/logistics/orders/dispatcher-tracking')
        return response.data
    },
}