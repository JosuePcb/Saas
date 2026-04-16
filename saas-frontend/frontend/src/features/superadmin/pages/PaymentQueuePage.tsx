import { useState } from 'react'
import {
    CreditCard, CheckCircle2, XCircle, Clock, Eye,
    ChevronLeft, ChevronRight, Search, Filter,
    Building2, ArrowLeft, X, Check, MessageSquare,
    AlertCircle,
} from 'lucide-react'

const F = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

const PRIMARY = '#8B5CF6'
const SEC = '#A78BFA'
const PINK = '#EC4899'
const RED = '#ef4444'
const LILAC = '#D8B4FE'
const GREEN = '#10b981'
const AMBER = '#f59e0b'
const TEXT = '#ede9fe'
const TEXT_MID = 'rgba(237,233,254,0.55)'
const TEXT_SUB = 'rgba(167,139,250,0.5)'
const BORDER = 'rgba(139,92,246,0.15)'
const CARD = '#1a1040'
const CARD_HI = '#1f1350'
const BG = '#120a2e'

const SHADOW = '0 4px 24px rgba(0,0,0,0.4), 0 1px 4px rgba(139,92,246,0.12)'

type PayStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
type PayMethod = 'PAGO_MOVIL' | 'TRANSFERENCIA'

interface Payment {
    id: string
    tenantId: string
    tenantNombre: string
    tenantRif: string
    plan: string
    tipoPago: PayMethod
    referencia: string
    bancoOrigen: string
    bancoDestino: string
    montoUSD: number
    montoBs: number
    tasaBCV: number
    fechaPago: string
    fechaEnvio: string
    status: PayStatus
    comentario: string
    comprobante: string   // URL simulada
}

const MOCK_PAYMENTS: Payment[] = [
    { id: 'p1', tenantId: 't3', tenantNombre: 'Reparto Rápido Caracas', tenantRif: 'J-20345678-9', plan: 'Starter', tipoPago: 'PAGO_MOVIL', referencia: '20260407001', bancoOrigen: 'Banco de Venezuela', bancoDestino: 'Banesco', montoUSD: 15, montoBs: 645, tasaBCV: 43.0, fechaPago: '2026-04-07', fechaEnvio: '2026-04-07 09:12', status: 'PENDING', comentario: '', comprobante: '' },
    { id: 'p2', tenantId: 't4', tenantNombre: 'Norte Logística S.A.', tenantRif: 'J-10456789-0', plan: 'Growth', tipoPago: 'TRANSFERENCIA', referencia: '20260407002', bancoOrigen: 'Mercantil', bancoDestino: 'Banesco', montoUSD: 35, montoBs: 1505, tasaBCV: 43.0, fechaPago: '2026-04-07', fechaEnvio: '2026-04-07 10:35', status: 'PENDING', comentario: '', comprobante: '' },
    { id: 'p3', tenantId: 't5', tenantNombre: 'Transporte Ávila C.A.', tenantRif: 'J-50567890-1', plan: 'Starter', tipoPago: 'PAGO_MOVIL', referencia: '20260406003', bancoOrigen: 'BBVA Provincial', bancoDestino: 'Banesco', montoUSD: 15, montoBs: 645, tasaBCV: 43.0, fechaPago: '2026-04-06', fechaEnvio: '2026-04-06 16:20', status: 'PENDING', comentario: '', comprobante: '' },
    { id: 'p4', tenantId: 't6', tenantNombre: 'MercaDelivery C.A.', tenantRif: 'J-60678901-2', plan: 'Pro', tipoPago: 'TRANSFERENCIA', referencia: '20260406004', bancoOrigen: 'Banesco', bancoDestino: 'Banesco', montoUSD: 75, montoBs: 3225, tasaBCV: 43.0, fechaPago: '2026-04-06', fechaEnvio: '2026-04-06 14:50', status: 'PENDING', comentario: '', comprobante: '' },
    { id: 'p5', tenantId: 't7', tenantNombre: 'FastPack Maracay', tenantRif: 'J-70789012-3', plan: 'Growth', tipoPago: 'PAGO_MOVIL', referencia: '20260405005', bancoOrigen: 'BNC', bancoDestino: 'Banesco', montoUSD: 35, montoBs: 1505, tasaBCV: 43.0, fechaPago: '2026-04-05', fechaEnvio: '2026-04-05 11:05', status: 'PENDING', comentario: '', comprobante: '' },
    { id: 'p6', tenantId: 't1', tenantNombre: 'DistribuidoraPro C.A.', tenantRif: 'J-30123456-7', plan: 'Growth', tipoPago: 'TRANSFERENCIA', referencia: '20260314006', bancoOrigen: 'Banesco', bancoDestino: 'Banesco', montoUSD: 35, montoBs: 1505, tasaBCV: 43.0, fechaPago: '2026-03-14', fechaEnvio: '2026-03-14 08:30', status: 'APPROVED', comentario: 'Pago verificado. Referencia válida.', comprobante: '' },
    { id: 'p7', tenantId: 't8', tenantNombre: 'Envíos del Centro C.A.', tenantRif: 'J-80890123-4', plan: 'Starter', tipoPago: 'PAGO_MOVIL', referencia: '20260312007', bancoOrigen: 'Bicentenario', bancoDestino: 'Banesco', montoUSD: 15, montoBs: 645, tasaBCV: 43.0, fechaPago: '2026-03-12', fechaEnvio: '2026-03-12 15:40', status: 'REJECTED', comentario: 'Referencia no corresponde al monto. Verificar con el banco.', comprobante: '' },
]

