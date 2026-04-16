import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MapPin, Clock, Gauge, ChevronRight, Zap } from 'lucide-react'
import { useIsMobile } from '@/hooks/useIsMobile'

const F = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

const PINK = '#EC4899'
const LILAC = '#D8B4FE'
const AMBER = '#d97706'
const BLUE = '#38bdf8'
const GREEN = '#10b981'
const TEXT = '#f1f0ff'
const TEXT_SUB = 'rgba(200,190,255,0.5)'
const BORDER = 'rgba(255,255,255,0.07)'
const CARD = '#211119'

type RouteStatus = 'PLANIFICADA' | 'EN_PROGRESO' | 'COMPLETADA' | 'CANCELADA'
type FilterType = 'TODAS' | RouteStatus

const STATUS_CFG: Record<RouteStatus, { label: string; color: string; bg: string; border: string }> = {
    PLANIFICADA: { label: 'Planificada', color: AMBER, bg: 'rgba(217,119,6,0.1)', border: 'rgba(217,119,6,0.3)' },
    EN_PROGRESO: { label: 'En Progreso', color: BLUE, bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.3)' },
    COMPLETADA: { label: 'Completada', color: GREEN, bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' },
    CANCELADA: { label: 'Cancelada', color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)' },
}

const MOCK_ROUTES = [
    {
        id: '1', codigo: 'RUT-0041', estado: 'EN_PROGRESO' as RouteStatus,
        chofer: 'Luis Ramos', placa: 'ABC-1234',
        paradas: 12, paradaActual: 3,
        distanciaKm: 84, duracionMin: 375,
        createdAt: '2026-03-14T08:45:00',
        stops: ['Av. Libertador', 'CC Sambil', 'La Candelaria', 'Chacao', 'Altamira', 'Los Palos Grandes', 'El Rosal', 'Las Mercedes', 'Bello Campo', 'Chuao', 'El Cafetal', 'La Trinidad'],
    },
    {
        id: '2', codigo: 'RUT-0042', estado: 'PLANIFICADA' as RouteStatus,
        chofer: 'Pedro Méndez', placa: 'XYZ-5678',
        paradas: 8, paradaActual: 0,
        distanciaKm: 52, duracionMin: 210,
        createdAt: '2026-03-14T09:00:00',
        stops: ['Petare', 'Palo Verde', 'La Urbina', 'El Marqués', 'Terrazas del Ávila', 'Los Chorros', 'La California', 'Sebucan'],
    },
    {
        id: '3', codigo: 'RUT-0040', estado: 'COMPLETADA' as RouteStatus,
        chofer: 'Ana Rodríguez', placa: 'MNO-7890',
        paradas: 6, paradaActual: 6,
        distanciaKm: 31, duracionMin: 140,
        createdAt: '2026-03-14T06:30:00',
        stops: ['Sabana Grande', 'Chacaíto', 'El Recreo', 'Las Acacias', 'Bello Monte', 'La Florida'],
    },
    {
        id: '4', codigo: 'RUT-0043', estado: 'PLANIFICADA' as RouteStatus,
        chofer: 'Carlos Suárez', placa: 'GHI-9012',
        paradas: 10, paradaActual: 0,
        distanciaKm: 67, duracionMin: 290,
        createdAt: '2026-03-14T10:00:00',
        stops: ['El Valle', 'Coche', 'Antímano', 'La Vega', 'El Paraíso', 'Caricuao', 'El Junquito', 'Los Teques', 'La Mariposa', 'Hoyo de la Puerta'],
    },
    {
        id: '5', codigo: 'RUT-0039', estado: 'COMPLETADA' as RouteStatus,
        chofer: 'Jesús Torres', placa: 'JKL-3456',
        paradas: 5, paradaActual: 5,
        distanciaKm: 24, duracionMin: 95,
        createdAt: '2026-03-13T07:00:00',
        stops: ['Propatria', 'Catia', 'El Silencio', 'La Hoyada', 'Capitolio'],
    },
]

function formatDuration(min: number) {
    const h = Math.floor(min / 60)
    const m = min % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
}

// ── Stop Timeline ─────────────────────────────────────────────────────────────
function StopTimeline({ total, current, estado }: { total: number; current: number; estado: RouteStatus }) {
    const dots = Math.min(total, 9)
    const accentColor = STATUS_CFG[estado].color

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, flex: 1, padding: '0 24px' }}>
            {Array.from({ length: dots }).map((_, i) => {
                const realIndex = Math.round((i / (dots - 1)) * (total - 1))
                const done = realIndex < current
                const active = realIndex === current && estado === 'EN_PROGRESO'
                const pending = !done && !active

                return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < dots - 1 ? 1 : 0 }}>
                        <div style={{
                            width: active ? 10 : 7,
                            height: active ? 10 : 7,
                            borderRadius: '50%', flexShrink: 0,
                            backgroundColor: done ? accentColor : active ? PINK : 'rgba(255,255,255,0.15)',
                            boxShadow: active ? `0 0 10px ${PINK}, 0 0 20px rgba(236,72,153,0.4)` : done ? `0 0 4px ${accentColor}66` : 'none',
                            transition: 'all 0.3s',
                            position: 'relative',
                        }}>
                            {active && (
                                <div style={{
                                    position: 'absolute', inset: -3, borderRadius: '50%',
                                    border: `1.5px solid ${PINK}`,
                                    animation: 'ping 1.5s ease-in-out infinite',
                                    opacity: 0.6,
                                }} />
                            )}
                        </div>
                        {i < dots - 1 && (
                            <div style={{
                                flex: 1, height: 1.5, margin: '0 2px',
                                backgroundColor: done ? accentColor : 'rgba(255,255,255,0.1)',
                                transition: 'background-color 0.3s',
                            }} />
                        )}
                    </div>
                )
            })}
            <style>{`@keyframes ping { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.6);opacity:0} }`}</style>
        </div>
    )
}

