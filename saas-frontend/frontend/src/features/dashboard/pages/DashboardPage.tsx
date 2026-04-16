import { useState } from 'react'
import {
    Package, TrendingUp, Truck, AlertCircle,
    Plus, RefreshCw, MapPin, Clock, CheckCircle2,
    XCircle, Navigation, ChevronRight, Activity,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { StatusBadge } from '@/components/shared'

const F = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_BUSINESS: Record<string, string> = {
    'tenant-001': 'Distribuidora Pérez',
    'tenant-002': 'Express Caracas',
    'tenant-003': 'Logística Norte',
}

const MOCK_ORDERS = [
    { id: 'TRK-2841', cliente: 'María González', status: 'DELIVERED', chofer: 'Luis R.', hora: '09:12', zona: 'Chacao' },
    { id: 'TRK-2842', cliente: 'Carlos Pérez', status: 'IN_TRANSIT', chofer: 'Pedro M.', hora: '09:47', zona: 'Altamira' },
    { id: 'TRK-2843', cliente: 'Ana Martínez', status: 'ASSIGNED', chofer: 'Luis R.', hora: '10:02', zona: 'La Candelaria' },
    { id: 'TRK-2844', cliente: 'José Rodríguez', status: 'CREATED', chofer: '—', hora: '10:15', zona: 'El Paraíso' },
    { id: 'TRK-2845', cliente: 'Laura Sánchez', status: 'CANCELLED', chofer: 'Pedro M.', hora: '10:33', zona: 'Petare' },
    { id: 'TRK-2846', cliente: 'Miguel Torres', status: 'IN_TRANSIT', chofer: 'Carlos S.', hora: '10:44', zona: 'Los Palos Grandes' },
]

const MOCK_DRIVERS = [
    { id: 1, nombre: 'Luis Ramos', ordenes: 12, completadas: 8, status: 'EN_RUTA', initials: 'LR', color: '#EC4899' },
    { id: 2, nombre: 'Pedro Méndez', ordenes: 9, completadas: 5, status: 'EN_RUTA', initials: 'PM', color: '#D8B4FE' },
    { id: 3, nombre: 'Carlos Suárez', ordenes: 7, completadas: 7, status: 'DISPONIBLE', initials: 'CS', color: '#10B981' },
    { id: 4, nombre: 'Jesús Torres', ordenes: 0, completadas: 0, status: 'INACTIVO', initials: 'JT', color: 'rgba(255,255,255,0.35)' },
]

const MOCK_PINS = [
    { top: '22%', left: '30%', color: '#EC4899', label: 'TRK-2842', status: 'EN CAMINO' },
    { top: '45%', left: '52%', color: '#EC4899', label: 'TRK-2846', status: 'EN CAMINO' },
    { top: '60%', left: '25%', color: '#10B981', label: 'TRK-2841', status: 'ENTREGADA' },
    { top: '30%', left: '68%', color: '#F59E0B', label: 'TRK-2843', status: 'ASIGNADA' },
    { top: '72%', left: '60%', color: '#F59E0B', label: 'TRK-2844', status: 'ASIGNADA' },
]

const MOCK_CHART = [
    { day: 'L', v: 45 }, { day: 'M', v: 62 }, { day: 'X', v: 38 },
    { day: 'J', v: 75 }, { day: 'V', v: 58 }, { day: 'S', v: 92 },
    { day: 'D', v: 70 },
]

const driverStatusCfg: Record<string, { label: string; color: string }> = {
    EN_RUTA: { label: 'En ruta', color: '#10B981' },
    DISPONIBLE: { label: 'Disponible', color: '#F59E0B' },
    INACTIVO: { label: 'Inactivo', color: 'rgba(255,255,255,0.35)' },
}

// ─── Mini mapa mejorado ───────────────────────────────────────────────────────
function LiveMap() {
    const [selected, setSelected] = useState<string | null>(null)

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 320, backgroundColor: '#1a2535', overflow: 'hidden', borderRadius: 0 }}>
            {/* Grid fondo */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.06 }}>
                <defs>
                    <pattern id="g2" width="32" height="32" patternUnits="userSpaceOnUse">
                        <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.5" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#g2)" />
            </svg>

            {/* Calles */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }} viewBox="0 0 500 400" preserveAspectRatio="none">
                {/* Avenidas principales */}
                <line x1="0" y1="90" x2="500" y2="90" stroke="white" strokeWidth="3" />
                <line x1="0" y1="200" x2="500" y2="200" stroke="white" strokeWidth="2" />
                <line x1="0" y1="310" x2="500" y2="310" stroke="white" strokeWidth="2" />
                <line x1="130" y1="0" x2="130" y2="400" stroke="white" strokeWidth="3" />
                <line x1="280" y1="0" x2="280" y2="400" stroke="white" strokeWidth="2" />
                <line x1="420" y1="0" x2="420" y2="400" stroke="white" strokeWidth="2" />
                {/* Calles secundarias */}
                <line x1="0" y1="145" x2="500" y2="145" stroke="white" strokeWidth="1" />
                <line x1="0" y1="255" x2="500" y2="255" stroke="white" strokeWidth="1" />
                <line x1="65" y1="0" x2="65" y2="400" stroke="white" strokeWidth="1" />
                <line x1="205" y1="0" x2="205" y2="400" stroke="white" strokeWidth="1" />
                <line x1="350" y1="0" x2="350" y2="400" stroke="white" strokeWidth="1" />
                {/* Zona verde simulada */}
                <ellipse cx="380" cy="300" rx="60" ry="45" fill="rgba(16,185,129,0.07)" />
            </svg>

            {/* Ruta línea entre pins activos */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                <line x1="30%" y1="22%" x2="52%" y2="45%" stroke="#EC4899" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.4" />
                <line x1="52%" y1="45%" x2="68%" y2="30%" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.3" />
            </svg>

            {/* Pins */}
            {MOCK_PINS.map((pin, i) => (
                <div
                    key={i}
                    onClick={() => setSelected(selected === pin.label ? null : pin.label)}
                    style={{
                        position: 'absolute', top: pin.top, left: pin.left,
                        transform: 'translate(-50%, -50%)',
                        cursor: 'pointer', zIndex: selected === pin.label ? 20 : 10,
                    }}
                >
                    {/* Pulse */}
                    <div style={{
                        position: 'absolute', width: 28, height: 28, borderRadius: '50%',
                        backgroundColor: pin.color, opacity: 0.25, top: -6, left: -6,
                        animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite',
                    }} />
                    {/* Pin */}
                    <div style={{
                        width: 18, height: 18, borderRadius: '50%',
                        backgroundColor: pin.color, border: '2.5px solid white',
                        boxShadow: `0 0 12px ${pin.color}80`,
                        transform: selected === pin.label ? 'scale(1.3)' : 'scale(1)',
                        transition: 'transform 0.2s ease',
                        position: 'relative', zIndex: 2,
                    }} />
                    {/* Tooltip al seleccionar */}
                    {selected === pin.label && (
                        <div style={{
                            position: 'absolute', bottom: '130%', left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: 'white', color: 'rgba(255,255,255,0.9)',
                            fontSize: 11, fontWeight: 700, fontFamily: F,
                            padding: '6px 10px', borderRadius: 8,
                            whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                            zIndex: 30,
                        }}>
                            <p style={{ margin: 0 }}>{pin.label}</p>
                            <p style={{ margin: 0, fontSize: 10, color: pin.color, fontWeight: 600 }}>{pin.status}</p>
                            <div style={{ position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)', width: 8, height: 8, backgroundColor: 'white', rotate: '45deg' }} />
                        </div>
                    )}
                </div>
            ))}

            {/* Badge ciudad */}
            <div style={{
                position: 'absolute', bottom: 12, left: 12,
                backgroundColor: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.8)',
                fontSize: 11, fontWeight: 600, padding: '5px 12px',
                borderRadius: 20, backdropFilter: 'blur(4px)', fontFamily: F,
                display: 'flex', alignItems: 'center', gap: 5,
            }}>
                <MapPin size={11} color="#EC4899" />
                Caracas, Venezuela
            </div>

            {/* Badge live */}
            <div style={{
                position: 'absolute', top: 12, right: 12,
                backgroundColor: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.3)',
                color: '#10B981', fontSize: 10, fontWeight: 700,
                padding: '4px 10px', borderRadius: 20, fontFamily: F,
                display: 'flex', alignItems: 'center', gap: 5,
                backdropFilter: 'blur(4px)',
            }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
                EN VIVO
            </div>

            <style>{`
        @keyframes ping {
          0%   { transform: scale(0.8); opacity: 0.4; }
          75%  { transform: scale(2);   opacity: 0; }
          100% { transform: scale(2);   opacity: 0; }
        }
      `}</style>
        </div>
    )
}

