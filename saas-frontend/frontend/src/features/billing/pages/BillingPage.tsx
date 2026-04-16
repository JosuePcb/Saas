import { useState, useEffect, useRef } from 'react'
import {
    CreditCard, Upload, Check, Clock, X, AlertTriangle,
    ChevronDown, Calendar, DollarSign, Building2, ArrowUpRight,
    FileText, Eye, EyeOff, Zap, RefreshCw, Info
} from 'lucide-react'

const F = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

const PINK = '#EC4899'
const LILAC = '#D8B4FE'
const AMBER = '#d97706'
const GREEN = '#10b981'
const TEXT = '#f1f0ff'
const TEXT_SUB = 'rgba(200,190,255,0.5)'
const BORDER = 'rgba(255,255,255,0.07)'
const CARD = '#211119'
const INPUT_BG = 'rgba(255,255,255,0.06)'
const INPUT_BD = 'rgba(255,255,255,0.10)'

// ── Responsive hook ───────────────────────────────────────────────────────────
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    useEffect(() => {
        const h = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', h)
        return () => window.removeEventListener('resize', h)
    }, [])
    return isMobile
}

// ── Types ─────────────────────────────────────────────────────────────────────
type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
type PaymentMethod = 'PAGO_MOVIL' | 'TRANSFERENCIA'
type TenantStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED'
type PlanName = 'Starter' | 'Growth' | 'Pro'

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_SUBSCRIPTION = {
    plan: 'Growth' as PlanName,
    estado: 'ACTIVE' as TenantStatus,
    fechaInicio: '2026-02-14',
    fechaCorte: '2026-04-14',
    diasRestantes: 25,
    precioUSD: 35,
    precioBs: 1505,
}

const MOCK_PAYMENTS = [
    { id: '1', referencia: '20260214001', metodo: 'PAGO_MOVIL' as PaymentMethod, bancoOrigen: 'Banco de Venezuela', bancoDestino: 'Banesco', monto: 35, fecha: '2026-02-14', estado: 'APPROVED' as PaymentStatus, comentario: 'Pago verificado correctamente' },
    { id: '2', referencia: '20260114002', metodo: 'TRANSFERENCIA' as PaymentMethod, bancoOrigen: 'Mercantil', bancoDestino: 'Banesco', monto: 35, fecha: '2026-01-14', estado: 'APPROVED' as PaymentStatus, comentario: '' },
    { id: '3', referencia: '20251214003', metodo: 'PAGO_MOVIL' as PaymentMethod, bancoOrigen: 'BBVA Provincial', bancoDestino: 'Banesco', monto: 35, fecha: '2025-12-14', estado: 'APPROVED' as PaymentStatus, comentario: '' },
    { id: '4', referencia: '20260310004', metodo: 'PAGO_MOVIL' as PaymentMethod, bancoOrigen: 'Banesco', bancoDestino: 'Banesco', monto: 35, fecha: '2026-03-10', estado: 'PENDING' as PaymentStatus, comentario: '' },
]

const PLANS = [
    { nombre: 'Starter' as PlanName, precioUSD: 15, choferes: 3, ordenes: '300/mes', vehiculos: 2, ia: false, iaRoutes: false },
    { nombre: 'Growth' as PlanName, precioUSD: 35, choferes: 10, ordenes: '1,000/mes', vehiculos: 5, ia: true, iaRoutes: false },
    { nombre: 'Pro' as PlanName, precioUSD: 75, choferes: 999, ordenes: 'Ilimitadas', vehiculos: 999, ia: true, iaRoutes: true },
]

const BANCOS_VE = [
    'Banco de Venezuela', 'Banesco', 'BBVA Provincial', 'Mercantil',
    'Banco Exterior', 'Bicentenario', 'Venezolano de Crédito',
    'Banco Nacional de Crédito', 'Sofitasa', 'Caroní',
]

