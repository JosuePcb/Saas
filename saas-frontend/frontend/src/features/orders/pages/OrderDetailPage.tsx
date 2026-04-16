import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
    ArrowLeft, MapPin, Phone, User, Truck, Clock,
    CheckCircle2, XCircle, Package, Camera, Upload,
    ChevronRight, AlertTriangle, Navigation, FileText,
    Copy, ExternalLink, Zap,
} from 'lucide-react'

const F = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"

// ─── Mock data de una orden ───────────────────────────────────────────────────
const MOCK_ORDER = {
    id: 'TRK-2842',
    trackingCode: 'TRK-2842',
    status: 'IN_TRANSIT',
    cliente: {
        nombre: 'Carlos Pérez',
        telefono: '+58 414-222-3344',
        email: 'carlos@email.com',
    },
    direccion: {
        raw: 'Calle Los Mangos, Altamira, Caracas',
        normalized: 'Calle Los Mangos, Urb. Altamira, Municipio Chacao, Caracas 1060',
        confidence: 0.94,
    },
    chofer: {
        nombre: 'Pedro Méndez',
        telefono: '+58 412-555-7890',
        initials: 'PM',
    },
    monto: 32.50,
    creado: '2026-03-14T08:47:00',
    zona: 'Altamira',
    notas: 'Entregar en portería. Preguntar por Martínez.',
    history: [
        { status: 'CREATED', label: 'Orden creada', time: '08:47', date: '14 Mar', actor: 'Ana López (Despachadora)', color: '#60a5fa' },
        { status: 'ASSIGNED', label: 'Asignada a Pedro Méndez', time: '09:10', date: '14 Mar', actor: 'Ana López (Despachadora)', color: '#fbbf24' },
        { status: 'IN_TRANSIT', label: 'En camino al destino', time: '09:35', date: '14 Mar', actor: 'Pedro Méndez (Chofer)', color: '#EC4899' },
    ],
}

const STATUS_FLOW = ['CREATED', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED']

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; next?: string; nextLabel?: string }> = {
    CREATED: { label: 'Creada', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', next: 'ASSIGNED', nextLabel: 'Asignar chofer' },
    ASSIGNED: { label: 'Asignada', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', next: 'IN_TRANSIT', nextLabel: 'Iniciar entrega' },
    IN_TRANSIT: { label: 'En camino', color: '#EC4899', bg: 'rgba(236,72,153,0.1)', next: 'DELIVERED', nextLabel: 'Marcar entregada' },
    DELIVERED: { label: 'Entregada', color: '#34d399', bg: 'rgba(52,211,153,0.1)', },
    CANCELLED: { label: 'Cancelada', color: '#f87171', bg: 'rgba(248,113,113,0.1)', },
}

// ─── Componentes internos ─────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <p style={{
            fontFamily: F, fontSize: 12, fontWeight: 700,
            color: '#D8B4FE', textTransform: 'uppercase', letterSpacing: '0.1em',
            margin: '0 0 14px 0',
        }}>
            {children}
        </p>
    )
}