// ── Route Row ─────────────────────────────────────────────────────────────────
function RouteRow({ route, index }: { route: typeof MOCK_ROUTES[0]; index: number }) {
    const navigate = useNavigate()
    const [visible, setVisible] = useState(false)
    const [hovered, setHovered] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const cfg = STATUS_CFG[route.estado]
    const isMobile = useIsMobile()

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), index * 80)
        return () => clearTimeout(timer)
    }, [index])

    return (
        <div
            ref={ref}
            onClick={() => navigate(`/app/routes/${route.id}`)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex', alignItems: 'center',
                backgroundColor: CARD,
                borderRadius: 14,
                border: `1px solid ${hovered ? cfg.color + '40' : BORDER}`,
                borderLeft: `3px solid ${hovered ? cfg.color : cfg.color + '60'}`,
                padding: '18px 20px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                transform: visible ? 'translateY(0)' : 'translateY(16px)',
                opacity: visible ? 1 : 0,
                boxShadow: hovered ? `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${cfg.color}20` : 'none',
                gap: 0,
            }}
        >
            {isMobile ? (
                // ── Mobile layout ──
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: TEXT, margin: '0 0 4px', letterSpacing: '0.05em' }}>{route.codigo}</p>
                            <p style={{ fontFamily: F, fontSize: 12, color: TEXT_SUB, margin: '0 0 2px' }}>{route.chofer}</p>
                            <p style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(200,190,255,0.3)', margin: 0 }}>{route.placa}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${cfg.border}`, backgroundColor: cfg.bg }}>
                                <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: cfg.color, margin: 0 }}>{cfg.label}</p>
                            </div>
                            <ChevronRight size={14} color={TEXT_SUB} />
                        </div>
                    </div>
                    <StopTimeline total={route.paradas} current={route.paradaActual} estado={route.estado} />
                    <div style={{ display: 'flex', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Gauge size={11} color={TEXT_SUB} />
                            <span style={{ fontFamily: MONO, fontSize: 11, color: TEXT_SUB }}>{route.distanciaKm} km</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Clock size={11} color={TEXT_SUB} />
                            <span style={{ fontFamily: MONO, fontSize: 11, color: TEXT_SUB }}>{formatDuration(route.duracionMin)}</span>
                        </div>
                        <span style={{ fontFamily: MONO, fontSize: 11, color: TEXT_SUB }}>{route.paradaActual}/{route.paradas} paradas</span>
                    </div>
                </div>
            ) : (
                // ── Desktop layout ──
                <>
                    <div style={{ width: 180, flexShrink: 0 }}>
                        <p style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: TEXT, margin: '0 0 6px', letterSpacing: '0.05em' }}>{route.codigo}</p>
                        <p style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: TEXT_SUB, margin: '0 0 2px' }}>{route.chofer}</p>
                        <p style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(200,190,255,0.35)', margin: 0, letterSpacing: '0.06em' }}>{route.placa}</p>
                    </div>
                    <div style={{ width: 1, height: 40, backgroundColor: BORDER, flexShrink: 0, margin: '0 20px' }} />
                    <StopTimeline total={route.paradas} current={route.paradaActual} estado={route.estado} />
                    <div style={{ flexShrink: 0, textAlign: 'center', margin: '0 20px' }}>
                        <p style={{ fontFamily: F, fontSize: 11, color: TEXT_SUB, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Paradas</p>
                        <p style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: TEXT, margin: 0 }}>{route.paradaActual}<span style={{ color: TEXT_SUB, fontSize: 13 }}>/{route.paradas}</span></p>
                    </div>
                    <div style={{ width: 1, height: 40, backgroundColor: BORDER, flexShrink: 0, margin: '0 20px' }} />
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 24 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Gauge size={11} color={TEXT_SUB} /><span style={{ fontFamily: MONO, fontSize: 12, color: TEXT_SUB }}>{route.distanciaKm} km</span></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={11} color={TEXT_SUB} /><span style={{ fontFamily: MONO, fontSize: 12, color: TEXT_SUB }}>{formatDuration(route.duracionMin)}</span></div>
                        </div>
                        <div style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${cfg.border}`, backgroundColor: cfg.bg }}>
                            <p style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: cfg.color, margin: 0, whiteSpace: 'nowrap' }}>{cfg.label}</p>
                        </div>
                        <ChevronRight size={16} color={hovered ? cfg.color : TEXT_SUB} style={{ transition: 'all 0.2s', transform: hovered ? 'translateX(3px)' : 'none' }} />
                    </div>
                </>
            )}
        </div>
    )
}

// ── Tab filter ────────────────────────────────────────────────────────────────
function TabStrip({ active, onChange, counts }: {
    active: FilterType
    onChange: (f: FilterType) => void
    counts: Record<string, number>
}) {
    const tabs: { key: FilterType; label: string; color?: string }[] = [
        { key: 'TODAS', label: 'Todas' },
        { key: 'PLANIFICADA', label: 'Planificadas', color: AMBER },
        { key: 'EN_PROGRESO', label: 'En Progreso', color: BLUE },
        { key: 'COMPLETADA', label: 'Completadas', color: GREEN },
    ]

    return (
        <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, marginBottom: 28, gap: 0, overflowX: 'auto' }} className='scrollbar-hide'>
            {tabs.map(tab => {
                const isActive = active === tab.key
                const c = counts[tab.key] ?? 0
                return (
                    <button
                        key={tab.key}
                        onClick={() => onChange(tab.key)}
                        style={{
                            padding: '10px 20px',
                            background: 'none', border: 'none',
                            borderBottom: `2px solid ${isActive ? (tab.color ?? PINK) : 'transparent'}`,
                            marginBottom: -1,
                            color: isActive ? (tab.color ?? PINK) : TEXT_SUB,
                            fontFamily: F, fontSize: 13, fontWeight: isActive ? 700 : 500,
                            cursor: 'pointer', transition: 'all 0.15s',
                            display: 'flex', alignItems: 'center', gap: 8,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {tab.label}
                        {c > 0 && (
                            <span style={{
                                fontSize: 10, fontWeight: 800, fontFamily: MONO,
                                color: isActive ? (tab.color ?? PINK) : 'rgba(255,255,255,0.2)',
                                backgroundColor: isActive ? `${tab.color ?? PINK}18` : 'rgba(255,255,255,0.05)',
                                padding: '1px 6px', borderRadius: 4,
                            }}>{c}</span>
                        )}
                    </button>
                )
            })}
        </div>
    )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RoutesListPage() {
    const navigate = useNavigate()
    const [filter, setFilter] = useState<FilterType>('TODAS')
    const [headerVisible, setHeaderVisible] = useState(false)

    useEffect(() => {
        const t = setTimeout(() => setHeaderVisible(true), 50)
        return () => clearTimeout(t)
    }, [])

    const filtered = filter === 'TODAS'
        ? MOCK_ROUTES
        : MOCK_ROUTES.filter(r => r.estado === filter)

    const counts = {
        TODAS: MOCK_ROUTES.length,
        PLANIFICADA: MOCK_ROUTES.filter(r => r.estado === 'PLANIFICADA').length,
        EN_PROGRESO: MOCK_ROUTES.filter(r => r.estado === 'EN_PROGRESO').length,
        COMPLETADA: MOCK_ROUTES.filter(r => r.estado === 'COMPLETADA').length,
    }

    const activeCount = counts.EN_PROGRESO

    const today = new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })
    const todayFormatted = today.charAt(0).toUpperCase() + today.slice(1)

    return (
        <div style={{ fontFamily: F }}>

            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                marginBottom: 32, flexWrap: 'wrap', gap: 16, rowGap: 12,
                opacity: headerVisible ? 1 : 0,
                transform: headerVisible ? 'none' : 'translateY(-8px)',
                transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
            }}>
                <div>
                    <h1 style={{ fontFamily: F, fontSize: 'clamp(26px,4vw,34px)', fontWeight: 900, color: TEXT, margin: '0 0 6px', letterSpacing: '-0.03em' }}>
                        Rutas
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <p style={{ fontFamily: F, fontSize: 13, color: TEXT_SUB, margin: 0 }}>{todayFormatted}</p>
                        {activeCount > 0 && (
                            <>
                                <span style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: TEXT_SUB, display: 'inline-block' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: BLUE, display: 'inline-block', boxShadow: `0 0 6px ${BLUE}` }} />
                                    <p style={{ fontFamily: F, fontSize: 13, color: BLUE, margin: 0, fontWeight: 600 }}>
                                        {activeCount} ruta{activeCount > 1 ? 's' : ''} activa{activeCount > 1 ? 's' : ''}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => navigate('/app/routes/new')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '11px 20px', borderRadius: 12,
                        backgroundColor: PINK, border: 'none', color: 'white',
                        fontFamily: F, fontSize: 14, fontWeight: 700,
                        cursor: 'pointer', whiteSpace: 'nowrap',
                        boxShadow: '0 4px 20px rgba(236,72,153,0.35)',
                        transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget.style.backgroundColor = '#d6307a'); (e.currentTarget.style.boxShadow = '0 6px 24px rgba(236,72,153,0.5)') }}
                    onMouseLeave={e => { (e.currentTarget.style.backgroundColor = PINK); (e.currentTarget.style.boxShadow = '0 4px 20px rgba(236,72,153,0.35)') }}
                >
                    <Plus size={15} strokeWidth={3} />
                    Nueva Ruta
                </button>
            </div>

            {/* Tab strip */}
            <TabStrip active={filter} onChange={setFilter} counts={counts} />

            {/* Routes list */}
            {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(56,189,248,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <MapPin size={24} color={BLUE} />
                    </div>
                    <p style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: TEXT, margin: '0 0 6px' }}>Sin rutas</p>
                    <p style={{ fontFamily: F, fontSize: 13, color: TEXT_SUB, margin: 0 }}>No hay rutas con este estado</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {filtered.map((route, i) => (
                        <RouteRow key={route.id} route={route} index={i} />
                    ))}
                </div>
            )}
        </div>
    )
}