// ─── Gráfica línea SVG ────────────────────────────────────────────────────────
function LineChartSVG() {
    const W = 280
    const H = 70
    const max = Math.max(...MOCK_CHART.map(d => d.v))
    const pts = MOCK_CHART.map((d, i) => {
        const x = (i / (MOCK_CHART.length - 1)) * (W - 20) + 10
        const y = H - (d.v / max) * (H - 10) - 5
        return `${x},${y}`
    })
    const pointsStr = pts.join(' ')
    const areaStr = `10,${H} ${pointsStr} ${W - 10},${H}`

    return (
        <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`} preserveAspectRatio="xMidYMid meet">
            <defs>
                <linearGradient id="lineArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EC4899" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#EC4899" stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon points={areaStr} fill="url(#lineArea)" />
            <polyline points={pointsStr} fill="none" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {/* Puntos */}
            {pts.map((pt, i) => {
                const [x, y] = pt.split(',').map(Number)
                return (
                    <circle key={i} cx={x} cy={y} r={MOCK_CHART[i].v === max ? 4 : 2.5}
                        fill={MOCK_CHART[i].v === max ? '#EC4899' : 'white'}
                        stroke="#EC4899" strokeWidth="1.5"
                    />
                )
            })}
            {/* Labels */}
            {MOCK_CHART.map((d, i) => {
                const x = (i / (MOCK_CHART.length - 1)) * (W - 20) + 10
                return (
                    <text key={d.day} x={x} y={H + 14} textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily={F}>{d.day}</text>
                )
            })}
        </svg>
    )
}

// ─── Dashboard principal ──────────────────────────────────────────────────────
export default function DashboardPage() {
    const { user } = useAuthStore()
    const businessName = MOCK_BUSINESS[user?.tenantId ?? ''] ?? 'Tu Negocio'
    const dateStr = new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })

    const enCamino = MOCK_PINS.filter(p => p.color === '#EC4899').length
    const asignadas = MOCK_PINS.filter(p => p.color === '#F59E0B').length
    const entregadas = MOCK_ORDERS.filter(o => o.status === 'DELIVERED').length

    return (
        <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
                <div>
                    <p style={{
                        fontFamily: F, fontSize: 13, fontWeight: 700, margin: '0 0 3px 0',
                        background: 'linear-gradient(135deg, #EC4899, #D8B4FE)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    }}>
                        {businessName}
                    </p>
                    <h1 style={{ fontFamily: F, fontSize: 32, fontWeight: 900, color: 'white', margin: '0 0 2px 0', letterSpacing: '-0.03em', lineHeight: 1 }}>
                        Dashboard
                    </h1>
                    <p style={{ fontFamily: F, fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0, textTransform: 'capitalize' }}>{dateStr}</p>
                </div>
                <Link
                    to="/app/orders/new"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        padding: '10px 18px', borderRadius: 12,
                        backgroundColor: '#EC4899', color: 'white',
                        fontFamily: F, fontSize: 13, fontWeight: 600,
                        textDecoration: 'none', flexShrink: 0,
                        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                        boxShadow: '0 4px 14px rgba(236,72,153,0.3)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(236,72,153,0.45)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(236,72,153,0.3)' }}
                >
                    <Plus size={14} />
                    Nueva orden
                </Link>
            </div>

            {/* ── Fila 1: Flota activa + Gráfica semanal (simétricas) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Flota activa */}
                <div style={{ backgroundColor: '#2a1020', borderRadius: 16, border: '1px solid rgba(236,72,153,0.12)', boxShadow: '0 4px 24px rgba(0,0,0,0.35), 0 1px 4px rgba(236,72,153,0.1)', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Truck size={16} color="#EC4899" />
                            <span style={{ fontFamily: F, fontSize: 17, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>Flota activa</span>
                        </div>
                        <Link to="/app/fleet" style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: '#EC4899', textDecoration: 'none' }}>Ver todos →</Link>
                    </div>
                    <div>
                        {MOCK_DRIVERS.map((d, i) => {
                            const cfg = driverStatusCfg[d.status]
                            const pct = d.ordenes > 0 ? Math.round((d.completadas / d.ordenes) * 100) : 0
                            return (
                                <div key={d.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px',
                                    borderBottom: i < MOCK_DRIVERS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                                }}>
                                    <div style={{
                                        width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                                        backgroundColor: d.status === 'INACTIVO' ? 'rgba(255,255,255,0.1)' : '#EC4899',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: d.status === 'INACTIVO' ? '#94a3b8' : 'white',
                                        fontSize: 12, fontWeight: 800,
                                    }}>
                                        {d.initials}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                                            <p style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.9)', margin: 0 }}>
                                                {d.nombre}
                                            </p>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                                                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: cfg.color, display: 'inline-block' }} />
                                                <span style={{ fontFamily: F, fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
                                                    {d.ordenes > 0 ? `${d.completadas}/${d.ordenes} entregas` : cfg.label}
                                                </span>
                                            </span>
                                        </div>
                                        {d.ordenes > 0 && (
                                            <div style={{ height: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${pct}%`, backgroundColor: cfg.color, borderRadius: 3, transition: 'width 0.6s ease' }} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Gráfica semanal */}
                <div style={{ backgroundColor: '#2a1020', borderRadius: 16, border: '1px solid rgba(236,72,153,0.12)', boxShadow: '0 4px 24px rgba(0,0,0,0.35), 0 1px 4px rgba(236,72,153,0.1)', padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Activity size={16} color="#EC4899" />
                            <span style={{ fontFamily: F, fontSize: 17, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>Esta semana</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontFamily: F, fontSize: 32, fontWeight: 900, color: '#EC4899', margin: 0, lineHeight: 1 }}>440</p>
                            <p style={{ fontFamily: F, fontSize: 13, color: '#10B981', fontWeight: 600, margin: '2px 0 0 0' }}>↑ +14% vs semana pasada</p>
                        </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                        <LineChartSVG />
                    </div>
                </div>
            </div>

            {/* ── Fila 2: Mapa (65%) + 4 métricas en 2x2 (35%) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '65fr 35fr', gap: 16 }} className="dashboard-grid">

                {/* Mapa — ocupa 65% del ancho */}
                <div style={{ backgroundColor: '#2a1020', borderRadius: 16, border: '1px solid rgba(236,72,153,0.12)', boxShadow: '0 4px 24px rgba(0,0,0,0.35), 0 1px 4px rgba(236,72,153,0.1)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Navigation size={15} color="#EC4899" />
                            <span style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>Seguimiento en tiempo real</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {[{ c: '#EC4899', l: 'En camino' }, { c: '#F59E0B', l: 'Asignada' }, { c: '#10B981', l: 'Entregada' }].map(x => (
                                <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: x.c, display: 'block' }} />
                                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: F }}>{x.l}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ height: 340 }}>
                        <LiveMap />
                    </div>
                </div>

                {/* 4 métricas en grid 2x2 — ocupa 35% */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 12 }}>
                    {[
                        { label: 'Órdenes para hoy', value: 248, icon: <Package size={22} />, color: '#EC4899', bg: 'rgba(236,72,153,0.09)', trend: '+12% vs ayer', up: true },
                        { label: 'Entregadas', value: entregadas, icon: <CheckCircle2 size={22} />, color: '#10B981', bg: 'rgba(16,185,129,0.09)', trend: '+8% vs ayer', up: true },
                        { label: 'En camino', value: enCamino, icon: <Navigation size={22} />, color: '#3B82F6', bg: 'rgba(59,130,246,0.09)', trend: 'Ahora mismo', up: null },
                        { label: 'Fallidas hoy', value: 8, icon: <AlertCircle size={22} />, color: '#EF4444', bg: 'rgba(239,68,68,0.09)', trend: '-3% vs ayer', up: false },
                    ].map(s => (
                        <div key={s.label} style={{
                            backgroundColor: '#2a1020', borderRadius: 16,
                            border: '1px solid rgba(236,72,153,0.12)', padding: '18px 16px',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.35), 0 1px 4px rgba(236,72,153,0.1)',
                            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                        }}>
                            {/* Ícono + label */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                                <p style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.3 }}>{s.label}</p>
                                <div style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
                                    {s.icon}
                                </div>
                            </div>
                            {/* Valor */}
                            <p style={{ fontFamily: F, fontSize: 38, fontWeight: 900, color: 'white', margin: '0 0 6px 0', lineHeight: 1 }}>{s.value}</p>
                            {/* Trend */}
                            <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, margin: 0, color: s.up === true ? '#10B981' : s.up === false ? '#EF4444' : '#94a3b8' }}>
                                {s.up === true ? '↑' : s.up === false ? '↓' : '→'} {s.trend}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Tabla órdenes recientes ── */}
            <div style={{ backgroundColor: '#2a1020', borderRadius: 16, border: '1px solid rgba(236,72,153,0.12)', boxShadow: '0 4px 24px rgba(0,0,0,0.35), 0 1px 4px rgba(236,72,153,0.1)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Package size={16} color="#EC4899" />
                        <span style={{ fontFamily: F, fontSize: 17, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>Órdenes recientes</span>
                    </div>
                    <Link to="/app/orders" style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: F, fontSize: 14, fontWeight: 600, color: '#EC4899', textDecoration: 'none' }}>
                        Ver todas <ChevronRight size={14} />
                    </Link>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                {['Código', 'Cliente', 'Zona', 'Chofer', 'Estado', 'Hora'].map(h => (
                                    <th key={h} style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: F, whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {MOCK_ORDERS.map((o, i) => (
                                <tr
                                    key={o.id}
                                    style={{ borderBottom: i < MOCK_ORDERS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)')}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                    <td style={{ padding: '13px 20px' }}>
                                        <Link to={`/app/orders/${o.id}`} style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: '#EC4899', textDecoration: 'none' }}>{o.id}</Link>
                                    </td>
                                    <td style={{ padding: '13px 20px', fontFamily: F, fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{o.cliente}</td>
                                    <td style={{ padding: '13px 20px' }}>
                                        <span style={{ fontFamily: F, fontSize: 13, color: 'rgba(255,255,255,0.55)', backgroundColor: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: 6, fontWeight: 500 }}>{o.zona}</span>
                                    </td>
                                    <td style={{ padding: '13px 20px', fontFamily: F, fontSize: 15, color: 'rgba(255,255,255,0.55)' }}>{o.chofer}</td>
                                    <td style={{ padding: '12px 20px' }}><StatusBadge status={o.status} size="sm" /></td>
                                    <td style={{ padding: '12px 20px', fontFamily: F, fontSize: 12, color: 'rgba(255,255,255,0.35)', fontVariantNumeric: 'tabular-nums' }}>{o.hora}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Responsive: en mobile el panel derecho va abajo */}
            <style>{`
        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
        </div>
    )
}