const PLAN_COLOR: Record<string, string> = { Starter: TEXT_MID, Growth: SEC, Pro: PINK }

const STATUS_CFG: Record<PayStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    PENDING: { label: 'Pendiente', color: AMBER, bg: 'rgba(245,158,11,0.12)', icon: <Clock size={12} /> },
    APPROVED: { label: 'Aprobado', color: GREEN, bg: 'rgba(16,185,129,0.12)', icon: <Check size={12} strokeWidth={3} /> },
    REJECTED: { label: 'Rechazado', color: RED, bg: 'rgba(239,68,68,0.12)', icon: <XCircle size={12} /> },
}

// Simula un comprobante SVG (en producción sería una img del backend)
function FakeVoucher({ pago }: { pago: Payment }) {
    return (
        <div style={{
            width: '100%', borderRadius: 12,
            backgroundColor: '#fff',
            padding: '20px',
            boxSizing: 'border-box',
            display: 'flex', flexDirection: 'column', gap: 10,
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: 12 }}>
                <div>
                    <p style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: '#374151', margin: 0 }}>BANCO BANESCO</p>
                    <p style={{ fontFamily: F, fontSize: 10, color: '#9ca3af', margin: '2px 0 0' }}>Comprobante de operación</p>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'white', fontWeight: 900, fontSize: 14 }}>B</span>
                </div>
            </div>
            {[
                { label: 'Tipo', value: pago.tipoPago === 'PAGO_MOVIL' ? 'Pago Móvil' : 'Transferencia' },
                { label: 'Referencia', value: pago.referencia },
                { label: 'Banco origen', value: pago.bancoOrigen },
                { label: 'Banco destino', value: pago.bancoDestino },
                { label: 'Monto Bs', value: `Bs. ${pago.montoBs.toLocaleString('es-VE')}` },
                { label: 'Fecha', value: pago.fechaPago },
            ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: 6 }}>
                    <span style={{ fontFamily: F, fontSize: 11, color: '#6b7280' }}>{row.label}</span>
                    <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: '#111827' }}>{row.value}</span>
                </div>
            ))}
            <p style={{ fontFamily: F, fontSize: 9, color: '#d1d5db', textAlign: 'center', margin: '4px 0 0' }}>
                Simulación de comprobante · LogiPyme
            </p>
        </div>
    )
}