function InfoRow({ icon, label, value, copy }: { icon: React.ReactNode; label: string; value: string; copy?: boolean }) {
    const [copied, setCopied] = useState(false)
    const handleCopy = () => {
        navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }
    return (
        <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '12px 0',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
            <span style={{ color: '#D8B4FE', marginTop: 1, flexShrink: 0 }}>{icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: F, fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '0 0 2px 0' }}>{label}</p>
                <p style={{ fontFamily: F, fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.85)', margin: 0, wordBreak: 'break-word' }}>{value}</p>
            </div>
            {copy && (
                <button
                    onClick={handleCopy}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#34d399' : 'rgba(255,255,255,0.2)', flexShrink: 0, padding: 4 }}
                >
                    {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
                </button>
            )}
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OrderDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const order = MOCK_ORDER // TODO: useQuery con /api/logistics/orders/:id

    const [currentStatus, setCurrentStatus] = useState(order.status)
    const [cancelling, setCancelling] = useState(false)
    const [advancing, setAdvancing] = useState(false)
    const [showCancelConfirm, setShowCancel] = useState(false)
    const [history, setHistory] = useState(order.history)

    const cfg = STATUS_CFG[currentStatus]
    const nextCfg = cfg.next ? STATUS_CFG[cfg.next] : null
    const stepIdx = STATUS_FLOW.indexOf(currentStatus)

    const handleAdvance = async () => {
        if (!cfg.next) return
        setAdvancing(true)
        await new Promise(r => setTimeout(r, 800))
        const newStatus = cfg.next!
        setCurrentStatus(newStatus)
        setHistory(prev => [...prev, {
            status: newStatus,
            label: STATUS_CFG[newStatus].label,
            time: new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }),
            date: '14 Mar',
            actor: 'Tú (Despachador)',
            color: STATUS_CFG[newStatus].color,
        }])
        setAdvancing(false)
    }

    const handleCancel = async () => {
        setCancelling(true)
        await new Promise(r => setTimeout(r, 600))
        setCurrentStatus('CANCELLED')
        setHistory(prev => [...prev, {
            status: 'CANCELLED', label: 'Orden cancelada',
            time: new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }),
            date: '14 Mar', actor: 'Tú (Despachador)', color: '#f87171',
        }])
        setCancelling(false)
        setShowCancel(false)
    }

    return (
        <div style={{ fontFamily: F }}>

            {/* ── Back + título ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
                <button
                    onClick={() => navigate('/app/orders')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
                        fontFamily: F, fontSize: 14, color: 'rgba(255,255,255,0.6)',
                        transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white' }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
                >
                    <ArrowLeft size={15} />
                    Volver
                </button>

                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <h1 style={{ fontFamily: F, fontSize: 26, fontWeight: 900, color: 'rgba(255,255,255,0.92)', margin: 0, letterSpacing: '-0.02em' }}>
                            {order.trackingCode}
                        </h1>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '5px 12px', borderRadius: 20,
                            backgroundColor: cfg.bg, color: cfg.color,
                            fontSize: 14, fontWeight: 600, fontFamily: F,
                            border: `1px solid ${cfg.color}30`,
                        }}>
                            {cfg.label}
                        </span>
                    </div>
                    <p style={{ fontFamily: F, fontSize: 14, color: 'rgba(255,255,255,0.35)', margin: '3px 0 0 0' }}>
                        Creada el 14 de Marzo 2026 a las 08:47
                    </p>
                </div>
            </div>

            {/* ── Progress bar de estados ── */}
            <div style={{
                backgroundColor: '#2d1122', borderRadius: 18,
                border: '1px solid rgba(255,255,255,0.07)',
                padding: '20px 24px', marginBottom: 20,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                    {STATUS_FLOW.map((s, i) => {
                        const done = i <= stepIdx
                        const current = i === stepIdx
                        const sCfg = STATUS_CFG[s]
                        return (
                            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STATUS_FLOW.length - 1 ? 1 : 0 }}>
                                {/* Paso */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                    <div style={{
                                        width: current ? 36 : 28, height: current ? 36 : 28,
                                        borderRadius: '50%',
                                        backgroundColor: done ? sCfg.color : 'rgba(255,255,255,0.06)',
                                        border: `2px solid ${done ? sCfg.color : 'rgba(255,255,255,0.1)'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.3s',
                                        boxShadow: current ? `0 0 16px ${sCfg.color}60` : 'none',
                                    }}>
                                        {done && <CheckCircle2 size={current ? 18 : 14} color={currentStatus === 'CANCELLED' && i === stepIdx ? '#f87171' : '#0f172a'} strokeWidth={2.5} />}
                                    </div>
                                    <span style={{
                                        fontFamily: F, fontSize: 11, fontWeight: current ? 700 : 500,
                                        color: done ? sCfg.color : 'rgba(255,255,255,0.2)',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {sCfg.label}
                                    </span>
                                </div>
                                {/* Línea */}
                                {i < STATUS_FLOW.length - 1 && (
                                    <div style={{
                                        flex: 1, height: 2, margin: '0 6px', marginBottom: 22,
                                        backgroundColor: i < stepIdx ? sCfg.color : 'rgba(255,255,255,0.08)',
                                        transition: 'background-color 0.3s',
                                    }} />
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* ── Layout 2 cols ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Columna izquierda — Info + acciones */}
                <div className="lg:col-span-1" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Acciones */}
                    {currentStatus !== 'DELIVERED' && currentStatus !== 'CANCELLED' && (
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(216,180,254,0.08))',
                            border: '1px solid rgba(236,72,153,0.2)',
                            borderRadius: 18, padding: '18px',
                        }}>
                            <SectionTitle>Acciones</SectionTitle>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {/* Avanzar estado */}
                                {cfg.next && (
                                    <button
                                        onClick={handleAdvance}
                                        disabled={advancing}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                            padding: '13px', borderRadius: 12,
                                            background: `linear-gradient(135deg, ${nextCfg?.color ?? '#EC4899'}, ${cfg.color})`,
                                            color: 'white', border: 'none', cursor: 'pointer',
                                            fontFamily: F, fontSize: 15, fontWeight: 700,
                                            transition: 'all 0.2s', opacity: advancing ? 0.7 : 1,
                                            boxShadow: `0 4px 16px ${nextCfg?.color ?? '#EC4899'}40`,
                                        }}
                                    >
                                        {advancing ? (
                                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                            </svg>
                                        ) : <CheckCircle2 size={17} />}
                                        {advancing ? 'Actualizando...' : cfg.nextLabel}
                                    </button>
                                )}

                                {/* Cancelar */}
                                {!showCancelConfirm ? (
                                    <button
                                        onClick={() => setShowCancel(true)}
                                        style={{
                                            padding: '11px', borderRadius: 12,
                                            backgroundColor: 'rgba(248,113,113,0.08)',
                                            border: '1px solid rgba(248,113,113,0.2)',
                                            color: '#f87171', cursor: 'pointer',
                                            fontFamily: F, fontSize: 15, fontWeight: 600,
                                            transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(248,113,113,0.15)' }}
                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(248,113,113,0.08)' }}
                                    >
                                        Cancelar orden
                                    </button>
                                ) : (
                                    <div style={{ backgroundColor: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 12, padding: 14 }}>
                                        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                                            <AlertTriangle size={15} color="#f87171" />
                                            <p style={{ fontFamily: F, fontSize: 14, color: '#f87171', margin: 0, fontWeight: 600 }}>¿Cancelar esta orden?</p>
                                        </div>
                                        <p style={{ fontFamily: F, fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 12px 0' }}>Esta acción no se puede deshacer.</p>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button onClick={() => setShowCancel(false)}
                                                style={{ flex: 1, padding: '8px', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: F, fontSize: 13, fontWeight: 600 }}>
                                                No
                                            </button>
                                            <button onClick={handleCancel} disabled={cancelling}
                                                style={{ flex: 1, padding: '8px', borderRadius: 8, backgroundColor: '#ef4444', border: 'none', color: 'white', cursor: 'pointer', fontFamily: F, fontSize: 13, fontWeight: 700, opacity: cancelling ? 0.7 : 1 }}>
                                                {cancelling ? 'Cancelando...' : 'Sí, cancelar'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Info del cliente */}
                    <div style={{ backgroundColor: '#2d1122', borderRadius: 18, border: '1px solid rgba(255,255,255,0.07)', padding: '18px', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
                        <SectionTitle>Cliente</SectionTitle>
                        <InfoRow icon={<User size={15} />} label="Nombre" value={order.cliente.nombre} copy />
                        <InfoRow icon={<Phone size={15} />} label="Teléfono" value={order.cliente.telefono} copy />
                        <InfoRow icon={<MapPin size={15} />} label="Dirección" value={order.direccion.normalized} copy />
                        {order.notas && (
                            <InfoRow icon={<FileText size={15} />} label="Notas" value={order.notas} />
                        )}
                        {/* Confianza de normalización */}
                        <div style={{ marginTop: 12, padding: '10px 12px', backgroundColor: 'rgba(216,180,254,0.06)', borderRadius: 10, border: '1px solid rgba(216,180,254,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <span style={{ fontFamily: F, fontSize: 12, color: '#D8B4FE' }}>Precisión de dirección</span>
                                <span style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: '#D8B4FE' }}>{(order.direccion.confidence * 100).toFixed(0)}%</span>
                            </div>
                            <div style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
                                <div style={{ height: '100%', width: `${order.direccion.confidence * 100}%`, backgroundColor: '#D8B4FE', borderRadius: 2 }} />
                            </div>
                        </div>
                    </div>

                    {/* Info del chofer */}
                    <div style={{ backgroundColor: '#2d1122', borderRadius: 18, border: '1px solid rgba(255,255,255,0.07)', padding: '18px', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
                        <SectionTitle>Chofer asignado</SectionTitle>
                        {order.chofer ? (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#EC4899,#D8B4FE)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 15, fontWeight: 800 }}>
                                        {order.chofer.initials}
                                    </div>
                                    <div>
                                        <p style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: 0 }}>{order.chofer.nombre}</p>
                                        <p style={{ fontFamily: F, fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Chofer activo</p>
                                    </div>
                                </div>
                                <InfoRow icon={<Phone size={15} />} label="Teléfono" value={order.chofer.telefono} copy />
                            </>
                        ) : (
                            <p style={{ fontFamily: F, fontSize: 15, color: 'rgba(255,255,255,0.3)' }}>Sin chofer asignado</p>
                        )}
                    </div>
                </div>

                {/* Columna derecha — Timeline + monto */}
                <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Monto */}
                    <div style={{
                        background: 'linear-gradient(135deg, #1a0a14 0%, #2d1122 100%)',
                        border: '1px solid rgba(236,72,153,0.2)',
                        borderRadius: 18, padding: '20px 24px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        flexWrap: 'wrap', gap: 12,
                    }}>
                        <div>
                            <p style={{ fontFamily: F, fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 4px 0' }}>Monto de la orden</p>
                            <p style={{ fontFamily: F, fontSize: 42, fontWeight: 900, color: 'white', margin: 0, lineHeight: 1, letterSpacing: '-0.02em' }}>
                                <span style={{ fontSize: 22, color: '#EC4899', marginRight: 4 }}>$</span>
                                {order.monto.toFixed(2)}
                            </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontFamily: F, fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 4px 0' }}>Zona</p>
                            <span style={{
                                display: 'inline-block', padding: '6px 14px', borderRadius: 20,
                                background: 'rgba(216,180,254,0.12)', color: '#D8B4FE',
                                fontFamily: F, fontSize: 14, fontWeight: 600,
                                border: '1px solid rgba(216,180,254,0.2)',
                            }}>
                                {order.zona}
                            </span>
                        </div>
                    </div>

                    {/* Timeline de eventos */}
                    <div style={{ backgroundColor: '#2d1122', borderRadius: 18, border: '1px solid rgba(255,255,255,0.07)', padding: '20px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.25)', flex: 1 }}>
                        <SectionTitle>Historial de eventos</SectionTitle>

                        <div style={{ position: 'relative' }}>
                            {/* Línea vertical */}
                            <div style={{
                                position: 'absolute', left: 14, top: 14,
                                width: 2, bottom: 14,
                                background: 'linear-gradient(180deg, rgba(236,72,153,0.4), rgba(216,180,254,0.1))',
                                borderRadius: 1,
                            }} />

                            {history.map((evt, i) => (
                                <div key={i} style={{ display: 'flex', gap: 16, marginBottom: i < history.length - 1 ? 24 : 0, position: 'relative' }}>
                                    {/* Dot */}
                                    <div style={{
                                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                                        backgroundColor: `${evt.color}20`,
                                        border: `2px solid ${evt.color}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        zIndex: 1,
                                        boxShadow: i === history.length - 1 ? `0 0 14px ${evt.color}60` : 'none',
                                    }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: evt.color }} />
                                    </div>

                                    {/* Contenido */}
                                    <div style={{ flex: 1, paddingTop: 4 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                                            <p style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: 0 }}>
                                                {evt.label}
                                            </p>
                                            <span style={{ fontFamily: F, fontSize: 13, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                                                {evt.date} · {evt.time}
                                            </span>
                                        </div>
                                        <p style={{ fontFamily: F, fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '3px 0 0 0' }}>
                                            {evt.actor}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {/* Estado actual pulsando */}
                            {currentStatus !== 'DELIVERED' && currentStatus !== 'CANCELLED' && (
                                <div style={{ display: 'flex', gap: 16, marginTop: 24, position: 'relative' }}>
                                    <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, backgroundColor: 'rgba(255,255,255,0.04)', border: '2px dashed rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                                        <Clock size={12} color="rgba(255,255,255,0.2)" />
                                    </div>
                                    <div style={{ paddingTop: 6 }}>
                                        <p style={{ fontFamily: F, fontSize: 14, color: 'rgba(255,255,255,0.25)', margin: 0, fontStyle: 'italic' }}>
                                            Esperando próximo evento...
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Upload PoD (prueba de entrega) */}
                    {currentStatus === 'DELIVERED' && (
                        <div style={{ backgroundColor: '#2d1122', borderRadius: 18, border: '1px solid rgba(52,211,153,0.2)', padding: '20px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
                            <SectionTitle>Prueba de entrega</SectionTitle>
                            <div style={{
                                border: '2px dashed rgba(52,211,153,0.25)', borderRadius: 14,
                                padding: '30px', textAlign: 'center', cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(52,211,153,0.04)'; e.currentTarget.style.borderColor = 'rgba(52,211,153,0.4)' }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'rgba(52,211,153,0.25)' }}
                            >
                                <Upload size={28} color="#34d399" style={{ marginBottom: 10 }} />
                                <p style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: '#34d399', margin: '0 0 5px 0' }}>
                                    Subir foto de entrega
                                </p>
                                <p style={{ fontFamily: F, fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                                    JPG, PNG · Máx 5MB
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}