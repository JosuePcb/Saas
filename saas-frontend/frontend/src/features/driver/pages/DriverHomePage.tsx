// src/features/driver/pages/DriverHomePage.tsx
// Vista principal del chofer — rediseño completo mobile-first

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    MapPin, Package, Clock3, ChevronRight, CheckCircle2,
    AlertCircle, Navigation, Zap, Map, RefreshCw,
    TrendingUp, Circle,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/axios'
import { offlineService, type CachedStop } from '../services/offline.service'
import { MOCK_STOPS } from '../services/mock.data'
import { useOfflineSync } from '../hooks/useOfflineSync'
import SyncBanner from '../components/SyncBanner'

// ── Paleta del chofer (Sky Blue) ──────────────────────────────────────────
const P = '#38BDF8'
const PS = '#7DD3FC'
const GREEN = '#10b981'
const AMBER = '#f59e0b'
const PINK = '#EC4899'
const TEXT = '#e0f2fe'
const TSUB = 'rgba(148,212,252,0.55)'
const BORDER = 'rgba(56,189,248,0.13)'
const CARD = '#0c2236'
const BG = '#071828'
const F = "'Plus Jakarta Sans', sans-serif"
const MONO = "'JetBrains Mono', monospace"

type StopStatus = 'PENDIENTE' | 'EN_RUTA' | 'ENTREGADO' | 'FALLIDO'
type FilterTab = 'todas' | 'pendientes' | 'completadas'

const STATUS: Record<StopStatus, { label: string; color: string; bg: string }> = {
    PENDIENTE: { label: 'Pendiente', color: AMBER, bg: 'rgba(245,158,11,0.12)' },
    EN_RUTA: { label: 'En ruta', color: P, bg: 'rgba(56,189,248,0.12)' },
    ENTREGADO: { label: 'Entregado', color: GREEN, bg: 'rgba(16,185,129,0.12)' },
    FALLIDO: { label: 'Fallido', color: PINK, bg: 'rgba(236,72,153,0.12)' },
}

function todayLabel() {
    return new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })
}
function greet() {
    const h = new Date().getHours()
    return h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches'
}

function Skel() {
    return (
        <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(56,189,248,0.07)', animation: 'sk 1.4s ease infinite', flexShrink: 0, marginTop: 4 }} />
            <div style={{ flex: 1, borderRadius: 16, background: CARD, padding: '14px 16px', animation: 'sk 1.4s ease infinite' }}>
                <div style={{ width: '50%', height: 12, borderRadius: 6, background: 'rgba(56,189,248,0.09)', marginBottom: 8 }} />
                <div style={{ width: '75%', height: 10, borderRadius: 6, background: 'rgba(56,189,248,0.05)', marginBottom: 6 }} />
                <div style={{ width: '35%', height: 10, borderRadius: 6, background: 'rgba(56,189,248,0.05)' }} />
            </div>
        </div>
    )
}

