import { useState } from 'react'
import {
    Building2, Search, Filter, ChevronLeft, ChevronRight,
    Ban, RefreshCw, ChevronDown, Package, Users, Truck,
    MoreHorizontal, X, Check, AlertTriangle,
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

type TStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED'

interface Tenant {
    id: string
    nombre: string
    rif: string
    email: string
    telefono: string
    plan: 'Starter' | 'Growth' | 'Pro'
    status: TStatus
    ordenesMes: number
    choferes: number
    vehiculos: number
    fechaRegistro: string
    fechaCorte: string
    zonaOperacion: string
    pagosPendientes: number
}

const MOCK_TENANTS: Tenant[] = [
    { id: 't01', nombre: 'DistribuidoraPro C.A.', rif: 'J-30123456-7', email: 'admin@distribuidorapro.com', telefono: '+58 212-800-1100', plan: 'Growth', status: 'ACTIVE', ordenesMes: 312, choferes: 5, vehiculos: 4, fechaRegistro: '2025-10-14', fechaCorte: '2026-05-14', zonaOperacion: 'Caracas', pagosPendientes: 0 },
    { id: 't02', nombre: 'LogiExpress Venezuela', rif: 'J-40234567-8', email: 'ops@logiexpress.ve', telefono: '+58 212-900-2200', plan: 'Pro', status: 'ACTIVE', ordenesMes: 891, choferes: 18, vehiculos: 12, fechaRegistro: '2025-09-02', fechaCorte: '2026-04-28', zonaOperacion: 'Nacional', pagosPendientes: 0 },
    { id: 't03', nombre: 'Reparto Rápido Caracas', rif: 'J-20345678-9', email: 'info@repartorapido.com', telefono: '+58 414-333-4455', plan: 'Starter', status: 'TRIAL', ordenesMes: 44, choferes: 1, vehiculos: 1, fechaRegistro: '2026-04-01', fechaCorte: '2026-04-08', zonaOperacion: 'Caracas', pagosPendientes: 1 },
    { id: 't04', nombre: 'Norte Logística S.A.', rif: 'J-10456789-0', email: 'gerencia@nortelogistica.ve', telefono: '+58 261-555-6677', plan: 'Growth', status: 'ACTIVE', ordenesMes: 228, choferes: 7, vehiculos: 5, fechaRegistro: '2025-11-15', fechaCorte: '2026-05-01', zonaOperacion: 'Maracaibo', pagosPendientes: 1 },
    { id: 't05', nombre: 'Transporte Ávila C.A.', rif: 'J-50567890-1', email: 'contacto@tavila.com', telefono: '+58 212-777-8899', plan: 'Starter', status: 'SUSPENDED', ordenesMes: 0, choferes: 2, vehiculos: 2, fechaRegistro: '2025-12-01', fechaCorte: '2026-03-20', zonaOperacion: 'Caracas', pagosPendientes: 2 },
    { id: 't06', nombre: 'MercaDelivery C.A.', rif: 'J-60678901-2', email: 'admin@mercadelivery.ve', telefono: '+58 424-111-2233', plan: 'Pro', status: 'ACTIVE', ordenesMes: 540, choferes: 12, vehiculos: 9, fechaRegistro: '2025-08-20', fechaCorte: '2026-04-30', zonaOperacion: 'Valencia', pagosPendientes: 1 },
    { id: 't07', nombre: 'FastPack Maracay', rif: 'J-70789012-3', email: 'soporte@fastpack.ve', telefono: '+58 243-222-3344', plan: 'Growth', status: 'ACTIVE', ordenesMes: 187, choferes: 4, vehiculos: 3, fechaRegistro: '2026-01-10', fechaCorte: '2026-05-10', zonaOperacion: 'Maracay', pagosPendientes: 0 },
    { id: 't08', nombre: 'Envíos del Centro C.A.', rif: 'J-80890123-4', email: 'admin@enviosdelcentro.com', telefono: '+58 245-333-4455', plan: 'Starter', status: 'CANCELLED', ordenesMes: 0, choferes: 0, vehiculos: 0, fechaRegistro: '2025-07-05', fechaCorte: '2025-12-05', zonaOperacion: 'Barquisimeto', pagosPendientes: 0 },
    { id: 't09', nombre: 'Despachos Valencia S.A.', rif: 'J-90901234-5', email: 'ops@despachosvlc.com', telefono: '+58 241-444-5566', plan: 'Starter', status: 'TRIAL', ordenesMes: 12, choferes: 1, vehiculos: 1, fechaRegistro: '2026-04-03', fechaCorte: '2026-04-10', zonaOperacion: 'Valencia', pagosPendientes: 0 },
    { id: 't10', nombre: 'Ruta Sur C.A.', rif: 'J-11012345-6', email: 'admin@rutasur.ve', telefono: '+58 274-555-6677', plan: 'Growth', status: 'ACTIVE', ordenesMes: 145, choferes: 3, vehiculos: 3, fechaRegistro: '2026-02-15', fechaCorte: '2026-05-15', zonaOperacion: 'San Cristóbal', pagosPendientes: 0 },
]

const STATUS_CFG: Record<TStatus, { label: string; color: string; bg: string }> = {
    ACTIVE: { label: 'Activo', color: GREEN, bg: 'rgba(16,185,129,0.12)' },
    TRIAL: { label: 'Trial', color: AMBER, bg: 'rgba(245,158,11,0.12)' },
    SUSPENDED: { label: 'Suspendido', color: RED, bg: 'rgba(239,68,68,0.12)' },
    CANCELLED: { label: 'Cancelado', color: TEXT_SUB, bg: 'rgba(255,255,255,0.06)' },
}

const PLAN_COLOR: Record<string, string> = { Starter: TEXT_MID, Growth: SEC, Pro: PINK }

// ── Confirm modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ tenant, action, onConfirm, onCancel }: {
    tenant: Tenant
    action: 'SUSPENDED' | 'ACTIVE'
    onConfirm: () => void
    onCancel: () => void
}) {
    const isSuspend = action === 'SUSPENDED'
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 300,
            backgroundColor: 'rgba(10,5,20,0.85)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
        }} onClick={e => e.target === e.currentTarget && onCancel()}>
            <div style={{
                backgroundColor: BG, border: `1px solid ${BORDER}`,
                borderRadius: 18, padding: '28px 28px 24px',
                width: '100%', maxWidth: 400, boxShadow: SHADOW,
                animation: 'popIn 0.2s ease both',
            }}>
                <style>{`@keyframes popIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}`}</style>
                <div style={{
                    width: 48, height: 48, borderRadius: 13, marginBottom: 16,
                    backgroundColor: isSuspend ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                    border: `1px solid ${isSuspend ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {isSuspend ? <Ban size={22} color={RED} /> : <RefreshCw size={22} color={GREEN} />}
                </div>
                <h3 style={{ fontFamily: F, fontSize: 18, fontWeight: 800, color: TEXT, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                    {isSuspend ? 'Suspender tenant' : 'Reactivar tenant'}
                </h3>
                <p style={{ fontFamily: F, fontSize: 13, color: TEXT_MID, margin: '0 0 20px', lineHeight: 1.6 }}>
                    {isSuspend
                        ? <>¿Confirmas que quieres suspender a <strong style={{ color: TEXT }}>{tenant.nombre}</strong>? El equipo perderá acceso inmediatamente.</>
                        : <>¿Confirmas que quieres reactivar a <strong style={{ color: TEXT }}>{tenant.nombre}</strong>? Recuperarán acceso completo al sistema.</>
                    }
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1, height: 44, borderRadius: 11, border: 'none',
                            backgroundColor: isSuspend ? RED : GREEN,
                            color: 'white', fontFamily: F, fontSize: 13, fontWeight: 700,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            boxShadow: `0 4px 14px ${isSuspend ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                        }}
                    >
                        {isSuspend ? <><Ban size={14} /> Suspender</> : <><Check size={14} strokeWidth={2.5} /> Reactivar</>}
                    </button>
                    <button
                        onClick={onCancel}
                        style={{
                            flex: 1, height: 44, borderRadius: 11,
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            border: `1px solid rgba(255,255,255,0.08)`,
                            color: TEXT_MID, fontFamily: F, fontSize: 13, fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Tenant detail panel ───────────────────────────────────────────────────────
function TenantPanel({ tenant, onClose, onAction }: {
    tenant: Tenant
    onClose: () => void
    onAction: (id: string, action: TStatus) => void
}) {
    const [confirm, setConfirm] = useState<'SUSPENDED' | 'ACTIVE' | null>(null)
    const scfg = STATUS_CFG[tenant.status]
    const canSuspend = tenant.status === 'ACTIVE' || tenant.status === 'TRIAL'
    const canActivate = tenant.status === 'SUSPENDED'

    return (
        <>
            <div style={{
                position: 'fixed', inset: 0, zIndex: 200,
                backgroundColor: 'rgba(10,5,20,0.8)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
            }} onClick={e => e.target === e.currentTarget && onClose()}>
                <div style={{
                    width: '100%', maxWidth: 460, height: '100dvh', overflowY: 'auto',
                    backgroundColor: BG, borderLeft: `1px solid ${BORDER}`,
                    display: 'flex', flexDirection: 'column',
                    animation: 'slideIn 0.25s ease both',
                }}>
                    <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

                    {/* Header */}
                    <div style={{ padding: '16px 20px', borderBottom: `1px solid rgba(255,255,255,0.06)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                        <span style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: TEXT }}>Detalle del tenant</span>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_MID, display: 'flex', padding: 4 }}>
                            <X size={18} />
                        </button>
                    </div>

                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1, overflowY: 'auto' }}>

                        {/* Empresa header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{
                                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                                background: `linear-gradient(135deg, ${PRIMARY}, ${SEC})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontSize: 20, fontWeight: 900,
                                boxShadow: `0 4px 16px rgba(139,92,246,0.3)`,
                            }}>
                                {tenant.nombre[0]}
                            </div>
                            <div>
                                <p style={{ fontFamily: F, fontSize: 17, fontWeight: 800, color: TEXT, margin: '0 0 3px', letterSpacing: '-0.01em' }}>{tenant.nombre}</p>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <span style={{ fontFamily: MONO, fontSize: 11, color: TEXT_SUB }}>{tenant.rif}</span>
                                    <span style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: PLAN_COLOR[tenant.plan] }}>{tenant.plan}</span>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                        padding: '2px 8px', borderRadius: 20,
                                        backgroundColor: scfg.bg, color: scfg.color,
                                        fontFamily: F, fontSize: 10, fontWeight: 700,
                                    }}>
                                        <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: scfg.color, display: 'inline-block' }} />
                                        {scfg.label}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Métricas */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                            {[
                                { icon: <Package size={15} />, label: 'Órdenes/mes', val: tenant.ordenesMes },
                                { icon: <Users size={15} />, label: 'Choferes', val: tenant.choferes },
                                { icon: <Truck size={15} />, label: 'Vehículos', val: tenant.vehiculos },
                            ].map(m => (
                                <div key={m.label} style={{
                                    backgroundColor: CARD, borderRadius: 12,
                                    border: `1px solid ${BORDER}`, padding: '12px 14px',
                                    display: 'flex', flexDirection: 'column', gap: 4,
                                }}>
                                    <div style={{ color: PRIMARY }}>{m.icon}</div>
                                    <p style={{ fontFamily: MONO, fontSize: 20, fontWeight: 900, color: TEXT, margin: 0 }}>{m.val}</p>
                                    <p style={{ fontFamily: F, fontSize: 10, color: TEXT_SUB, margin: 0 }}>{m.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Info */}
                        <div style={{ backgroundColor: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
                            <div style={{ padding: '10px 16px', borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
                                <span style={{ fontFamily: F, fontSize: 10, fontWeight: 700, color: TEXT_SUB, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Información</span>
                            </div>
                            {[
                                { label: 'Email', val: tenant.email },
                                { label: 'Teléfono', val: tenant.telefono },
                                { label: 'Zona', val: tenant.zonaOperacion },
                                { label: 'Registro', val: new Date(tenant.fechaRegistro).toLocaleDateString('es-VE') },
                                { label: 'Corte', val: new Date(tenant.fechaCorte).toLocaleDateString('es-VE') },
                                ...(tenant.pagosPendientes > 0 ? [{ label: 'Pagos pendientes', val: String(tenant.pagosPendientes), highlight: AMBER }] : []),
                            ].map((row: any, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                                    <span style={{ fontFamily: F, fontSize: 12, color: TEXT_MID }}>{row.label}</span>
                                    <span style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: row.highlight ?? TEXT }}>{row.val}</span>
                                </div>
                            ))}
                        </div>

                        {/* Trial warning */}
                        {tenant.status === 'TRIAL' && (
                            <div style={{ padding: '11px 14px', borderRadius: 10, backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', gap: 8 }}>
                                <AlertTriangle size={15} color={AMBER} style={{ flexShrink: 0, marginTop: 1 }} />
                                <p style={{ fontFamily: F, fontSize: 12, color: AMBER, margin: 0, lineHeight: 1.5 }}>
                                    Trial activo hasta el {new Date(tenant.fechaCorte).toLocaleDateString('es-VE', { day: 'numeric', month: 'long' })}. Debe registrar un pago para continuar.
                                </p>
                            </div>
                        )}

                        {/* Acciones */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
                            {canSuspend && (
                                <button
                                    onClick={() => setConfirm('SUSPENDED')}
                                    style={{
                                        width: '100%', height: 44, borderRadius: 11, border: 'none',
                                        backgroundColor: 'rgba(239,68,68,0.1)', color: RED,
                                        fontFamily: F, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.18)')}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)')}
                                >
                                    <Ban size={15} /> Suspender tenant
                                </button>
                            )}
                            {canActivate && (
                                <button
                                    onClick={() => setConfirm('ACTIVE')}
                                    style={{
                                        width: '100%', height: 44, borderRadius: 11, border: 'none',
                                        backgroundColor: `${GREEN}18`, color: GREEN,
                                        fontFamily: F, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = `${GREEN}28`)}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = `${GREEN}18`)}
                                >
                                    <RefreshCw size={15} /> Reactivar tenant
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {confirm && (
                <ConfirmModal
                    tenant={tenant}
                    action={confirm}
                    onConfirm={() => { onAction(tenant.id, confirm); setConfirm(null) }}
                    onCancel={() => setConfirm(null)}
                />
            )}
        </>
    )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>(MOCK_TENANTS)
    const [selected, setSelected] = useState<Tenant | null>(null)
    const [filter, setFilter] = useState<'ALL' | TStatus>('ALL')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const PER_PAGE = 8

    const filtered = tenants.filter(t => {
        const matchStatus = filter === 'ALL' || t.status === filter
        const q = search.toLowerCase()
        const matchSearch = !q || t.nombre.toLowerCase().includes(q) || t.rif.toLowerCase().includes(q) || t.zonaOperacion.toLowerCase().includes(q)
        return matchStatus && matchSearch
    })
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))

    const handleAction = (id: string, action: TStatus) => {
        setTenants(prev => prev.map(t => t.id === id ? { ...t, status: action } : t))
        setSelected(prev => prev?.id === id ? { ...prev, status: action } : prev)
    }

    const counts: Record<string, number> = {
        ALL: tenants.length,
        ACTIVE: tenants.filter(t => t.status === 'ACTIVE').length,
        TRIAL: tenants.filter(t => t.status === 'TRIAL').length,
        SUSPENDED: tenants.filter(t => t.status === 'SUSPENDED').length,
        CANCELLED: tenants.filter(t => t.status === 'CANCELLED').length,
    }

    return (
        <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <style>{`
                @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
                .tn-row:hover{background:${CARD_HI}!important;}
                .tn-input:focus{outline:none;border-color:${PRIMARY}!important;}
                .tn-btn:hover{border-color:${PRIMARY}40!important;}
            `}</style>

            {/* Header */}
            <div style={{ animation: 'fadeUp 0.35s ease both' }}>
                <p style={{
                    fontFamily: F, fontSize: 12, fontWeight: 700, margin: '0 0 3px',
                    background: `linear-gradient(135deg,${PRIMARY},${LILAC})`,
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>SuperAdmin · Gestión</p>
                <h1 style={{ fontFamily: F, fontSize: 28, fontWeight: 900, color: TEXT, margin: '0 0 2px', letterSpacing: '-0.025em', lineHeight: 1 }}>
                    Tenants
                </h1>
                <p style={{ fontFamily: F, fontSize: 12, color: TEXT_SUB, margin: 0 }}>
                    {tenants.length} empresas registradas en el sistema
                </p>
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', animation: 'fadeUp 0.35s 0.05s ease both' }}>
                {([
                    ['ALL', 'Todos', TEXT_SUB],
                    ['ACTIVE', 'Activos', GREEN],
                    ['TRIAL', 'Trial', AMBER],
                    ['SUSPENDED', 'Suspendidos', RED],
                    ['CANCELLED', 'Cancelados', TEXT_SUB],
                ] as const).map(([key, label, color]) => (
                    <button
                        key={key}
                        onClick={() => { setFilter(key as typeof filter); setPage(1) }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '7px 13px', borderRadius: 10,
                            border: `1px solid ${filter === key ? color + '40' : 'rgba(255,255,255,0.07)'}`,
                            backgroundColor: filter === key ? `${color}12` : 'transparent',
                            cursor: 'pointer', transition: 'all 0.15s',
                        }}
                    >
                        <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: filter === key ? color : TEXT_MID }}>{label}</span>
                        <span style={{
                            fontFamily: MONO, fontSize: 11, fontWeight: 700,
                            backgroundColor: `${color}15`, color: filter === key ? color : TEXT_SUB,
                            padding: '1px 6px', borderRadius: 5,
                        }}>{counts[key]}</span>
                    </button>
                ))}
            </div>

            {/* Table */}
            <div style={{ backgroundColor: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: SHADOW, overflow: 'hidden', animation: 'fadeUp 0.35s 0.1s ease both' }}>

                {/* Search */}
                <div style={{ padding: '14px 18px', borderBottom: `1px solid rgba(255,255,255,0.06)`, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, position: 'relative', maxWidth: 340 }}>
                        <Search size={14} color={TEXT_SUB} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            className="tn-input"
                            placeholder="Buscar por nombre, RIF o ciudad..."
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Filter size={13} color={TEXT_SUB} />
                        <span style={{ fontFamily: F, fontSize: 11, color: TEXT_SUB }}>
                            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 750 }}>
                        <thead>
                            <tr style={{ borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
                                {['Empresa', 'Plan', 'Estado', 'Órdenes/mes', 'Zona', 'Corte', ''].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontFamily: F, fontSize: 10, fontWeight: 700, color: TEXT_SUB, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center' }}>
                                        <p style={{ fontFamily: F, fontSize: 14, color: TEXT_SUB, margin: 0 }}>No hay tenants con ese filtro.</p>
                                    </td>
                                </tr>
                            ) : paginated.map(t => {
                                const scfg = STATUS_CFG[t.status]
                                return (
                                    <tr
                                        key={t.id}
                                        className="tn-row"
                                        style={{ borderBottom: `1px solid rgba(255,255,255,0.04)`, cursor: 'pointer', transition: 'background 0.12s' }}
                                        onClick={() => setSelected(t)}
                                    >
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{
                                                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                                                    background: `linear-gradient(135deg, ${PRIMARY}, ${SEC})`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: 'white', fontSize: 12, fontWeight: 800,
                                                }}>{t.nombre[0]}</div>
                                                <div>
                                                    <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: TEXT, margin: '0 0 1px' }}>{t.nombre}</p>
                                                    <p style={{ fontFamily: MONO, fontSize: 10, color: TEXT_SUB, margin: 0 }}>{t.rif}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: PLAN_COLOR[t.plan] }}>{t.plan}</span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                                padding: '3px 9px', borderRadius: 20,
                                                backgroundColor: scfg.bg, color: scfg.color,
                                                fontFamily: F, fontSize: 11, fontWeight: 700,
                                            }}>
                                                <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: scfg.color, display: 'inline-block' }} />
                                                {scfg.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: t.ordenesMes > 0 ? TEXT : TEXT_SUB }}>
                                                {t.ordenesMes}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{ fontFamily: F, fontSize: 12, color: TEXT_MID }}>{t.zonaOperacion}</span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span style={{ fontFamily: MONO, fontSize: 11, color: TEXT_MID }}>
                                                    {new Date(t.fechaCorte).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: '2-digit' })}
                                                </span>
                                                {t.pagosPendientes > 0 && (
                                                    <span style={{
                                                        width: 16, height: 16, borderRadius: '50%',
                                                        backgroundColor: `${AMBER}22`, color: AMBER,
                                                        fontFamily: MONO, fontSize: 9, fontWeight: 700,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}>{t.pagosPendientes}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <button
                                                className="tn-btn"
                                                style={{
                                                    background: `${PRIMARY}12`, border: `1px solid ${BORDER}`,
                                                    borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
                                                    fontFamily: F, fontSize: 11, fontWeight: 700, color: SEC,
                                                    display: 'flex', alignItems: 'center', gap: 4,
                                                    transition: 'border-color 0.15s',
                                                }}
                                            >
                                                <MoreHorizontal size={13} /> Ver
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div style={{ padding: '12px 18px', borderTop: `1px solid rgba(255,255,255,0.06)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: F, fontSize: 12, color: TEXT_SUB }}>
                            Página {page} de {totalPages} · {filtered.length} tenants
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: 'transparent', cursor: 'pointer', color: TEXT_MID, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === 1 ? 0.4 : 1 }}>
                                <ChevronLeft size={15} />
                            </button>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${BORDER}`, backgroundColor: 'transparent', cursor: 'pointer', color: TEXT_MID, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === totalPages ? 0.4 : 1 }}>
                                <ChevronRight size={15} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {selected && (
                <TenantPanel
                    tenant={selected}
                    onClose={() => setSelected(null)}
                    onAction={handleAction}
                />
            )}
        </div>
    )
}