// src/features/driver/services/offline.service.ts
// Servicio de IndexedDB para funcionalidad offline del chofer
// Requiere: idb  →  npm install idb

import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface PendingAction {
    id: string
    stopId: string
    type: 'COMPLETE' | 'FAIL'
    timestamp: number           // Unix ms del dispositivo (last-write-wins)
    receiverName?: string
    notes?: string
    photoBase64?: string        // Foto PoD comprimida (max 500 KB)
    synced: boolean
}

export interface CachedStop {
    id: string
    stopNumber: number
    trackingCode: string
    status: 'PENDIENTE' | 'EN_RUTA' | 'ENTREGADO' | 'FALLIDO'
    clientName: string
    clientPhone: string
    address: string
    addressNotes?: string
    lat?: number
    lng?: number
    packageWeight?: number
    packageVolume?: string
    packageNotes?: string
    estimatedTime?: string
    completedAt?: string
    receiverName?: string
    podPhotoUrl?: string
}

// ── Schema de la BD ────────────────────────────────────────────────────────

interface DriverDB extends DBSchema {
    pendingActions: { key: string; value: PendingAction }
    cachedStops: { key: string; value: CachedStop }
}

// ── Singleton ──────────────────────────────────────────────────────────────

let _db: IDBPDatabase<DriverDB> | null = null

async function getDB(): Promise<IDBPDatabase<DriverDB>> {
    if (!_db) {
        _db = await openDB<DriverDB>('logipyme-driver-v1', 1, {
            upgrade(database) {
                if (!database.objectStoreNames.contains('pendingActions'))
                    database.createObjectStore('pendingActions', { keyPath: 'id' })
                if (!database.objectStoreNames.contains('cachedStops'))
                    database.createObjectStore('cachedStops', { keyPath: 'id' })
            },
        })
    }
    return _db
}

// ── API del servicio ───────────────────────────────────────────────────────

export const offlineService = {

    async saveAction(action: Omit<PendingAction, 'id' | 'synced'>): Promise<string> {
        const db = await getDB()
        const id = `action-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        await db.put('pendingActions', { ...action, id, synced: false })
        return id
    },

    async getPendingActions(): Promise<PendingAction[]> {
        const db = await getDB()
        const all = await db.getAll('pendingActions')
        return all.filter(a => !a.synced).sort((a, b) => a.timestamp - b.timestamp)
    },

    async markSynced(id: string): Promise<void> {
        const db = await getDB()
        const action = await db.get('pendingActions', id)
        if (action) await db.put('pendingActions', { ...action, synced: true })
    },

    async clearSynced(): Promise<void> {
        const db = await getDB()
        const all = await db.getAll('pendingActions')
        const tx = db.transaction('pendingActions', 'readwrite')
        for (const a of all.filter(a => a.synced)) tx.store.delete(a.id)
        await tx.done
    },

    async cacheStops(stops: CachedStop[]): Promise<void> {
        const db = await getDB()
        const tx = db.transaction('cachedStops', 'readwrite')
        await tx.store.clear()
        for (const s of stops) await tx.store.put(s)
        await tx.done
    },

    async updateCachedStop(id: string, patch: Partial<CachedStop>): Promise<void> {
        const db = await getDB()
        const stop = await db.get('cachedStops', id)
        if (stop) await db.put('cachedStops', { ...stop, ...patch })
    },

    async getCachedStops(): Promise<CachedStop[]> {
        const db = await getDB()
        const stops = await db.getAll('cachedStops')
        return stops.sort((a, b) => a.stopNumber - b.stopNumber)
    },

    async getCachedStop(id: string): Promise<CachedStop | undefined> {
        const db = await getDB()
        return db.get('cachedStops', id)
    },

    async countPending(): Promise<number> {
        return (await offlineService.getPendingActions()).length
    },
}