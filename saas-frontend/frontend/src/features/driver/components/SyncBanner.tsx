// src/features/driver/components/SyncBanner.tsx
// Componente TSX - Banner de estado de sincronización

import { WifiOff, RefreshCw, CheckCircle2, CloudUpload } from 'lucide-react'

interface Props {
    isOnline: boolean
    syncing: boolean
    pendingCount: number
}

export default function SyncBanner({ isOnline, syncing, pendingCount }: Props) {
    // Todo correcto — no renderizar nada
    if (isOnline && !syncing && pendingCount === 0) return null

    // Sincronizando en este momento
    if (syncing) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 16px',
                background: 'linear-gradient(90deg,rgba(56,189,248,0.14),rgba(56,189,248,0.07))',
                borderBottom: '1px solid rgba(56,189,248,0.2)',
            }}>
                <style>{`
          @keyframes spin-sync { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        `}</style>
                <RefreshCw
                    size={13}
                    color="#38BDF8"
                    style={{ animation: 'spin-sync 1s linear infinite', flexShrink: 0 }}
                />
                <span style={{ color: '#38BDF8', fontSize: 12, fontWeight: 600 }}>
                    Sincronizando {pendingCount} entrega{pendingCount !== 1 ? 's' : ''} guardada{pendingCount !== 1 ? 's' : ''}…
                </span>
            </div>
        )
    }

    // Online pero aún hay pendientes sin sincronizar
    if (isOnline && pendingCount > 0) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 16px',
                background: 'rgba(16,185,129,0.09)',
                borderBottom: '1px solid rgba(16,185,129,0.18)',
            }}>
                <CheckCircle2 size={13} color="#10b981" style={{ flexShrink: 0 }} />
                <span style={{ color: '#10b981', fontSize: 12, fontWeight: 600 }}>
                    {pendingCount} acción{pendingCount !== 1 ? 'es' : ''} lista{pendingCount !== 1 ? 's' : ''} para sincronizar
                </span>
            </div>
        )
    }

    // Sin conexión
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 16px',
            background: 'rgba(245,158,11,0.1)',
            borderBottom: '1px solid rgba(245,158,11,0.2)',
        }}>
            <WifiOff size={13} color="#f59e0b" style={{ flexShrink: 0 }} />
            <span style={{ color: '#f59e0b', fontSize: 12, fontWeight: 700 }}>Sin conexión</span>
            {pendingCount > 0 && (
                <span style={{ color: 'rgba(245,158,11,0.65)', fontSize: 12, marginLeft: 2 }}>
                    · {pendingCount} acción{pendingCount !== 1 ? 'es' : ''} guardada{pendingCount !== 1 ? 's' : ''} localmente
                </span>
            )}
            <span style={{
                marginLeft: 'auto', fontSize: 10, color: 'rgba(245,158,11,0.6)',
                fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                border: '1px solid rgba(245,158,11,0.3)', flexShrink: 0,
                fontFamily: "'JetBrains Mono', monospace",
            }}>
                OFFLINE
            </span>
        </div>
    )
}