const EMPTY_FORM = {
    metodo: 'PAGO_MOVIL' as PaymentMethod,
    referencia: '', bancoOrigen: '', bancoDestino: 'Banesco',
    monto: '', fecha: new Date().toISOString().split('T')[0],
    comprobante: null as File | null,
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<PaymentStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
    PENDING: { label: 'Pendiente', color: AMBER, bg: 'rgba(217,119,6,0.1)', border: 'rgba(217,119,6,0.25)', icon: <Clock size={12} /> },
    APPROVED: { label: 'Aprobado', color: GREEN, bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', icon: <Check size={12} strokeWidth={3} /> },
    REJECTED: { label: 'Rechazado', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', icon: <X size={12} strokeWidth={3} /> },
}

const TENANT_CFG: Record<TenantStatus, { label: string; color: string }> = {
    TRIAL: { label: 'Trial', color: AMBER },
    ACTIVE: { label: 'Activa', color: GREEN },
    SUSPENDED: { label: 'Suspendida', color: '#ef4444' },
}

function formatDate(iso: string) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Validation ────────────────────────────────────────────────────────────────
function validatePaymentForm(f: typeof EMPTY_FORM) {
    const errs: Record<string, string> = {}
    const ref = f.referencia.trim()
    if (!ref) errs.referencia = 'La referencia es requerida'
    else if (ref.length < 6) errs.referencia = 'Mínimo 6 dígitos'
    else if (!/^\d+$/.test(ref)) errs.referencia = 'Solo números'
    if (!f.bancoOrigen) errs.bancoOrigen = 'Selecciona el banco de origen'
    if (!f.monto) errs.monto = 'El monto es requerido'
    else if (isNaN(Number(f.monto)) || Number(f.monto) <= 0) errs.monto = 'Monto inválido'
    if (!f.fecha) errs.fecha = 'La fecha es requerida'
    if (!f.comprobante) errs.comprobante = 'Debes adjuntar el comprobante'
    return errs
}

// ── DarkInput ─────────────────────────────────────────────────────────────────
function DarkInput({ label, value, onChange, placeholder = '', error, hint, required = false, type = 'text', maxLength, prefix }: {
    label: string; value: string; onChange: (v: string) => void
    placeholder?: string; error?: string; hint?: string
    required?: boolean; type?: string; maxLength?: number; prefix?: React.ReactNode
}) {
    const [focused, setFocused] = useState(false)
    return (
        <div>
            <label style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: TEXT_SUB, display: 'block', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {label} {required && <span style={{ color: PINK }}>*</span>}
                {maxLength && <span style={{ fontWeight: 400, color: 'rgba(167,139,250,0.4)', marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>({value.length}/{maxLength})</span>}
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                {prefix && <span style={{ position: 'absolute', left: 14, color: PINK, fontWeight: 700, fontSize: 15, pointerEvents: 'none' }}>{prefix}</span>}
                <input
                    type={type} value={value}
                    onChange={e => onChange(e.target.value)}
                    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    placeholder={placeholder} maxLength={maxLength}
                    style={{
                        width: '100%', height: 42, borderRadius: 10, boxSizing: 'border-box',
                        border: `1.5px solid ${error ? '#ef4444' : focused ? PINK : INPUT_BD}`,
                        backgroundColor: focused ? 'rgba(255,255,255,0.08)' : INPUT_BG,
                        padding: prefix ? '0 14px 0 32px' : '0 14px',
                        fontFamily: F, fontSize: 14, color: TEXT, outline: 'none',
                        boxShadow: focused ? `0 0 0 3px ${error ? 'rgba(239,68,68,0.15)' : 'rgba(236,72,153,0.12)'}` : 'none',
                        transition: 'all 0.15s',
                    }}
                />
            </div>
            {error && <p style={{ fontFamily: F, fontSize: 11, color: '#ef4444', margin: '4px 0 0 2px' }}>{error}</p>}
            {hint && !error && <p style={{ fontFamily: F, fontSize: 11, color: TEXT_SUB, margin: '4px 0 0 2px' }}>{hint}</p>}
        </div>
    )
}

function DarkSelect({ label, value, onChange, options, required = false, error }: {
    label: string; value: string; onChange: (v: string) => void
    options: { value: string; label: string }[]; required?: boolean; error?: string
}) {
    const [focused, setFocused] = useState(false)
    return (
        <div>
            <label style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: TEXT_SUB, display: 'block', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {label} {required && <span style={{ color: PINK }}>*</span>}
            </label>
            <div style={{ position: 'relative' }}>
                <select value={value} onChange={e => onChange(e.target.value)}
                    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    style={{
                        width: '100%', height: 42, borderRadius: 10, boxSizing: 'border-box', appearance: 'none',
                        border: `1.5px solid ${error ? '#ef4444' : focused ? PINK : INPUT_BD}`,
                        backgroundColor: focused ? 'rgba(255,255,255,0.08)' : INPUT_BG,
                        padding: '0 36px 0 14px', fontFamily: F, fontSize: 14, color: TEXT, outline: 'none',
                        boxShadow: focused ? '0 0 0 3px rgba(236,72,153,0.12)' : 'none',
                        transition: 'all 0.15s', cursor: 'pointer',
                    }}>
                    {options.map(o => <option key={o.value} value={o.value} style={{ backgroundColor: '#211119' }}>{o.label}</option>)}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: TEXT_SUB, pointerEvents: 'none' }} />
            </div>
            {error && <p style={{ fontFamily: F, fontSize: 11, color: '#ef4444', margin: '4px 0 0 2px' }}>{error}</p>}
        </div>
    )
}

// ── Subscription card ─────────────────────────────────────────────────────────
function SubscriptionCard({ isMobile }: { isMobile: boolean }) {
    const sub = MOCK_SUBSCRIPTION
    const plan = PLANS.find(p => p.nombre === sub.plan)!
    const tenantCfg = TENANT_CFG[sub.estado]
    const pct = Math.max(0, Math.min(100, (sub.diasRestantes / 30) * 100))
    const urgente = sub.diasRestantes <= 7

    return (
        <div style={{
            backgroundColor: CARD, borderRadius: 16,
            border: `1px solid ${urgente ? 'rgba(217,119,6,0.3)' : BORDER}`,
            padding: 24, position: 'relative', overflow: 'hidden',
        }}>
            {/* Deco */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: `radial-gradient(circle, ${urgente ? 'rgba(217,119,6,0.08)' : 'rgba(236,72,153,0.07)'}, transparent 70%)`, pointerEvents: 'none' }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#EC4899,#D8B4FE)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Zap size={15} color="white" fill="white" />
                        </div>
                        <div>
                            <p style={{ fontFamily: F, fontSize: 16, fontWeight: 900, color: TEXT, margin: 0 }}>Plan {sub.plan}</p>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 20, backgroundColor: `${tenantCfg.color}18`, border: `1px solid ${tenantCfg.color}40`, color: tenantCfg.color, fontFamily: F, fontSize: 10, fontWeight: 700 }}>
                                <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: tenantCfg.color, display: 'inline-block' }} />
                                {tenantCfg.label}
                            </span>
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
                    <p style={{ fontFamily: MONO, fontSize: 28, fontWeight: 900, color: PINK, margin: 0, lineHeight: 1 }}>${plan.precioUSD}<span style={{ fontSize: 14, color: TEXT_SUB, fontWeight: 400 }}>/mes</span></p>
                    <p style={{ fontFamily: F, fontSize: 12, color: TEXT_SUB, margin: '4px 0 0' }}>≈ Bs {(plan.precioUSD * 43).toLocaleString()} BCV</p>
                </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 20 }}>
                {[
                    { label: 'Inicio', value: formatDate(sub.fechaInicio), icon: <Calendar size={13} /> },
                    { label: 'Próx. vencimiento', value: formatDate(sub.fechaCorte), icon: <Calendar size={13} /> },
                    { label: 'Choferes', value: plan.choferes > 100 ? 'Ilimitados' : `Hasta ${plan.choferes}`, icon: <CreditCard size={13} /> },
                    { label: 'Órdenes', value: plan.ordenes, icon: <FileText size={13} /> },
                ].map(s => (
                    <div key={s.label} style={{ padding: '10px 12px', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                            <span style={{ color: TEXT_SUB }}>{s.icon}</span>
                            <p style={{ fontFamily: F, fontSize: 10, color: TEXT_SUB, margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</p>
                        </div>
                        <p style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: TEXT, margin: 0 }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Days remaining bar */}
            <div style={{ marginBottom: urgente ? 12 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <p style={{ fontFamily: F, fontSize: 12, color: TEXT_SUB, margin: 0 }}>Tiempo restante del período</p>
                    <p style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: urgente ? AMBER : TEXT, margin: 0 }}>{sub.diasRestantes} días</p>
                </div>
                <div style={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)' }}>
                    <div style={{
                        height: '100%', borderRadius: 2,
                        width: `${pct}%`,
                        background: urgente ? `linear-gradient(90deg, #ef4444, ${AMBER})` : `linear-gradient(90deg, ${GREEN}, ${PINK})`,
                        transition: 'width 0.6s ease',
                    }} />
                </div>
            </div>

            {/* Urgency warning */}
            {urgente && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, backgroundColor: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.2)', marginTop: 12 }}>
                    <AlertTriangle size={14} color={AMBER} />
                    <p style={{ fontFamily: F, fontSize: 12, color: AMBER, margin: 0, fontWeight: 600 }}>
                        Tu suscripción vence en {sub.diasRestantes} días. Registra tu pago para continuar.
                    </p>
                </div>
            )}
        </div>
    )
}

// ── Payment row ───────────────────────────────────────────────────────────────
function PaymentRow({ p, isMobile }: { p: typeof MOCK_PAYMENTS[0]; isMobile: boolean }) {
    const cfg = STATUS_CFG[p.estado]
    return (
        <div style={{
            display: 'flex', alignItems: isMobile ? 'flex-start' : 'center',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 10 : 0,
            padding: '14px 20px',
            borderBottom: `1px solid ${BORDER}`,
            transition: 'background 0.15s',
        }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
            {/* Method icon */}
            <div style={{ width: isMobile ? 'auto' : 40, flexShrink: 0, marginRight: isMobile ? 0 : 16 }}>
                <div style={{
                    width: 34, height: 34, borderRadius: 9,
                    backgroundColor: p.metodo === 'PAGO_MOVIL' ? 'rgba(236,72,153,0.1)' : 'rgba(56,189,248,0.1)',
                    border: `1px solid ${p.metodo === 'PAGO_MOVIL' ? 'rgba(236,72,153,0.2)' : 'rgba(56,189,248,0.2)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {p.metodo === 'PAGO_MOVIL'
                        ? <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 800, color: PINK }}>PM</span>
                        : <ArrowUpRight size={14} color="#38bdf8" />
                    }
                </div>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <p style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: TEXT, margin: 0 }}>{p.referencia}</p>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, fontFamily: F, fontSize: 10, fontWeight: 700 }}>
                        {cfg.icon}{cfg.label}
                    </span>
                </div>
                <p style={{ fontFamily: F, fontSize: 12, color: TEXT_SUB, margin: '3px 0 0' }}>
                    {p.bancoOrigen} → {p.bancoDestino} · {formatDate(p.fecha)}
                </p>
                {p.comentario && (
                    <p style={{ fontFamily: F, fontSize: 11, color: p.estado === 'REJECTED' ? '#ef4444' : GREEN, margin: '3px 0 0', fontStyle: 'italic' }}>
                        "{p.comentario}"
                    </p>
                )}
            </div>

            {/* Amount */}
            <div style={{ flexShrink: 0, textAlign: isMobile ? 'left' : 'right', marginLeft: isMobile ? 0 : 16 }}>
                <p style={{ fontFamily: MONO, fontSize: 16, fontWeight: 800, color: p.estado === 'APPROVED' ? GREEN : TEXT, margin: 0 }}>${p.monto}</p>
                <p style={{ fontFamily: F, fontSize: 11, color: TEXT_SUB, margin: '2px 0 0' }}>USD</p>
            </div>
        </div>
    )
}

// ── Upload zone ───────────────────────────────────────────────────────────────
function UploadZone({ file, onChange, error }: { file: File | null; onChange: (f: File | null) => void; error?: string }) {
    const [dragging, setDragging] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setDragging(false)
        const f = e.dataTransfer.files[0]
        if (f && (f.type.startsWith('image/') || f.type === 'application/pdf')) {
            if (f.size > 5 * 1024 * 1024) return
            onChange(f)
        }
    }

    return (
        <div>
            <label style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: TEXT_SUB, display: 'block', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Comprobante <span style={{ color: PINK }}>*</span>
            </label>
            <div
                onClick={() => inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                style={{
                    borderRadius: 12, border: `2px dashed ${error ? '#ef4444' : dragging ? PINK : file ? GREEN : INPUT_BD}`,
                    backgroundColor: dragging ? 'rgba(236,72,153,0.06)' : file ? 'rgba(16,185,129,0.05)' : INPUT_BG,
                    padding: '20px 16px', textAlign: 'center', cursor: 'pointer',
                    transition: 'all 0.2s',
                }}
            >
                <input ref={inputRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }}
                    onChange={e => {
                        const f = e.target.files?.[0]
                        if (f && f.size <= 5 * 1024 * 1024) onChange(f)
                    }}
                />
                {file ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        <Check size={16} color={GREEN} strokeWidth={3} />
                        <p style={{ fontFamily: F, fontSize: 13, color: GREEN, fontWeight: 600, margin: 0 }}>{file.name}</p>
                        <button onClick={e => { e.stopPropagation(); onChange(null) }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SUB, display: 'flex', padding: 2 }}>
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <>
                        <Upload size={20} color={TEXT_SUB} style={{ margin: '0 auto 8px' }} />
                        <p style={{ fontFamily: F, fontSize: 13, color: TEXT_SUB, margin: '0 0 4px', fontWeight: 600 }}>
                            Arrastra o haz click para subir
                        </p>
                        <p style={{ fontFamily: F, fontSize: 11, color: 'rgba(200,190,255,0.35)', margin: 0 }}>
                            JPG, PNG o PDF · máx. 5MB
                        </p>
                    </>
                )}
            </div>
            {error && <p style={{ fontFamily: F, fontSize: 11, color: '#ef4444', margin: '4px 0 0 2px' }}>{error}</p>}
        </div>
    )
}

// ── Plan card ─────────────────────────────────────────────────────────────────
function PlanCard({ plan, isCurrent }: { plan: typeof PLANS[0]; isCurrent: boolean }) {
    return (
        <div style={{
            padding: '20px 18px', borderRadius: 14,
            border: `1.5px solid ${isCurrent ? PINK : BORDER}`,
            backgroundColor: isCurrent ? 'rgba(236,72,153,0.06)' : CARD,
            position: 'relative', transition: 'all 0.2s',
        }}
            onMouseEnter={e => { if (!isCurrent) (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)') }}
            onMouseLeave={e => { if (!isCurrent) (e.currentTarget.style.borderColor = BORDER) }}
        >
            {isCurrent && (
                <div style={{ position: 'absolute', top: -10, left: 16, padding: '2px 10px', borderRadius: 20, backgroundColor: PINK, fontFamily: F, fontSize: 10, fontWeight: 800, color: 'white' }}>
                    Plan actual
                </div>
            )}
            <p style={{ fontFamily: F, fontSize: 15, fontWeight: 800, color: TEXT, margin: '0 0 4px' }}>{plan.nombre}</p>
            <p style={{ fontFamily: MONO, fontSize: 22, fontWeight: 900, color: isCurrent ? PINK : TEXT, margin: '0 0 14px' }}>
                ${plan.precioUSD}<span style={{ fontSize: 12, color: TEXT_SUB, fontWeight: 400 }}>/mes</span>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                    { label: `${plan.choferes > 100 ? 'Ilimitados' : `Hasta ${plan.choferes}`} choferes` },
                    { label: `${plan.ordenes} órdenes` },
                    { label: `${plan.vehiculos > 100 ? 'Ilimitados' : plan.vehiculos} vehículos` },
                    { label: 'IA normalización', active: plan.ia },
                    { label: 'IA rutas', active: plan.iaRoutes },
                ].map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ color: (f.active === undefined ? true : f.active) ? GREEN : 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
                            {(f.active === undefined ? true : f.active)
                                ? <Check size={12} strokeWidth={3} />
                                : <X size={12} strokeWidth={2} />}
                        </span>
                        <p style={{ fontFamily: F, fontSize: 12, color: (f.active === undefined ? true : f.active) ? TEXT_SUB : 'rgba(255,255,255,0.2)', margin: 0 }}>{f.label}</p>
                    </div>
                ))}
            </div>
            {!isCurrent && (
                <button style={{
                    width: '100%', marginTop: 16, height: 36, borderRadius: 9,
                    border: `1.5px solid ${BORDER}`, backgroundColor: 'rgba(255,255,255,0.04)',
                    color: TEXT_SUB, fontFamily: F, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.15s',
                }}
                    onMouseEnter={e => { (e.currentTarget.style.borderColor = PINK); (e.currentTarget.style.color = PINK) }}
                    onMouseLeave={e => { (e.currentTarget.style.borderColor = BORDER); (e.currentTarget.style.color = TEXT_SUB) }}
                >
                    Cambiar a {plan.nombre}
                </button>
            )}
        </div>
    )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BillingPage() {
    const isMobile = useIsMobile()
    const [tab, setTab] = useState<'resumen' | 'registrar' | 'planes'>('resumen')
    const [form, setForm] = useState(EMPTY_FORM)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [visible, setVisible] = useState(false)

    useEffect(() => { setTimeout(() => setVisible(true), 50) }, [])

    const set = (k: string, v: any) => {
        setForm(f => ({ ...f, [k]: v }))
        setErrors(e => ({ ...e, [k]: '' }))
    }

    const handleSubmit = async () => {
        const errs = validatePaymentForm(form)
        if (Object.keys(errs).length > 0) { setErrors(errs); return }
        setSubmitting(true)
        // TODO: POST /api/billing/payments con FormData (comprobante)
        await new Promise(r => setTimeout(r, 1400))
        setSubmitting(false)
        setSubmitted(true)
        setForm(EMPTY_FORM)
        setTimeout(() => { setSubmitted(false); setTab('resumen') }, 2000)
    }

    const TABS = [
        { key: 'resumen', label: 'Resumen' },
        { key: 'registrar', label: 'Registrar Pago' },
        { key: 'planes', label: 'Planes' },
    ] as const

    return (
        <div style={{ fontFamily: F, opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(8px)', transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontFamily: F, fontSize: 'clamp(22px,4vw,28px)', fontWeight: 900, color: TEXT, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                        Facturación
                    </h1>
                    <p style={{ fontFamily: F, fontSize: 14, color: TEXT_SUB, margin: 0 }}>
                        Gestiona tu suscripción y pagos
                    </p>
                </div>
            </div>

            {/* Tab strip */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, marginBottom: 28, overflowX: 'auto' }} className="scrollbar-hide">
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} style={{
                        padding: '10px 20px', background: 'none', border: 'none',
                        borderBottom: `2px solid ${tab === t.key ? PINK : 'transparent'}`,
                        marginBottom: -1, color: tab === t.key ? PINK : TEXT_SUB,
                        fontFamily: F, fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
                        cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                    }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── TAB: Resumen ── */}
            {tab === 'resumen' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <SubscriptionCard isMobile={isMobile} />

                    {/* Payment history */}
                    <div style={{ backgroundColor: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <p style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>Historial de Pagos</p>
                            <button
                                onClick={() => setTab('registrar')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '7px 14px', borderRadius: 8,
                                    backgroundColor: PINK, border: 'none', color: 'white',
                                    fontFamily: F, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                }}
                            >
                                <Upload size={12} />Registrar pago
                            </button>
                        </div>
                        {MOCK_PAYMENTS.map(p => <PaymentRow key={p.id} p={p} isMobile={isMobile} />)}
                    </div>
                </div>
            )}

            {/* ── TAB: Registrar pago ── */}
            {tab === 'registrar' && (
                <div style={{ maxWidth: 560 }}>
                    {submitted ? (
                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 32px rgba(16,185,129,0.4)', animation: 'pop 0.4s cubic-bezier(0.175,0.885,0.32,1.275)' }}>
                                <Check size={28} color="white" strokeWidth={3} />
                            </div>
                            <p style={{ fontFamily: F, fontSize: 18, fontWeight: 800, color: TEXT, margin: '0 0 6px' }}>¡Pago registrado!</p>
                            <p style={{ fontFamily: F, fontSize: 14, color: TEXT_SUB, margin: 0 }}>Será validado por el equipo en 24-48h</p>
                            <style>{`@keyframes pop{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
                        </div>
                    ) : (
                        <div style={{ backgroundColor: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, padding: 'clamp(16px,4vw,28px)', display: 'flex', flexDirection: 'column', gap: 18 }}>
                            {/* Info banner */}
                            <div style={{ display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 10, backgroundColor: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)' }}>
                                <Info size={14} color="#38bdf8" style={{ flexShrink: 0, marginTop: 1 }} />
                                <p style={{ fontFamily: F, fontSize: 12, color: 'rgba(56,189,248,0.8)', margin: 0, lineHeight: 1.5 }}>
                                    Registra tu Pago Móvil o Transferencia. El SuperAdmin validará tu comprobante en 24-48 horas hábiles.
                                </p>
                            </div>

                            {/* Método */}
                            <div>
                                <label style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: TEXT_SUB, display: 'block', marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                    Método de Pago <span style={{ color: PINK }}>*</span>
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    {(['PAGO_MOVIL', 'TRANSFERENCIA'] as PaymentMethod[]).map(m => (
                                        <button key={m} onClick={() => set('metodo', m)} style={{
                                            padding: '12px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                                            border: `1.5px solid ${form.metodo === m ? PINK : BORDER}`,
                                            backgroundColor: form.metodo === m ? 'rgba(236,72,153,0.08)' : INPUT_BG,
                                            transition: 'all 0.15s',
                                        }}>
                                            <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 800, color: form.metodo === m ? PINK : TEXT_SUB, margin: '0 0 3px', letterSpacing: '0.06em' }}>
                                                {m === 'PAGO_MOVIL' ? 'PM' : 'TRF'}
                                            </p>
                                            <p style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: form.metodo === m ? TEXT : TEXT_SUB, margin: 0 }}>
                                                {m === 'PAGO_MOVIL' ? 'Pago Móvil' : 'Transferencia'}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <DarkInput
                                label="Referencia"
                                value={form.referencia}
                                onChange={v => set('referencia', v.replace(/\D/g, '').slice(0, 20))}
                                placeholder="Ej: 01234567890"
                                error={errors.referencia}
                                required
                                maxLength={20}
                                hint="Solo números, sin espacios ni guiones"
                            />

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                                <DarkSelect
                                    label="Banco origen"
                                    value={form.bancoOrigen}
                                    onChange={v => set('bancoOrigen', v)}
                                    error={errors.bancoOrigen}
                                    required
                                    options={[
                                        { value: '', label: 'Seleccionar banco...' },
                                        ...BANCOS_VE.map(b => ({ value: b, label: b }))
                                    ]}
                                />
                                <DarkSelect
                                    label="Banco destino"
                                    value={form.bancoDestino}
                                    onChange={v => set('bancoDestino', v)}
                                    required
                                    options={BANCOS_VE.map(b => ({ value: b, label: b }))}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
                                <DarkInput
                                    label="Monto (USD)"
                                    value={form.monto}
                                    onChange={v => set('monto', v.replace(/[^0-9.]/g, '').slice(0, 8))}
                                    placeholder="35.00"
                                    error={errors.monto}
                                    required
                                    prefix="$"
                                    hint="Monto en dólares"
                                />
                                <DarkInput
                                    label="Fecha del pago"
                                    value={form.fecha}
                                    onChange={v => set('fecha', v)}
                                    type="date"
                                    error={errors.fecha}
                                    required
                                />
                            </div>

                            <UploadZone
                                file={form.comprobante}
                                onChange={f => set('comprobante', f)}
                                error={errors.comprobante}
                            />

                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                style={{
                                    height: 46, borderRadius: 12, border: 'none',
                                    background: submitting ? 'rgba(236,72,153,0.4)' : 'linear-gradient(135deg,#EC4899,#D8B4FE)',
                                    color: 'white', fontFamily: F, fontSize: 15, fontWeight: 700,
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    boxShadow: submitting ? 'none' : '0 4px 18px rgba(236,72,153,0.4)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    transition: 'all 0.2s',
                                }}
                            >
                                {submitting
                                    ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Enviando...</>
                                    : <><Upload size={15} />Registrar Pago</>
                                }
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── TAB: Planes ── */}
            {tab === 'planes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ padding: '12px 16px', borderRadius: 10, backgroundColor: 'rgba(216,180,254,0.06)', border: '1px solid rgba(216,180,254,0.15)', display: 'flex', gap: 10 }}>
                        <Info size={14} color={LILAC} style={{ flexShrink: 0, marginTop: 1 }} />
                        <p style={{ fontFamily: F, fontSize: 12, color: 'rgba(216,180,254,0.8)', margin: 0, lineHeight: 1.5 }}>
                            Para cambiar de plan contacta al equipo de soporte o registra un pago con el monto del nuevo plan.
                        </p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                        {PLANS.map(p => <PlanCard key={p.nombre} plan={p} isCurrent={p.nombre === MOCK_SUBSCRIPTION.plan} />)}
                    </div>
                </div>
            )}
        </div>
    )
}