function StopCard({ stop, isLast, onClick, delay }: { stop: CachedStop; isLast: boolean; onClick: () => void; delay: number }) {
    const s = STATUS[stop.status]
    const done = stop.status === 'ENTREGADO' || stop.status === 'FALLIDO'
    const [tap, setTap] = useState(false)

    return (
        <div className="sc" style={{ display: 'flex', gap: 0, animationDelay: `${delay}s`, marginBottom: isLast ? 0 : 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 44, flexShrink: 0, paddingTop: 4 }}>
                <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: done ? 'rgba(255,255,255,0.03)' : `${s.color}15`,
                    border: `1.5px solid ${done ? 'rgba(255,255,255,0.07)' : s.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    boxShadow: done ? 'none' : `0 0 10px ${s.color}22`,
                }}>
                    {stop.status === 'ENTREGADO' ? <CheckCircle2 size={14} color={GREEN} /> :
                        stop.status === 'FALLIDO' ? <AlertCircle size={14} color={PINK} /> : (
                            <span style={{ color: s.color, fontSize: 11, fontWeight: 800, fontFamily: MONO }}>
                                {String(stop.stopNumber).padStart(2, '0')}
                            </span>
                        )}
                </div>
                {!isLast && <div style={{ width: 1.5, flex: 1, minHeight: 20, marginTop: 5, background: `linear-gradient(to bottom, ${s.color}30, rgba(56,189,248,0.04))` }} />}
            </div>

            <div
                onClick={onClick}
                onPointerDown={() => setTap(true)} onPointerUp={() => setTap(false)} onPointerLeave={() => setTap(false)}
                style={{
                    flex: 1, borderRadius: 16, cursor: 'pointer',
                    background: tap ? 'rgba(56,189,248,0.07)' : done ? 'rgba(12,34,54,0.5)' : CARD,
                    border: `1px solid ${done ? 'rgba(255,255,255,0.04)' : BORDER}`,
                    borderLeft: `3px solid ${s.color}`,
                    padding: '13px 14px', opacity: done ? 0.65 : 1,
                    transform: tap ? 'scale(0.982)' : 'scale(1)',
                    transition: 'all 0.1s ease',
                    display: 'flex', flexDirection: 'column', gap: 7,
                    boxShadow: done ? 'none' : '0 2px 10px rgba(0,0,0,0.2)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: done ? 'rgba(224,242,254,0.55)' : TEXT, fontSize: 14, fontWeight: 700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {stop.clientName}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, padding: '3px 8px', borderRadius: 7, background: s.bg }}>
                        <span style={{ color: s.color, fontSize: 10, fontWeight: 700, fontFamily: MONO }}>{s.label.toUpperCase()}</span>
                    </div>
                    <ChevronRight size={13} color={TSUB} />
                </div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'flex-start' }}>
                    <MapPin size={11} color={TSUB} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ color: TSUB, fontSize: 12, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {stop.address}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {stop.packageWeight && <span style={{ color: TSUB, fontSize: 11, fontFamily: MONO, display: 'flex', alignItems: 'center', gap: 4 }}><Package size={10} color={TSUB} />{stop.packageWeight} kg</span>}
                    {stop.estimatedTime && !done && <span style={{ color: TSUB, fontSize: 11, fontFamily: MONO, display: 'flex', alignItems: 'center', gap: 4 }}><Clock3 size={10} color={TSUB} />{stop.estimatedTime}</span>}
                    {stop.status === 'ENTREGADO' && stop.receiverName && <span style={{ color: `${GREEN}90`, fontSize: 11 }}>✓ {stop.receiverName}</span>}
                    <span style={{ marginLeft: 'auto', color: 'rgba(56,189,248,0.25)', fontSize: 10, fontFamily: MONO }}>{stop.trackingCode}</span>
                </div>
            </div>
        </div>
    )
}

export default function DriverHomePage() {
    const { user } = useAuthStore()
    const navigate = useNavigate()
    const sync = useOfflineSync()
    const [stops, setStops] = useState<CachedStop[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<FilterTab>('todas')
    const [refreshing, setRefreshing] = useState(false)

    const load = useCallback(async (showR = false) => {
        showR ? setRefreshing(true) : setLoading(true)
        try {
            const { data } = await api.get<CachedStop[]>('/driver/route/today')
            setStops(data)
            await offlineService.cacheStops(data)
        } catch {
            const cached = await offlineService.getCachedStops()
            setStops(cached.length > 0 ? cached : MOCK_STOPS)
        } finally { setLoading(false); setRefreshing(false) }
    }, [])

    useEffect(() => { load() }, [load])

    const total = stops.length
    const completed = stops.filter(s => s.status === 'ENTREGADO' || s.status === 'FALLIDO').length
    const enRuta = stops.filter(s => s.status === 'EN_RUTA').length
    const pending = stops.filter(s => s.status === 'PENDIENTE' || s.status === 'EN_RUTA').length
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    const R = 22; const C = 2 * Math.PI * R
    const dash = C - (pct / 100) * C

    const filtered = stops.filter(s =>
        filter === 'pendientes' ? s.status === 'PENDIENTE' || s.status === 'EN_RUTA' :
            filter === 'completadas' ? s.status === 'ENTREGADO' || s.status === 'FALLIDO' : true
    )

    const TABS: { key: FilterTab; label: string; n: number }[] = [
        { key: 'todas', label: 'Todas', n: total },
        { key: 'pendientes', label: 'Activas', n: pending },
        { key: 'completadas', label: 'Listas', n: completed },
    ]

    return (
        <div style={{ minHeight: '100%', background: BG, fontFamily: F, color: TEXT, maxWidth: 520, margin: '0 auto' }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
        @keyframes sk{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .sc{animation:fadeUp .3s ease both}
        .spin{animation:spin .7s linear infinite}
      `}</style>

            <SyncBanner isOnline={sync.isOnline} syncing={sync.syncing} pendingCount={sync.pendingCount} />

            {/* ── HEADER ── */}
            <div style={{
                padding: '18px 18px 16px',
                background: 'linear-gradient(160deg, rgba(56,189,248,0.07) 0%, transparent 55%)',
                borderBottom: `1px solid ${BORDER}`,
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div>
                        <p style={{ color: TSUB, fontSize: 11, fontWeight: 700, margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{greet()}</p>
                        <h1 style={{ color: TEXT, fontSize: 21, fontWeight: 800, margin: '3px 0 2px', letterSpacing: '-0.02em' }}>
                            {user?.nombre} {user?.apellido}
                        </h1>
                        <p style={{ color: TSUB, fontSize: 12, margin: 0, textTransform: 'capitalize' }}>{todayLabel()}</p>
                    </div>
                    <button onClick={() => load(true)} disabled={refreshing}
                        style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${BORDER}`, background: 'rgba(56,189,248,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <RefreshCw size={15} color={P} className={refreshing ? 'spin' : ''} />
                    </button>
                </div>

                {/* Progress card */}
                {!loading && total > 0 && (
                    <div style={{
                        borderRadius: 18, padding: '16px 18px',
                        background: 'linear-gradient(135deg, rgba(12,34,54,0.95), rgba(7,24,40,0.98))',
                        border: `1px solid ${BORDER}`,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(56,189,248,0.07)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            {/* Ring */}
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                <svg width={58} height={58} style={{ transform: 'rotate(-90deg)' }}>
                                    <circle cx={29} cy={29} r={R} fill="none" stroke="rgba(56,189,248,0.08)" strokeWidth={4} />
                                    <circle cx={29} cy={29} r={R} fill="none" stroke={pct === 100 ? GREEN : P}
                                        strokeWidth={4} strokeLinecap="round"
                                        strokeDasharray={C} strokeDashoffset={dash}
                                        style={{ transition: 'stroke-dashoffset .7s cubic-bezier(.4,0,.2,1)', filter: `drop-shadow(0 0 4px ${pct === 100 ? GREEN : P}80)` }}
                                    />
                                </svg>
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ color: pct === 100 ? GREEN : P, fontSize: 12, fontWeight: 800, fontFamily: MONO }}>{pct}%</span>
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ color: TSUB, fontSize: 10, fontWeight: 700, margin: '0 0 3px', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Ruta del día</p>
                                <p style={{ color: TEXT, fontSize: 24, fontWeight: 800, margin: 0, fontFamily: MONO, lineHeight: 1 }}>
                                    {completed}<span style={{ color: TSUB, fontSize: 14, fontWeight: 500 }}> / {total} paradas</span>
                                </p>
                                <p style={{ color: TSUB, fontSize: 11, margin: '3px 0 0' }}>{pending > 0 ? `${pending} por completar` : '¡Todo completado!'}</p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, background: 'rgba(56,189,248,0.09)' }}>
                                    <Navigation size={10} color={P} />
                                    <span style={{ color: P, fontSize: 12, fontWeight: 800, fontFamily: MONO }}>{enRuta}</span>
                                    <span style={{ color: TSUB, fontSize: 10 }}>activa{enRuta !== 1 ? 's' : ''}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, background: 'rgba(16,185,129,0.09)' }}>
                                    <TrendingUp size={10} color={GREEN} />
                                    <span style={{ color: GREEN, fontSize: 12, fontWeight: 800, fontFamily: MONO }}>{completed}</span>
                                    <span style={{ color: TSUB, fontSize: 10 }}>listas</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: 14, height: 5, borderRadius: 999, background: 'rgba(56,189,248,0.08)', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', width: `${pct}%`, borderRadius: 999,
                                background: pct === 100 ? `linear-gradient(90deg,${GREEN},#059669)` : `linear-gradient(90deg,${P},${PS})`,
                                transition: 'width .7s cubic-bezier(.4,0,.2,1)',
                                boxShadow: `0 0 8px ${pct === 100 ? GREEN : P}50`,
                            }} />
                        </div>
                    </div>
                )}

                {/* Quick actions */}
                {!loading && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button onClick={() => navigate('/app/driver/stops')}
                            style={{
                                flex: 1, height: 43, borderRadius: 12, border: `1px solid ${BORDER}`,
                                background: 'rgba(56,189,248,0.07)', color: P,
                                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: F,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                            }}>
                            <Map size={15} /> Ver mapa
                        </button>
                        <button onClick={() => navigate('/app/driver/stops')}
                            style={{
                                flex: 1, height: 43, borderRadius: 12, border: 'none',
                                background: `linear-gradient(135deg,${P},${PS})`,
                                color: '#071828', fontSize: 13, fontWeight: 800,
                                cursor: 'pointer', fontFamily: F,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                boxShadow: `0 4px 16px rgba(56,189,248,0.28)`,
                            }}>
                            <Zap size={15} /> Optimizar IA
                        </button>
                    </div>
                )}
            </div>

            {/* ── TABS ── */}
            <div style={{ padding: '14px 18px 8px', display: 'flex', gap: 6 }}>
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setFilter(t.key)}
                        style={{
                            flex: 1, height: 38, borderRadius: 10,
                            border: `1px solid ${filter === t.key ? P : 'rgba(56,189,248,0.1)'}`,
                            background: filter === t.key ? 'rgba(56,189,248,0.12)' : 'transparent',
                            color: filter === t.key ? P : TSUB,
                            fontSize: 13, fontWeight: filter === t.key ? 700 : 500,
                            cursor: 'pointer', fontFamily: F,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                            transition: 'all .15s',
                        }}>
                        {t.label}
                        <span style={{ fontSize: 11, fontWeight: 800, fontFamily: MONO, color: filter === t.key ? P : 'rgba(148,212,252,0.3)' }}>{t.n}</span>
                    </button>
                ))}
            </div>

            {/* ── LIST ── */}
            <div style={{ padding: '6px 18px 40px' }}>
                {loading && [0, 1, 2, 3].map(i => <Skel key={i} />)}
                {!loading && filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '44px 24px', borderRadius: 18, background: CARD, border: `1px solid ${BORDER}`, marginTop: 8 }}>
                        {filter === 'completadas' ? <CheckCircle2 size={36} color={GREEN} style={{ marginBottom: 12 }} /> : <Navigation size={36} color={P} style={{ marginBottom: 12 }} />}
                        <p style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: '0 0 5px' }}>
                            {filter === 'completadas' ? '¡Jornada completada!' : 'Sin paradas aquí'}
                        </p>
                        <p style={{ color: TSUB, fontSize: 13, margin: 0 }}>
                            {filter === 'completadas' ? 'Completaste todas las entregas del día' : 'No hay paradas en esta categoría'}
                        </p>
                    </div>
                )}
                {!loading && filtered.map((stop, i) => (
                    <StopCard key={stop.id} stop={stop} isLast={i === filtered.length - 1}
                        onClick={() => navigate(`/app/driver/stop/${stop.id}`)} delay={i * 0.04} />
                ))}
            </div>
        </div>
    )
}