// ── Panel de detalle/acción ────────────────────────────────────────────────────
function PaymentPanel({ pago, onClose, onAction }: {
    pago: Payment
    onClose: () => void
    onAction: (id: string, action: 'APPROVED' | 'REJECTED', comentario: string) => void
}) {
    const [comentario, setComentario] = useState(pago.comentario)
    const [confirming, setConfirming] = useState<'APPROVED' | 'REJECTED' | null>(null)
    const [saving, setSaving] = useState(false)

    const scfg = STATUS_CFG[pago.status]
    const isPending = pago.status === 'PENDING'

    const handleAction = async (action: 'APPROVED' | 'REJECTED') => {
        if (action === 'REJECTED' && comentario.trim().length < 5) return
        setSaving(true)
        await new Promise(r => setTimeout(r, 900))
        setSaving(false)
        onAction(pago.id, action, comentario)
        setConfirming(null)
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            backgroundColor: 'rgba(10,5,20,0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
        }}
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <div style={{
                width: '100%', maxWidth: 480,
                height: '100dvh', overflowY: 'auto',
                backgroundColor: BG,
                borderLeft: `1px solid ${BORDER}`,
                display: 'flex', flexDirection: 'column',
                animation: 'slideIn 0.25s ease both',
            }}>
                <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

                {/* Header */}
                <div style={{ padding: '16px 20px', borderBottom: `1px solid rgba(255,255,255,0.06)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_MID, display: 'flex', padding: 4 }}>
                            <ArrowLeft size={18} />
                        </button>
                        <span style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: TEXT }}>Detalle del pago</span>
                    </div>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '4px 10px', borderRadius: 20,
                        backgroundColor: scfg.bg, color: scfg.color,
                        fontFamily: F, fontSize: 11, fontWeight: 700,
                    }}>
                        {scfg.icon} {scfg.label}
                    </span>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

                    {/* Empresa */}
                    <div style={{ backgroundColor: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, padding: '14px 16px', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                                background: `linear-gradient(135deg, ${PRIMARY}, ${SEC})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontSize: 15, fontWeight: 800,
                            }}>
                                {pago.tenantNombre[0]}
                            </div>
                            <div>
                                <p style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: TEXT, margin: '0 0 2px' }}>{pago.tenantNombre}</p>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <span style={{ fontFamily: MONO, fontSize: 11, color: TEXT_SUB }}>{pago.tenantRif}</span>
                                    <span style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: PLAN_COLOR[pago.plan] }}>{pago.plan}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Datos del pago */}
                    <div style={{ backgroundColor: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, overflow: 'hidden', marginBottom: 16 }}>
                        <div style={{ padding: '10px 16px', borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
                            <span style={{ fontFamily: F, fontSize: 10, fontWeight: 700, color: TEXT_SUB, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Datos del pago</span>
                        </div>
                        {[
                            { label: 'Tipo', value: pago.tipoPago === 'PAGO_MOVIL' ? 'Pago Móvil' : 'Transferencia' },
                            { label: 'Referencia', value: pago.referencia, mono: true },
                            { label: 'Banco origen', value: pago.bancoOrigen },
                            { label: 'Banco destino', value: pago.bancoDestino },
                            { label: 'Monto USD', value: `$${pago.montoUSD}`, highlight: true },
                            { label: 'Monto Bs', value: `Bs. ${pago.montoBs.toLocaleString('es-VE')}` },
                            { label: 'Tasa BCV', value: `${pago.tasaBCV} Bs/$` },
                            { label: 'Fecha de pago', value: pago.fechaPago },
                            { label: 'Enviado', value: pago.fechaEnvio },
                        ].map((row, i) => (
                            <div key={i} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '10px 16px', borderBottom: `1px solid rgba(255,255,255,0.04)`,
                            }}>
                                <span style={{ fontFamily: F, fontSize: 12, color: TEXT_MID }}>{row.label}</span>
                                <span style={{
                                    fontFamily: row.mono ? MONO : F,
                                    fontSize: row.mono ? 11 : 13,
                                    fontWeight: 600,
                                    color: row.highlight ? GREEN : TEXT,
                                }}>
                                    {row.value}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Comprobante */}
                    <div style={{ backgroundColor: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, overflow: 'hidden', marginBottom: 16 }}>
                        <div style={{ padding: '10px 16px', borderBottom: `1px solid rgba(255,255,255,0.06)`, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Eye size={13} color={TEXT_SUB} />
                            <span style={{ fontFamily: F, fontSize: 10, fontWeight: 700, color: TEXT_SUB, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Comprobante de pago</span>
                        </div>
                        <div style={{ padding: 14 }}>
                            <FakeVoucher pago={pago} />
                        </div>
                    </div>

                    {/* Comentario */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <MessageSquare size={13} color={TEXT_SUB} />
                            <label style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: TEXT_SUB, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                Comentario {!isPending ? '(registrado)' : pago.status === 'PENDING' ? '(requerido para rechazar)' : ''}
                            </label>
                        </div>
                        <textarea
                            value={comentario}
                            onChange={e => setComentario(e.target.value)}
                            disabled={!isPending}
                            placeholder="Motivo de aprobación o rechazo..."
                            rows={3}
                            style={{
                                width: '100%', boxSizing: 'border-box', resize: 'vertical',
                                backgroundColor: isPending ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${isPending ? BORDER : 'rgba(255,255,255,0.06)'}`,
                                borderRadius: 10, padding: '10px 12px',
                                fontFamily: F, fontSize: 13, color: isPending ? TEXT : TEXT_MID,
                                lineHeight: 1.5,
                                outline: 'none',
                            }}
                            onFocus={e => { if (isPending) e.target.style.borderColor = PRIMARY }}
                            onBlur={e => { e.target.style.borderColor = isPending ? BORDER : 'rgba(255,255,255,0.06)' }}
                        />
                        {confirming === 'REJECTED' && comentario.trim().length < 5 && (
                            <p style={{ fontFamily: F, fontSize: 11, color: RED, margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <AlertCircle size={11} /> Escribe al menos un motivo para rechazar.
                            </p>
                        )}
                    </div>

                    {/* Acciones */}
                    {isPending && (
                        <div style={{ display: 'flex', gap: 10 }}>
                            {confirming !== 'REJECTED' && (
                                <button
                                    onClick={() => confirming === 'APPROVED' ? handleAction('APPROVED') : setConfirming('APPROVED')}
                                    disabled={saving}
                                    style={{
                                        flex: 1, height: 46, borderRadius: 12, border: 'none',
                                        backgroundColor: confirming === 'APPROVED' ? GREEN : `${GREEN}22`,
                                        color: confirming === 'APPROVED' ? 'white' : GREEN,
                                        fontFamily: F, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                        transition: 'all 0.15s',
                                        boxShadow: confirming === 'APPROVED' ? '0 4px 14px rgba(16,185,129,0.3)' : 'none',
                                    }}
                                >
                                    {saving && confirming === 'APPROVED'
                                        ? <><svg style={{ animation: 'spin 0.8s linear infinite', width: 14, height: 14 }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" /><path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" /></svg>Aprobando…</>
                                        : confirming === 'APPROVED' ? <><Check size={15} strokeWidth={2.5} />Confirmar aprobación</> : <><CheckCircle2 size={15} />Aprobar</>
                                    }
                                </button>
                            )}
                            {confirming !== 'APPROVED' && (
                                <button
                                    onClick={() => confirming === 'REJECTED' ? handleAction('REJECTED') : setConfirming('REJECTED')}
                                    disabled={saving}
                                    style={{
                                        flex: 1, height: 46, borderRadius: 12, border: 'none',
                                        backgroundColor: confirming === 'REJECTED' ? RED : `${RED}18`,
                                        color: confirming === 'REJECTED' ? 'white' : RED,
                                        fontFamily: F, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                        transition: 'all 0.15s',
                                        boxShadow: confirming === 'REJECTED' ? '0 4px 14px rgba(239,68,68,0.3)' : 'none',
                                    }}
                                >
                                    {saving && confirming === 'REJECTED'
                                        ? <><svg style={{ animation: 'spin 0.8s linear infinite', width: 14, height: 14 }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" /><path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" /></svg>Rechazando…</>
                                        : confirming === 'REJECTED' ? <><X size={15} strokeWidth={2.5} />Confirmar rechazo</> : <><XCircle size={15} />Rechazar</>
                                    }
                                </button>
                            )}
                            {confirming && (
                                <button onClick={() => setConfirming(null)} style={{
                                    width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                                    background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(255,255,255,0.08)`,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT_MID,
                                }}>
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    )}

                    {!isPending && pago.comentario && (
                        <div style={{
                            padding: '12px 14px', borderRadius: 10,
                            backgroundColor: pago.status === 'APPROVED' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                            border: `1px solid ${pago.status === 'APPROVED' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                        }}>
                            <p style={{ fontFamily: F, fontSize: 12, color: pago.status === 'APPROVED' ? GREEN : RED, margin: 0, lineHeight: 1.5 }}>
                                {pago.comentario}
                            </p>
                        </div>
                    )}
                </div>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PaymentQueuePage() {
    const [payments, setPayments] = useState<Payment[]>(MOCK_PAYMENTS)
    const [selected, setSelected] = useState<Payment | null>(null)
    const [filter, setFilter] = useState<'ALL' | PayStatus>('PENDING')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const PER_PAGE = 10

    const filtered = payments.filter(p => {
        const matchStatus = filter === 'ALL' || p.status === filter
        const q = search.toLowerCase()
        const matchSearch = !q || p.tenantNombre.toLowerCase().includes(q) || p.referencia.includes(q)
        return matchStatus && matchSearch
    })
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))

    const handleAction = (id: string, action: 'APPROVED' | 'REJECTED', comentario: string) => {
        setPayments(prev => prev.map(p => p.id === id ? { ...p, status: action, comentario } : p))
        setSelected(prev => prev?.id === id ? { ...prev, status: action, comentario } : prev)
    }

    const counts = {
        PENDING: payments.filter(p => p.status === 'PENDING').length,
        APPROVED: payments.filter(p => p.status === 'APPROVED').length,
        REJECTED: payments.filter(p => p.status === 'REJECTED').length,
    }

    return (
        <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <style>{`
                @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
                .pq-row:hover{background:${CARD_HI}!important;}
                .pq-input:focus{outline:none;border-color:${PRIMARY}!important;}
            `}</style>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, animation: 'fadeUp 0.35s ease both' }}>
                <div>
                    <p style={{
                        fontFamily: F, fontSize: 12, fontWeight: 700, margin: '0 0 3px',
                        background: `linear-gradient(135deg,${PRIMARY},${LILAC})`,
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    }}>SuperAdmin · Facturación</p>
                    <h1 style={{ fontFamily: F, fontSize: 28, fontWeight: 900, color: TEXT, margin: '0 0 2px', letterSpacing: '-0.025em', lineHeight: 1 }}>
                        Cola de Pagos
                    </h1>
                    <p style={{ fontFamily: F, fontSize: 12, color: TEXT_SUB, margin: 0 }}>
                        Valida los comprobantes de pago de los tenants
                    </p>
                </div>
            </div>

            {/* Stat pills */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', animation: 'fadeUp 0.35s 0.05s ease both' }}>
                {([['ALL', 'Todos', payments.length, TEXT_SUB], ['PENDING', 'Pendientes', counts.PENDING, AMBER], ['APPROVED', 'Aprobados', counts.APPROVED, GREEN], ['REJECTED', 'Rechazados', counts.REJECTED, RED]] as const).map(([key, label, count, color]) => (
                    <button
                        key={key}
                        onClick={() => { setFilter(key as typeof filter); setPage(1) }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 7,
                            padding: '8px 14px', borderRadius: 10,
                            border: `1px solid ${filter === key ? color + '40' : 'rgba(255,255,255,0.07)'}`,
                            backgroundColor: filter === key ? `${color}15` : 'transparent',
                            cursor: 'pointer', transition: 'all 0.15s',
                        }}
                    >
                        <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: filter === key ? color : TEXT_MID }}>{label}</span>
                        <span style={{
                            fontFamily: MONO, fontSize: 11, fontWeight: 700,
                            color: filter === key ? color : TEXT_SUB,
                            backgroundColor: `${color}15`, padding: '1px 7px', borderRadius: 6,
                        }}>{count}</span>
                    </button>
                ))}
            </div>

            {/* Tabla */}
            <div style={{ backgroundColor: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: '0 4px 24px rgba(0,0,0,0.4)', overflow: 'hidden', animation: 'fadeUp 0.35s 0.1s ease both' }}>

                {/* Toolbar */}
                <div style={{ padding: '14px 18px', borderBottom: `1px solid rgba(255,255,255,0.06)`, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, position: 'relative', maxWidth: 320 }}>
                        <Search size={14} color={TEXT_SUB} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            className="pq-input"
                            placeholder="Buscar por empresa o referencia..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1) }}
                            style={{
                                width: '100%', boxSizing: 'border-box',
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 10, padding: '8px 12px 8px 34px',
                                fontFamily: F, fontSize: 13, color: TEXT,
                                transition: 'border-color 0.2s',
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: TEXT_SUB }}>
                        <Filter size={13} />
                        <span style={{ fontFamily: F, fontSize: 11, color: TEXT_SUB }}>
                            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                        <thead>
                            <tr style={{ borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
                                {['Empresa', 'Plan', 'Referencia', 'Tipo', 'Monto USD', 'Fecha', 'Estado', ''].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontFamily: F, fontSize: 10, fontWeight: 700, color: TEXT_SUB, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center' }}>
                                        <p style={{ fontFamily: F, fontSize: 14, color: TEXT_SUB, margin: 0 }}>No hay pagos con ese filtro.</p>
                                    </td>
                                </tr>
                            ) : paginated.map((p, i) => {
                                const scfg = STATUS_CFG[p.status]
                                return (
                                    <tr
                                        key={p.id}
                                        className="pq-row"
                                        style={{ borderBottom: `1px solid rgba(255,255,255,0.04)`, cursor: 'pointer', transition: 'background 0.12s' }}
                                        onClick={() => setSelected(p)}
                                    >
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{
                                                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                                                    background: `linear-gradient(135deg, ${PRIMARY}, ${SEC})`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: 'white', fontSize: 11, fontWeight: 800,
                                                }}>{p.tenantNombre[0]}</div>
                                                <div>
                                                    <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: TEXT, margin: 0 }}>{p.tenantNombre}</p>
                                                    <p style={{ fontFamily: MONO, fontSize: 10, color: TEXT_SUB, margin: 0 }}>{p.tenantRif}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: PLAN_COLOR[p.plan] }}>{p.plan}</span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{ fontFamily: MONO, fontSize: 11, color: TEXT_MID }}>{p.referencia}</span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{ fontFamily: F, fontSize: 12, color: TEXT_MID }}>
                                                {p.tipoPago === 'PAGO_MOVIL' ? 'Pago Móvil' : 'Transferencia'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 800, color: GREEN }}>${p.montoUSD}</span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{ fontFamily: MONO, fontSize: 11, color: TEXT_SUB }}>{p.fechaPago}</span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                                padding: '3px 9px', borderRadius: 20,
                                                backgroundColor: scfg.bg, color: scfg.color,
                                                fontFamily: F, fontSize: 11, fontWeight: 700,
                                            }}>
                                                {scfg.icon} {scfg.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <button style={{
                                                background: `${PRIMARY}18`, border: `1px solid ${BORDER}`,
                                                borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
                                                fontFamily: F, fontSize: 11, fontWeight: 700, color: PRIMARY,
                                                display: 'flex', alignItems: 'center', gap: 4,
                                            }}>
                                                <Eye size={12} /> Ver
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ padding: '12px 18px', borderTop: `1px solid rgba(255,255,255,0.06)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: F, fontSize: 12, color: TEXT_SUB }}>
                            Página {page} de {totalPages} · {filtered.length} resultados
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: 'transparent', cursor: 'pointer', color: TEXT_MID, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === 1 ? 0.4 : 1 }}
                            ><ChevronLeft size={15} /></button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: 'transparent', cursor: 'pointer', color: TEXT_MID, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === totalPages ? 0.4 : 1 }}
                            ><ChevronRight size={15} /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* Panel lateral */}
            {selected && (
                <PaymentPanel
                    pago={selected}
                    onClose={() => setSelected(null)}
                    onAction={handleAction}
                />
            )}
        </div>
    )
}