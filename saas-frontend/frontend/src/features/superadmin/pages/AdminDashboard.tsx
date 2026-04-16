import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
    Building2, CreditCard, TrendingUp, Users,
    AlertCircle, CheckCircle2, Clock, Ban,
    ChevronRight, ArrowUpRight, ArrowDownRight,
    Activity, Package,
} from 'lucide-react'

const F = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

// ── Paleta SuperAdmin ─────────────────────────────────────────────────────────
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

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_STATS = {
    tenantsActivos: 24,
    tenantsTrial: 7,
    tenantsSuspendidos: 3,
    tenantsCancelados: 2,
    pagosPendientes: 5,
    ingresosMes: 1260,
    ingresosAnterior: 1080,
    totalOrdenesMes: 4820,
    ordenesAnterior: 4210,
}

const MOCK_TENANTS_RECIENTES = [
    { id: 't1', nombre: 'DistribuidoraPro C.A.', rif: 'J-30123456-7', plan: 'Growth', status: 'ACTIVE', ordenesMes: 312, fechaCorte: '2026-05-14', pagosPendientes: 0 },
    { id: 't2', nombre: 'LogiExpress Venezuela', rif: 'J-40234567-8', plan: 'Pro', status: 'ACTIVE', ordenesMes: 891, fechaCorte: '2026-04-28', pagosPendientes: 0 },
    { id: 't3', nombre: 'Reparto Rápido Caracas', rif: 'J-20345678-9', plan: 'Starter', status: 'TRIAL', ordenesMes: 44, fechaCorte: '2026-04-15', pagosPendientes: 1 },
    { id: 't4', nombre: 'Norte Logística S.A.', rif: 'J-10456789-0', plan: 'Growth', status: 'ACTIVE', ordenesMes: 228, fechaCorte: '2026-05-01', pagosPendientes: 1 },
    { id: 't5', nombre: 'Transporte Ávila C.A.', rif: 'J-50567890-1', plan: 'Starter', status: 'SUSPENDED', ordenesMes: 0, fechaCorte: '2026-03-20', pagosPendientes: 2 },
]

const MOCK_PAGOS_PENDIENTES = [
    { id: 'p1', tenant: 'Reparto Rápido Caracas', monto: 15, metodo: 'Pago Móvil', fecha: '2026-04-07', referencia: '20260407-001' },
    { id: 'p2', tenant: 'Norte Logística S.A.', monto: 35, metodo: 'Transferencia', fecha: '2026-04-07', referencia: '20260407-002' },
    { id: 'p3', tenant: 'Transporte Ávila C.A.', monto: 15, metodo: 'Pago Móvil', fecha: '2026-04-06', referencia: '20260406-003' },
    { id: 'p4', tenant: 'MercaDelivery C.A.', monto: 75, metodo: 'Transferencia', fecha: '2026-04-06', referencia: '20260406-004' },
    { id: 'p5', nombre: 'FastPack Maracay', monto: 35, metodo: 'Pago Móvil', fecha: '2026-04-05', referencia: '20260405-005' },
]

const MOCK_CHART = [
    { mes: 'Nov', v: 720 }, { mes: 'Dic', v: 840 }, { mes: 'Ene', v: 900 },
    { mes: 'Feb', v: 980 }, { mes: 'Mar', v: 1080 }, { mes: 'Abr', v: 1260 },
]

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
    ACTIVE: { label: 'Activo', color: GREEN, bg: 'rgba(16,185,129,0.12)' },
    TRIAL: { label: 'Trial', color: AMBER, bg: 'rgba(245,158,11,0.12)' },
    SUSPENDED: { label: 'Suspendido', color: RED, bg: 'rgba(239,68,68,0.12)' },
    CANCELLED: { label: 'Cancelado', color: TEXT_SUB, bg: 'rgba(255,255,255,0.06)' },
}

const PLAN_COLOR: Record<string, string> = {
    Starter: TEXT_MID,
    Growth: SEC,
    Pro: PINK,
}

