// src/features/driver/hooks/useOfflineSync.ts
// Sincroniza automáticamente las acciones guardadas al reconectar

import { useEffect, useRef, useState, useCallback } from 'react'
import { useOnlineStatus } from './useOnlineStatus'
import { offlineService } from '../services/offline.service'
import { api } from '@/lib/axios'

export interface SyncState {
    isOnline: boolean
    syncing: boolean
    pendingCount: number
    lastSyncedAt: Date | null
    syncPending: () => Promise<void>
    refreshPendingCount: () => Promise<void>
}

export function useOfflineSync(): SyncState {
    const isOnline = useOnlineStatus()
    const [syncing, setSyncing] = useState(false)
    const [pendingCount, setPendingCount] = useState(0)
    const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)
    const prevOnlineRef = useRef(isOnline)
    const syncingRef = useRef(false)

    const refreshPendingCount = useCallback(async () => {
        const count = await offlineService.countPending()
        setPendingCount(count)
    }, [])

    const syncPending = useCallback(async () => {
        if (syncingRef.current) return
        const actions = await offlineService.getPendingActions()
        if (actions.length === 0) return

        syncingRef.current = true
        setSyncing(true)

        let allOk = true
        for (const action of actions) {
            try {
                await api.post(`/driver/stops/${action.stopId}/action`, {
                    type: action.type,
                    receiverName: action.receiverName,
                    notes: action.notes,
                    photoBase64: action.photoBase64,
                    deviceTimestamp: action.timestamp,
                })
                await offlineService.markSynced(action.id)
            } catch (err) {
                console.error('[OfflineSync] Fallo sincronizando acción:', action.id, err)
                allOk = false
                break
            }
        }

        if (allOk) {
            await offlineService.clearSynced()
            setLastSyncedAt(new Date())
        }

        await refreshPendingCount()
        setSyncing(false)
        syncingRef.current = false
    }, [refreshPendingCount])

    // Carga el contador inicial
    useEffect(() => { refreshPendingCount() }, [refreshPendingCount])

    // Auto-sync al reconectar (con delay de 1.5s para esperar conexión estable)
    useEffect(() => {
        if (!prevOnlineRef.current && isOnline) {
            const t = setTimeout(() => { syncPending() }, 1500)
            return () => clearTimeout(t)
        }
        prevOnlineRef.current = isOnline
    }, [isOnline, syncPending])

    return { isOnline, syncing, pendingCount, lastSyncedAt, syncPending, refreshPendingCount }
}