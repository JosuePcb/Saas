// src/features/driver/pages/StopDetailPage.tsx
// Detalle de una parada: datos del cliente, captura PoD, marcar entregado/fallido

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft, Phone, MapPin, Package, Camera, X, CheckCircle2,
    XCircle, User, FileText, AlertTriangle, Navigation,
} from 'lucide-react'
import { api } from '@/lib/axios'
import { offlineService, type CachedStop } from '../services/offline.service'
import { MOCK_STOPS } from '../services/mock.data'
import { useOfflineSync } from '../hooks/useOfflineSync'
import SyncBanner from '../components/SyncBanner'

// ── Paleta del chofer ─────────────────────────────────────────────────────
const PRIMARY = '#38BDF8'
const SEC = '#7DD3FC'
const GREEN = '#10b981'
const AMBER = '#f59e0b'
const PINK = '#EC4899'
const RED = '#ef4444'
const TEXT = '#e0f2fe'
const TEXT_SUB = 'rgba(148,212,252,0.5)'
const BORDER = 'rgba(56,189,248,0.12)'
const CARD = '#0c2236'
const APP_BG = '#071828'
const F = "'Plus Jakarta Sans', sans-serif"
const MONO = "'JetBrains Mono', monospace"

// ── Helper: comprimir imagen a max 500 KB con canvas ─────────────────────
async function compressImage(file: File, maxKB = 500): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = reject
        reader.onload = (e) => {
            const img = new Image()
            img.onerror = reject
            img.onload = () => {
                const canvas = document.createElement('canvas')
                const maxDim = 1280
                let { width, height } = img

                // Escalar si supera dimensión máxima
                if (width > maxDim || height > maxDim) {
                    if (width > height) { height = (height / width) * maxDim; width = maxDim }
                    else { width = (width / height) * maxDim; height = maxDim }
                }
                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext('2d')!
                ctx.drawImage(img, 0, 0, width, height)

                // Reducir calidad hasta que quepa en maxKB
                let q = 0.82
                let b64 = canvas.toDataURL('image/jpeg', q)
                while (b64.length > maxKB * 1024 * 1.37 && q > 0.2) {
                    q -= 0.1
                    b64 = canvas.toDataURL('image/jpeg', q)
                }
                resolve(b64)
            }
            img.src = e.target?.result as string
        }
        reader.readAsDataURL(file)
    })
}

// ── Chips de estado ───────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
    PENDIENTE: { label: 'Pendiente', color: AMBER, bg: 'rgba(245,158,11,0.12)' },
    EN_RUTA: { label: 'En ruta', color: PRIMARY, bg: 'rgba(56,189,248,0.12)' },
    ENTREGADO: { label: 'Entregado', color: GREEN, bg: 'rgba(16,185,129,0.12)' },
    FALLIDO: { label: 'Fallido', color: PINK, bg: 'rgba(236,72,153,0.12)' },
}

// ── Modal de entrega fallida ──────────────────────────────────────────────
interface FailModalProps {
    onConfirm: (reason: string) => void
    onClose: () => void
    loading: boolean
}