// ── Mini bar chart ────────────────────────────────────────────────────────────
function RevenueChart() {
    const max = Math.max(...MOCK_CHART.map(d => d.v))
    const W = 320, H = 80
    const pts = MOCK_CHART.map((d, i) => {
        const x = (i / (MOCK_CHART.length - 1)) * (W - 24) + 12
        const y = H - (d.v / max) * (H - 12) - 4
        return `${x},${y}`
    })
    const area = `12,${H} ${pts.join(' ')} ${W - 12},${H}`

    return (
        <svg width="100%" viewBox={`0 0 ${W} ${H + 22}`} preserveAspectRatio="xMidYMid meet">
            <defs>
                <linearGradient id="saArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PRIMARY} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={PRIMARY} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon points={area} fill="url(#saArea)" />
            <polyline points={pts.join(' ')} fill="none" stroke={PRIMARY} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((pt, i) => {
                const [x, y] = pt.split(',').map(Number)
                return (
                    <circle key={i} cx={x} cy={y}
                        r={i === MOCK_CHART.length - 1 ? 4.5 : 3}
                        fill={i === MOCK_CHART.length - 1 ? PRIMARY : CARD}
                        stroke={PRIMARY} strokeWidth="2"
                    />
                )
            })}
            {MOCK_CHART.map((d, i) => {
                const x = (i / (MOCK_CHART.length - 1)) * (W - 24) + 12
                return (
                    <text key={d.mes} x={x} y={H + 16} textAnchor="middle"
                        fontSize="10" fill={TEXT_SUB} fontFamily={F}>{d.mes}</text>
                )
            })}
        </svg>
    )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, trend, trendUp, sub }: {
    label: string; value: string | number; icon: React.ReactNode
    color: string; trend?: string; trendUp?: boolean; sub?: string
}) {
    return (
        <div style={{
            backgroundColor: CARD, borderRadius: 16,
            border: `1px solid ${BORDER}`, boxShadow: SHADOW,
            padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10,
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: TEXT_MID, margin: 0 }}>
                    {label}
                </p>
                <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    backgroundColor: `${color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color, flexShrink: 0,
                }}>
                    {icon}
                </div>
            </div>
            <p style={{ fontFamily: F, fontSize: 36, fontWeight: 900, color: TEXT, margin: 0, lineHeight: 1, letterSpacing: '-0.02em' }}>
                {value}
            </p>
            {trend && (
                <p style={{ fontFamily: F, fontSize: 12, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 4, color: trendUp ? GREEN : RED }}>
                    {trendUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                    {trend}
                </p>
            )}
            {sub && <p style={{ fontFamily: F, fontSize: 11, color: TEXT_SUB, margin: 0 }}>{sub}</p>}
        </div>
    )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
    const [, setHoveredTenant] = useState<string | null>(null)

    const pctChange = (curr: number, prev: number) =>
        `${curr >= prev ? '+' : ''}${Math.round(((curr - prev) / prev) * 100)}% vs mes pasado`

    return (
        <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', gap: 22 }}>
            <style>{`
                @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
                .sa-row:hover { background: ${CARD_HI} !important; }
                .sa-link:hover { color: ${PRIMARY} !important; }
            `}</style>

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, animation: 'fadeUp 0.35s ease both' }}>
                <div>
                    <p style={{
                        fontFamily: F, fontSize: 12, fontWeight: 700, margin: '0 0 3px',
                        background: `linear-gradient(135deg, ${PRIMARY}, ${LILAC})`,
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    }}>
                        SuperAdmin
                    </p>
                    <h1 style={{ fontFamily: F, fontSize: 30, fontWeight: 900, color: TEXT, margin: '0 0 2px', letterSpacing: '-0.03em', lineHeight: 1 }}>
                        Dashboard Global
                    </h1>
                    <p style={{ fontFamily: F, fontSize: 12, color: TEXT_SUB, margin: 0 }}>
                        {new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>

                {/* Pagos pendientes badge */}
                {MOCK_STATS.pagosPendientes > 0 && (
                    <Link to="/app/superadmin/payments" style={{ textDecoration: 'none' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            backgroundColor: 'rgba(245,158,11,0.1)',
                            border: '1px solid rgba(245,158,11,0.3)',
                            borderRadius: 12, padding: '10px 16px',
                            cursor: 'pointer', transition: 'all 0.15s',
                        }}>
                            <div style={{ position: 'relative' }}>
                                <CreditCard size={18} color={AMBER} />
                                <span style={{
                                    position: 'absolute', top: -6, right: -6,
                                    width: 16, height: 16, borderRadius: '50%',
                                    backgroundColor: AMBER, color: BG,
                                    fontSize: 9, fontWeight: 900, fontFamily: F,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {MOCK_STATS.pagosPendientes}
                                </span>
                            </div>
                            <div>
                                <p style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: AMBER, margin: 0 }}>
                                    {MOCK_STATS.pagosPendientes} pagos por validar
                                </p>
                                <p style={{ fontFamily: F, fontSize: 10, color: TEXT_SUB, margin: 0 }}>Ver cola →</p>
                            </div>
                        </div>
                    </Link>
                )}
            </div>

            {/* ── Fila 1: 4 métricas ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, animation: 'fadeUp 0.35s 0.05s ease both' }}>
                <StatCard
                    label="Tenants activos"
                    value={MOCK_STATS.tenantsActivos}
                    icon={<Building2 size={18} />}
                    color={PRIMARY}
                    trend="+3 este mes"
                    trendUp
                />
                <StatCard
                    label="Ingresos del mes"
                    value={`$${MOCK_STATS.ingresosMes}`}
                    icon={<TrendingUp size={18} />}
                    color={GREEN}
                    trend={pctChange(MOCK_STATS.ingresosMes, MOCK_STATS.ingresosAnterior)}
                    trendUp
                />
                <StatCard
                    label="En trial"
                    value={MOCK_STATS.tenantsTrial}
                    icon={<Clock size={18} />}
                    color={AMBER}
                    sub="7 días de prueba gratuita"
                />
                <StatCard
                    label="Pagos pendientes"
                    value={MOCK_STATS.pagosPendientes}
                    icon={<AlertCircle size={18} />}
                    color={MOCK_STATS.pagosPendientes > 0 ? AMBER : GREEN}
                    sub={MOCK_STATS.pagosPendientes > 0 ? 'Requieren validación manual' : 'Todo al día'}
                />
            </div>

            {/* ── Fila 2: Gráfica + distribución por estado ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, animation: 'fadeUp 0.35s 0.1s ease both' }} className="sa-grid-2">
                {/* Gráfica de ingresos */}
                <div style={{ backgroundColor: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: SHADOW, padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Activity size={15} color={PRIMARY} />
                            <span style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: TEXT }}>Ingresos mensuales</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontFamily: F, fontSize: 28, fontWeight: 900, color: PRIMARY, margin: 0, lineHeight: 1, letterSpacing: '-0.02em' }}>
                                ${MOCK_STATS.ingresosMes}
                            </p>
                            <p style={{ fontFamily: F, fontSize: 11, color: GREEN, fontWeight: 600, margin: '2px 0 0' }}>
                                ↑ {pctChange(MOCK_STATS.ingresosMes, MOCK_STATS.ingresosAnterior)}
                            </p>
                        </div>
                    </div>
                    <RevenueChart />
                </div>

                {/* Distribución tenants */}
                <div style={{ backgroundColor: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: SHADOW, padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                        <Users size={15} color={PRIMARY} />
                        <span style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: TEXT }}>Tenants por estado</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[
                            { label: 'Activos', value: MOCK_STATS.tenantsActivos, color: GREEN, total: 36 },
                            { label: 'En trial', value: MOCK_STATS.tenantsTrial, color: AMBER, total: 36 },
                            { label: 'Suspendidos', value: MOCK_STATS.tenantsSuspendidos, color: RED, total: 36 },
                            { label: 'Cancelados', value: MOCK_STATS.tenantsCancelados, color: TEXT_SUB, total: 36 },
                        ].map(row => (
                            <div key={row.label}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                    <span style={{ fontFamily: F, fontSize: 12, color: TEXT_MID, fontWeight: 600 }}>{row.label}</span>
                                    <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: row.color }}>{row.value}</span>
                                </div>
                                <div style={{ height: 5, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', borderRadius: 3,
                                        width: `${(row.value / row.total) * 100}%`,
                                        backgroundColor: row.color,
                                        transition: 'width 0.6s ease',
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Órdenes del mes */}
                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Package size={13} color={TEXT_SUB} />
                                <span style={{ fontFamily: F, fontSize: 12, color: TEXT_MID }}>Órdenes procesadas este mes</span>
                            </div>
                            <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: TEXT }}>
                                {MOCK_STATS.totalOrdenesMes.toLocaleString()}
                            </span>
                        </div>
                        <div style={{ marginTop: 6, height: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', borderRadius: 2,
                                width: `${(MOCK_STATS.totalOrdenesMes / 6000) * 100}%`,
                                background: `linear-gradient(90deg, ${PRIMARY}, ${SEC})`,
                            }} />
                        </div>
                        <p style={{ fontFamily: F, fontSize: 10, color: TEXT_SUB, margin: '4px 0 0' }}>
                            {pctChange(MOCK_STATS.totalOrdenesMes, MOCK_STATS.ordenesAnterior)}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Fila 3: Pagos pendientes + últimos tenants ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 14, animation: 'fadeUp 0.35s 0.15s ease both' }} className="sa-grid-3">

                {/* Cola de pagos (preview) */}
                <div style={{ backgroundColor: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: SHADOW, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', borderBottom: `1px solid rgba(255,255,255,0.06)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CreditCard size={15} color={PRIMARY} />
                            <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: TEXT }}>Pagos pendientes</span>
                            {MOCK_STATS.pagosPendientes > 0 && (
                                <span style={{
                                    backgroundColor: `${AMBER}20`, color: AMBER,
                                    borderRadius: 6, padding: '1px 7px',
                                    fontFamily: MONO, fontSize: 11, fontWeight: 700,
                                }}>
                                    {MOCK_STATS.pagosPendientes}
                                </span>
                            )}
                        </div>
                        <Link to="/app/superadmin/payments" style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: PRIMARY, textDecoration: 'none' }}
                            className="sa-link">
                            Ver todos →
                        </Link>
                    </div>
                    <div>
                        {MOCK_PAGOS_PENDIENTES.slice(0, 4).map((p, i) => (
                            <div key={p.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '11px 18px',
                                borderBottom: i < 3 ? `1px solid rgba(255,255,255,0.05)` : 'none',
                            }}>
                                <div style={{ minWidth: 0 }}>
                                    <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: TEXT, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                                        {p.tenant}
                                    </p>
                                    <p style={{ fontFamily: MONO, fontSize: 10, color: TEXT_SUB, margin: 0 }}>{p.referencia}</p>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <p style={{ fontFamily: MONO, fontSize: 14, fontWeight: 800, color: GREEN, margin: '0 0 2px' }}>${p.monto}</p>
                                    <p style={{ fontFamily: F, fontSize: 10, color: TEXT_SUB, margin: 0 }}>{p.metodo}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ padding: '10px 18px', borderTop: `1px solid rgba(255,255,255,0.06)` }}>
                        <Link to="/app/superadmin/payments" style={{ textDecoration: 'none' }}>
                            <div style={{
                                width: '100%', padding: '9px 0',
                                backgroundColor: `${PRIMARY}18`,
                                border: `1px solid ${BORDER}`,
                                borderRadius: 10, textAlign: 'center',
                                fontFamily: F, fontSize: 13, fontWeight: 700, color: PRIMARY,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            }}>
                                <CheckCircle2 size={14} />
                                Ir a validar pagos
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Últimos tenants */}
                <div style={{ backgroundColor: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: SHADOW, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', borderBottom: `1px solid rgba(255,255,255,0.06)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Building2 size={15} color={PRIMARY} />
                            <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: TEXT }}>Tenants recientes</span>
                        </div>
                        <Link to="/app/superadmin/tenants" style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: PRIMARY, textDecoration: 'none' }} className="sa-link">
                            Ver todos →
                        </Link>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
                                    {['Empresa', 'Plan', 'Estado', 'Órdenes', 'Corte'].map(h => (
                                        <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontFamily: F, fontSize: 10, fontWeight: 700, color: TEXT_SUB, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {MOCK_TENANTS_RECIENTES.map(t => {
                                    const scfg = STATUS_CFG[t.status]
                                    return (
                                        <tr
                                            key={t.id}
                                            className="sa-row"
                                            style={{ borderBottom: `1px solid rgba(255,255,255,0.04)`, cursor: 'pointer', transition: 'background 0.15s' }}
                                            onMouseEnter={() => setHoveredTenant(t.id)}
                                            onMouseLeave={() => setHoveredTenant(null)}
                                        >
                                            <td style={{ padding: '11px 16px' }}>
                                                <div>
                                                    <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: TEXT, margin: '0 0 1px' }}>{t.nombre}</p>
                                                    <p style={{ fontFamily: MONO, fontSize: 10, color: TEXT_SUB, margin: 0 }}>{t.rif}</p>
                                                </div>
                                            </td>
                                            <td style={{ padding: '11px 16px' }}>
                                                <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: PLAN_COLOR[t.plan] }}>
                                                    {t.plan}
                                                </span>
                                            </td>
                                            <td style={{ padding: '11px 16px' }}>
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
                                            <td style={{ padding: '11px 16px' }}>
                                                <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: TEXT_MID }}>{t.ordenesMes}</span>
                                            </td>
                                            <td style={{ padding: '11px 16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ fontFamily: MONO, fontSize: 11, color: TEXT_MID }}>
                                                        {new Date(t.fechaCorte).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                    {t.pagosPendientes > 0 && (
                                                        <span style={{
                                                            width: 16, height: 16, borderRadius: '50%',
                                                            backgroundColor: `${AMBER}20`, color: AMBER,
                                                            fontFamily: MONO, fontSize: 9, fontWeight: 700,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        }}>
                                                            {t.pagosPendientes}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Responsive */}
            <style>{`
                @media(max-width:900px){ .sa-grid-2,.sa-grid-3{grid-template-columns:1fr!important;} }
            `}</style>
        </div>
    )
}