function FailModal({ onConfirm, onClose, loading }: FailModalProps) {
    const [reason, setReason] = useState('')

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            padding: '0 0 env(safe-area-inset-bottom)',
            fontFamily: F,
        }}>
            <div style={{
                width: '100%', maxWidth: 480,
                background: CARD, borderRadius: '20px 20px 0 0',
                padding: '24px 20px',
                border: `1px solid ${BORDER}`,
                animation: 'slide-up-modal 0.25s cubic-bezier(0.4,0,0.2,1)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(236,72,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AlertTriangle size={18} color={PINK} />
                    </div>
                    <div>
                        <p style={{ color: TEXT, fontSize: 16, fontWeight: 700, margin: 0 }}>Marcar como fallido</p>
                        <p style={{ color: TEXT_SUB, fontSize: 12, margin: '2px 0 0' }}>Indica el motivo de la no entrega</p>
                    </div>
                    <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SUB, padding: 4 }}>
                        <X size={18} />
                    </button>
                </div>

                <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Ej: Cliente ausente, dirección incorrecta, acceso bloqueado…"
                    rows={3}
                    style={{
                        width: '100%', boxSizing: 'border-box',
                        background: 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${reason ? `${PINK}50` : 'rgba(56,189,248,0.15)'}`,
                        borderRadius: 12, padding: '12px 14px',
                        color: TEXT, fontSize: 14, fontFamily: F,
                        resize: 'none', outline: 'none',
                        transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor = `${PINK}80`}
                    onBlur={e => e.target.style.borderColor = reason ? `${PINK}50` : 'rgba(56,189,248,0.15)'}
                />

                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1, height: 46, borderRadius: 12,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: TEXT_SUB, fontSize: 14, fontWeight: 600,
                            cursor: 'pointer', fontFamily: F,
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => reason.trim() && onConfirm(reason.trim())}
                        disabled={!reason.trim() || loading}
                        style={{
                            flex: 2, height: 46, borderRadius: 12,
                            background: reason.trim() ? 'rgba(236,72,153,0.15)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${reason.trim() ? `${PINK}50` : 'rgba(255,255,255,0.06)'}`,
                            color: reason.trim() ? PINK : 'rgba(255,255,255,0.2)',
                            fontSize: 14, fontWeight: 700,
                            cursor: reason.trim() ? 'pointer' : 'not-allowed',
                            fontFamily: F, transition: 'all 0.15s ease',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}
                    >
                        <XCircle size={16} />
                        {loading ? 'Guardando…' : 'Confirmar fallo'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── InfoCard genérica ─────────────────────────────────────────────────────
function InfoCard({ children }: { children: React.ReactNode }) {
    return (
        <div style={{
            background: CARD, borderRadius: 14,
            border: `1px solid ${BORDER}`,
            padding: '14px 16px',
            display: 'flex', flexDirection: 'column', gap: 10,
        }}>
            {children}
        </div>
    )
}

function InfoRow({ icon, label, value, accent = false }: {
    icon: React.ReactNode; label: string; value: string; accent?: boolean
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                background: 'rgba(56,189,248,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                {icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: TEXT_SUB, fontSize: 10, fontWeight: 600, margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {label}
                </p>
                <p style={{
                    color: accent ? PRIMARY : TEXT, fontSize: 14, fontWeight: 600,
                    margin: '2px 0 0', lineHeight: 1.4, wordBreak: 'break-word',
                }}>
                    {value}
                </p>
            </div>
        </div>
    )
}

// ── Página principal ──────────────────────────────────────────────────────
export default function StopDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const sync = useOfflineSync()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [stop, setStop] = useState<CachedStop | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [photoBase64, setPhotoBase64] = useState<string | null>(null)
    const [receiverName, setReceiverName] = useState('')
    const [showFail, setShowFail] = useState(false)
    const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

    // ── Carga de la parada ──────────────────────────────────────────────────
    useEffect(() => {
        if (!id) return
            ; (async () => {
                setLoading(true)
                try {
                    const { data } = await api.get<CachedStop>(`/driver/stops/${id}`)
                    setStop(data)
                    await offlineService.updateCachedStop(id, data) // Refrescar cache
                } catch {
                    // Sin backend, buscar en cache o en datos de demo
                    const cached = await offlineService.getCachedStop(id)
                    if (cached) setStop(cached)
                    else {
                        const mock = MOCK_STOPS.find(s => s.id === id)
                        if (mock) setStop(mock)
                    }
                } finally {
                    setLoading(false)
                }
            })()
    }, [id])

    // ── Captura de foto ─────────────────────────────────────────────────────
    const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            const compressed = await compressImage(file)
            setPhotoBase64(compressed)
        } catch {
            showToast('Error al procesar la foto', 'err')
        }
        e.target.value = '' // Reset para permitir re-selección
    }

    // ── Toast helper ────────────────────────────────────────────────────────
    const showToast = (msg: string, type: 'ok' | 'err') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3000)
    }

    // ── Acción: entregar ────────────────────────────────────────────────────
    const handleComplete = useCallback(async () => {
        if (!stop || !id) return
        if (!photoBase64) { showToast('Debes tomar una foto de la entrega', 'err'); return }
        if (!receiverName.trim()) { showToast('Escribe el nombre de quien recibió', 'err'); return }

        setSubmitting(true)
        const action = {
            stopId: id, type: 'COMPLETE' as const,
            timestamp: Date.now(),
            receiverName: receiverName.trim(),
            photoBase64,
        }

        if (sync.isOnline) {
            try {
                await api.post(`/driver/stops/${id}/action`, action)
                showToast('¡Entrega confirmada!', 'ok')
            } catch {
                await offlineService.saveAction(action)
                showToast('Guardado offline. Se sincronizará al reconectar', 'ok')
            }
        } else {
            await offlineService.saveAction(action)
            showToast('Guardado offline. Se sincronizará al reconectar', 'ok')
        }

        // Actualizar estado local y cache
        const updated: CachedStop = { ...stop, status: 'ENTREGADO', receiverName: receiverName.trim(), completedAt: new Date().toISOString() }
        setStop(updated)
        await offlineService.updateCachedStop(id, { status: 'ENTREGADO', receiverName: receiverName.trim() })
        await sync.refreshPendingCount()
        setSubmitting(false)

        setTimeout(() => navigate('/app/driver', { replace: true }), 1200)
    }, [stop, id, photoBase64, receiverName, sync, navigate])

    // ── Acción: fallo ───────────────────────────────────────────────────────
    const handleFail = useCallback(async (reason: string) => {
        if (!stop || !id) return
        setSubmitting(true)
        setShowFail(false)

        const action = {
            stopId: id, type: 'FAIL' as const,
            timestamp: Date.now(), notes: reason,
        }

        if (sync.isOnline) {
            try {
                await api.post(`/driver/stops/${id}/action`, action)
            } catch {
                await offlineService.saveAction(action)
            }
        } else {
            await offlineService.saveAction(action)
        }

        const updated: CachedStop = { ...stop, status: 'FALLIDO' }
        setStop(updated)
        await offlineService.updateCachedStop(id, { status: 'FALLIDO' })
        await sync.refreshPendingCount()
        setSubmitting(false)

        showToast('Entrega marcada como fallida', 'ok')
        setTimeout(() => navigate('/app/driver', { replace: true }), 1200)
    }, [stop, id, sync, navigate])

    // ── Abrir en Google Maps ────────────────────────────────────────────────
    const openMaps = () => {
        if (!stop) return
        const query = stop.lat && stop.lng
            ? `${stop.lat},${stop.lng}`
            : encodeURIComponent(stop.address)
        window.open(`https://maps.google.com/?q=${query}`, '_blank')
    }

    // ── Render: loading ─────────────────────────────────────────────────────
    if (loading) {
        return (
            <div style={{ minHeight: '100%', background: APP_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${BORDER}`, borderTopColor: PRIMARY, animation: 'spin-d 0.8s linear infinite', margin: '0 auto 12px' }} />
                    <style>{`@keyframes spin-d{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                    <p style={{ color: TEXT_SUB, fontSize: 13 }}>Cargando parada…</p>
                </div>
            </div>
        )
    }

    // ── Render: no encontrado ───────────────────────────────────────────────
    if (!stop) {
        return (
            <div style={{ minHeight: '100%', background: APP_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F, padding: 24 }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ color: PINK, fontSize: 15, fontWeight: 700 }}>Parada no encontrada</p>
                    <button onClick={() => navigate('/app/driver')} style={{ marginTop: 12, background: CARD, border: `1px solid ${BORDER}`, color: TEXT, fontSize: 13, padding: '8px 20px', borderRadius: 10, cursor: 'pointer', fontFamily: F }}>
                        Volver
                    </button>
                </div>
            </div>
        )
    }

    const cfg = STATUS_CFG[stop.status] ?? STATUS_CFG.PENDIENTE
    const isDone = stop.status === 'ENTREGADO' || stop.status === 'FALLIDO'

    return (
        <div style={{ minHeight: '100%', background: APP_BG, fontFamily: F, color: TEXT, maxWidth: 480, margin: '0 auto' }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
        @keyframes slide-up-modal { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes toast-in { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes spin-d { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

            {/* ── SyncBanner ── */}
            <SyncBanner isOnline={sync.isOnline} syncing={sync.syncing} pendingCount={sync.pendingCount} />

            {/* ── Header ── */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px',
                borderBottom: `1px solid ${BORDER}`,
                background: '#091d30',
            }}>
                <button
                    onClick={() => navigate('/app/driver')}
                    style={{
                        width: 36, height: 36, borderRadius: 10, border: `1px solid ${BORDER}`,
                        background: 'rgba(56,189,248,0.07)', cursor: 'pointer', color: TEXT,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}
                >
                    <ArrowLeft size={18} />
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: TEXT_SUB, fontSize: 11, fontWeight: 600, margin: 0, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        Parada #{String(stop.stopNumber).padStart(2, '0')}
                    </p>
                    <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: '1px 0 0', fontFamily: MONO, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {stop.trackingCode}
                    </p>
                </div>

                <div style={{
                    padding: '5px 10px', borderRadius: 8,
                    background: cfg.bg, border: `1px solid ${cfg.color}30`,
                    flexShrink: 0,
                }}>
                    <span style={{ color: cfg.color, fontSize: 11, fontWeight: 700, fontFamily: MONO, letterSpacing: '0.04em' }}>
                        {cfg.label.toUpperCase()}
                    </span>
                </div>
            </div>

            {/* ── Contenido scrollable ── */}
            <div style={{ padding: '16px 16px 140px', display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* ── Datos del cliente ── */}
                <InfoCard>
                    <InfoRow icon={<User size={15} color={PRIMARY} />} label="Cliente" value={stop.clientName} />
                    <div style={{ height: 1, background: BORDER }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <InfoRow icon={<Phone size={15} color={SEC} />} label="Teléfono" value={stop.clientPhone} />
                        <a
                            href={`tel:${stop.clientPhone.replace(/\s/g, '')}`}
                            style={{
                                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                                background: 'rgba(56,189,248,0.1)', border: `1px solid ${BORDER}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
                            }}
                        >
                            <Phone size={16} color={PRIMARY} />
                        </a>
                    </div>
                </InfoCard>

                {/* ── Dirección ── */}
                <InfoCard>
                    <InfoRow icon={<MapPin size={15} color={AMBER} />} label="Dirección" value={stop.address} />
                    {stop.addressNotes && (
                        <>
                            <div style={{ height: 1, background: BORDER }} />
                            <InfoRow icon={<FileText size={15} color={TEXT_SUB} />} label="Notas" value={stop.addressNotes} />
                        </>
                    )}
                    <button
                        onClick={openMaps}
                        style={{
                            marginTop: 2,
                            width: '100%', height: 40, borderRadius: 10,
                            background: 'rgba(245,158,11,0.08)',
                            border: `1px solid rgba(245,158,11,0.2)`,
                            color: AMBER, fontSize: 13, fontWeight: 700,
                            cursor: 'pointer', fontFamily: F,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                            transition: 'all 0.15s',
                        }}
                    >
                        <Navigation size={14} />
                        Abrir en Google Maps
                    </button>
                </InfoCard>

                {/* ── Paquete ── */}
                {(stop.packageWeight || stop.packageVolume || stop.packageNotes) && (
                    <InfoCard>
                        {stop.packageWeight && <InfoRow icon={<Package size={15} color={PRIMARY} />} label="Peso" value={`${stop.packageWeight} kg`} />}
                        {stop.packageVolume && (
                            <>
                                <div style={{ height: 1, background: BORDER }} />
                                <InfoRow icon={<Package size={15} color={SEC} />} label="Dimensiones" value={stop.packageVolume} />
                            </>
                        )}
                        {stop.packageNotes && (
                            <>
                                <div style={{ height: 1, background: BORDER }} />
                                <InfoRow icon={<FileText size={15} color={TEXT_SUB} />} label="Indicaciones" value={stop.packageNotes} />
                            </>
                        )}
                    </InfoCard>
                )}

                {/* ── Sección de entrega (oculta si ya está completado) ── */}
                {!isDone && (
                    <>
                        {/* Foto PoD */}
                        <div>
                            <p style={{ color: TEXT_SUB, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 8px 2px' }}>
                                Foto de entrega (PoD)
                            </p>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                style={{ display: 'none' }}
                                onChange={handlePhoto}
                            />

                            {photoBase64 ? (
                                <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: `2px solid ${GREEN}30` }}>
                                    <img
                                        src={photoBase64}
                                        alt="Foto PoD"
                                        style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
                                    />
                                    <button
                                        onClick={() => setPhotoBase64(null)}
                                        style={{
                                            position: 'absolute', top: 8, right: 8,
                                            width: 32, height: 32, borderRadius: 8,
                                            background: 'rgba(0,0,0,0.7)', border: 'none',
                                            cursor: 'pointer', color: 'white',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}
                                    >
                                        <X size={14} />
                                    </button>
                                    <div style={{
                                        position: 'absolute', bottom: 8, left: 8,
                                        padding: '3px 8px', borderRadius: 6,
                                        background: 'rgba(16,185,129,0.85)',
                                        fontSize: 11, fontWeight: 700, color: 'white',
                                        display: 'flex', alignItems: 'center', gap: 4,
                                    }}>
                                        <CheckCircle2 size={11} />
                                        Foto lista
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        width: '100%', height: 120, borderRadius: 14,
                                        background: 'rgba(56,189,248,0.04)',
                                        border: `2px dashed rgba(56,189,248,0.2)`,
                                        cursor: 'pointer',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(56,189,248,0.08)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(56,189,248,0.35)' }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(56,189,248,0.04)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(56,189,248,0.2)' }}
                                >
                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Camera size={22} color={PRIMARY} />
                                    </div>
                                    <p style={{ color: PRIMARY, fontSize: 13, fontWeight: 700, margin: 0 }}>Tomar foto</p>
                                    <p style={{ color: TEXT_SUB, fontSize: 11, margin: 0 }}>Obligatorio para confirmar entrega</p>
                                </button>
                            )}
                        </div>

                        {/* Nombre de quien recibe */}
                        <div>
                            <p style={{ color: TEXT_SUB, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 8px 2px' }}>
                                Nombre de quien recibe
                            </p>
                            <input
                                type="text"
                                value={receiverName}
                                onChange={e => setReceiverName(e.target.value)}
                                placeholder="Ej: María García"
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    height: 44, borderRadius: 12, padding: '0 14px',
                                    background: 'rgba(255,255,255,0.04)',
                                    border: `1.5px solid ${receiverName ? `${PRIMARY}40` : 'rgba(56,189,248,0.15)'}`,
                                    color: TEXT, fontSize: 14, fontFamily: F, outline: 'none',
                                    transition: 'border-color 0.2s',
                                }}
                                onFocus={e => e.target.style.borderColor = `${PRIMARY}70`}
                                onBlur={e => e.target.style.borderColor = receiverName ? `${PRIMARY}40` : 'rgba(56,189,248,0.15)'}
                            />
                        </div>
                    </>
                )}

                {/* ── Si ya está completado ── */}
                {isDone && (
                    <div style={{
                        borderRadius: 14, padding: '16px',
                        background: stop.status === 'ENTREGADO' ? 'rgba(16,185,129,0.08)' : 'rgba(236,72,153,0.08)',
                        border: `1px solid ${stop.status === 'ENTREGADO' ? 'rgba(16,185,129,0.2)' : 'rgba(236,72,153,0.2)'}`,
                        display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                        {stop.status === 'ENTREGADO'
                            ? <CheckCircle2 size={24} color={GREEN} style={{ flexShrink: 0 }} />
                            : <XCircle size={24} color={PINK} style={{ flexShrink: 0 }} />
                        }
                        <div>
                            <p style={{ color: stop.status === 'ENTREGADO' ? GREEN : PINK, fontSize: 14, fontWeight: 700, margin: 0 }}>
                                {stop.status === 'ENTREGADO' ? '¡Entrega confirmada!' : 'Entrega fallida'}
                            </p>
                            {stop.receiverName && (
                                <p style={{ color: TEXT_SUB, fontSize: 12, margin: '3px 0 0' }}>
                                    Recibió: {stop.receiverName}
                                </p>
                            )}
                            {stop.completedAt && (
                                <p style={{ color: TEXT_SUB, fontSize: 11, margin: '2px 0 0', fontFamily: MONO }}>
                                    {new Date(stop.completedAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Botones de acción fijos en la parte inferior ── */}
            {!isDone && (
                <div style={{
                    position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                    width: '100%', maxWidth: 480,
                    background: `linear-gradient(to top, ${APP_BG} 70%, transparent)`,
                    padding: '16px 16px calc(16px + env(safe-area-inset-bottom))',
                    display: 'flex', gap: 10,
                    zIndex: 40,
                }}>
                    {/* Botón de fallo */}
                    <button
                        onClick={() => setShowFail(true)}
                        disabled={submitting}
                        style={{
                            flex: 1, height: 52, borderRadius: 14,
                            background: 'rgba(236,72,153,0.08)',
                            border: '1px solid rgba(236,72,153,0.25)',
                            color: PINK, fontSize: 14, fontWeight: 700,
                            cursor: 'pointer', fontFamily: F,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            transition: 'all 0.15s',
                        }}
                    >
                        <XCircle size={18} />
                        Fallido
                    </button>

                    {/* Botón de entregado */}
                    <button
                        onClick={handleComplete}
                        disabled={submitting || !photoBase64 || !receiverName.trim()}
                        style={{
                            flex: 2, height: 52, borderRadius: 14,
                            background: (photoBase64 && receiverName.trim())
                                ? `linear-gradient(135deg, #10b981, #059669)`
                                : 'rgba(16,185,129,0.08)',
                            border: `1px solid ${(photoBase64 && receiverName.trim()) ? 'transparent' : 'rgba(16,185,129,0.2)'}`,
                            color: (photoBase64 && receiverName.trim()) ? 'white' : 'rgba(16,185,129,0.4)',
                            fontSize: 15, fontWeight: 800,
                            cursor: (photoBase64 && receiverName.trim()) ? 'pointer' : 'not-allowed',
                            fontFamily: F,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            transition: 'all 0.2s ease',
                            boxShadow: (photoBase64 && receiverName.trim()) ? '0 4px 20px rgba(16,185,129,0.3)' : 'none',
                        }}
                    >
                        <CheckCircle2 size={18} />
                        {submitting ? 'Guardando…' : 'Confirmar entrega'}
                    </button>
                </div>
            )}

            {/* ── Modal de fallo ── */}
            {showFail && (
                <FailModal
                    onConfirm={handleFail}
                    onClose={() => setShowFail(false)}
                    loading={submitting}
                />
            )}

            {/* ── Toast de notificación ── */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
                    padding: '10px 18px', borderRadius: 12, zIndex: 200,
                    background: toast.type === 'ok' ? 'rgba(16,185,129,0.9)' : 'rgba(236,72,153,0.9)',
                    backdropFilter: 'blur(10px)',
                    color: 'white', fontSize: 13, fontWeight: 700, fontFamily: F,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    animation: 'toast-in 0.25s ease',
                    whiteSpace: 'nowrap', maxWidth: '90vw',
                    display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    {toast.type === 'ok' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                    {toast.msg}
                </div>
            )}
        </div>
    )
}