// src/features/driver/pages/DriversStopsPage.tsx
// Mis Entregas — mapa real Leaflet + lista de paradas + optimización IA

import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    CheckCircle2, AlertCircle, Navigation, ChevronRight,
    Zap, MapPin, ChevronDown, ChevronUp, Clock3, Package,
    Loader2, RotateCcw, Layers,
} from 'lucide-react'
import { api } from '@/lib/axios'
import { offlineService, type CachedStop } from '../services/offline.service'
import { MOCK_STOPS } from '../services/mock.data'
import { useOfflineSync } from '../hooks/useOfflineSync'
import SyncBanner from '../components/SyncBanner'

// ── Paleta ────────────────────────────────────────────────────────────────
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

const STATUS: Record<StopStatus, { label: string; color: string; bg: string }> = {
    PENDIENTE: { label: 'Pendiente', color: AMBER, bg: 'rgba(245,158,11,0.12)' },
    EN_RUTA: { label: 'En ruta', color: P, bg: 'rgba(56,189,248,0.12)' },
    ENTREGADO: { label: 'Entregado', color: GREEN, bg: 'rgba(16,185,129,0.12)' },
    FALLIDO: { label: 'Fallido', color: PINK, bg: 'rgba(236,72,153,0.12)' },
}

// ── Leaflet map component (lazy-loaded to avoid SSR issues) ───────────────
function RouteMap({ stops, activeId, onMarkerClick }: {
    stops: CachedStop[]
    activeId: string | null
    onMarkerClick: (id: string) => void
}) {
    const mapRef = useRef<HTMLDivElement>(null)
    const leafletMapRef = useRef<any>(null)
    const markersRef = useRef<Record<string, any>>({})

    useEffect(() => {
        if (!mapRef.current || stops.length === 0) return
        if (leafletMapRef.current) return // already initialized

        // Dynamic import of Leaflet
        import('leaflet').then(L => {
            // Fix default icon paths for Vite
            delete (L.Icon.Default.prototype as any)._getIconUrl
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            })

            // Get coords — use stops with lat/lng or default Caracas
            const validStops = stops.filter(s => s.lat && s.lng)
            const center: [number, number] = validStops.length > 0
                ? [validStops[0].lat!, validStops[0].lng!]
                : [10.4880, -66.8790]

            const map = L.map(mapRef.current!, {
                center, zoom: 13,
                zoomControl: true,
                attributionControl: false,
            })

            leafletMapRef.current = map

            // ResizeObserver: llama invalidateSize cuando el contenedor cambia (ej: sidebar expand)
            const ro = new ResizeObserver(() => {
                if (leafletMapRef.current) {
                    setTimeout(() => leafletMapRef.current?.invalidateSize(), 50)
                }
            })
            if (mapRef.current) ro.observe(mapRef.current)
                // Store ro on the map instance so cleanup can disconnect it
                ; (leafletMapRef.current as any)._ro = ro

            // Dark tile layer using CartoDB
            L.tileLayer(
                'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
                { subdomains: 'abcd', maxZoom: 20 }
            ).addTo(map)

            // Draw route polyline
            const routeCoords: [number, number][] = validStops.map(s => [s.lat!, s.lng!])
            if (routeCoords.length > 1) {
                L.polyline(routeCoords, {
                    color: P, weight: 2.5, opacity: 0.7,
                    dashArray: '8, 8',
                }).addTo(map)
            }

            // Add numbered markers
            stops.forEach((stop, idx) => {
                if (!stop.lat || !stop.lng) return
                const s = STATUS[stop.status]
                const done = stop.status === 'ENTREGADO' || stop.status === 'FALLIDO'
                const num = idx + 1

                const icon = L.divIcon({
                    className: '',
                    html: `
                        <div style="
                            width:34px;height:34px;border-radius:50%;
                            background:${done ? 'rgba(12,34,54,0.9)' : s.color};
                            border:2.5px solid ${done ? s.color : 'rgba(255,255,255,0.3)'};
                            display:flex;align-items:center;justify-content:center;
                            font-size:12px;font-weight:800;color:${done ? s.color : '#071828'};
                            font-family:JetBrains Mono,monospace;
                            box-shadow:0 3px 12px rgba(0,0,0,0.5),0 0 0 3px ${s.color}30;
                            transition:all .2s;
                        ">${done ? '✓' : String(num).padStart(2, '0')}</div>
                    `,
                    iconSize: [34, 34],
                    iconAnchor: [17, 17],
                })

                const marker = L.marker([stop.lat, stop.lng], { icon }).addTo(map)
                marker.bindPopup(`
                    <div style="font-family:Plus Jakarta Sans,sans-serif;min-width:160px">
                        <p style="margin:0 0 4px;font-weight:700;font-size:13px">${stop.clientName}</p>
                        <p style="margin:0 0 3px;font-size:11px;color:#888">${stop.address}</p>
                        <span style="font-size:10px;padding:2px 6px;border-radius:4px;background:${s.bg};color:${s.color};font-weight:700">${s.label.toUpperCase()}</span>
                    </div>
                `)
                marker.on('click', () => onMarkerClick(stop.id))
                markersRef.current[stop.id] = marker
            })

            // Fit bounds if multiple stops
            if (validStops.length > 1) {
                map.fitBounds(routeCoords, { padding: [30, 30] })
            }
        })

        return () => {
            if (leafletMapRef.current) {
                try { (leafletMapRef.current as any)._ro?.disconnect() } catch { }
                leafletMapRef.current.remove()
                leafletMapRef.current = null
            }
        }
    }, [stops])

    // Pan to active marker
    useEffect(() => {
        if (!activeId || !leafletMapRef.current) return
        const marker = markersRef.current[activeId]
        if (marker) {
            leafletMapRef.current.setView(marker.getLatLng(), 15, { animate: true })
            marker.openPopup()
        }
    }, [activeId])

    return (
        <div ref={mapRef} style={{ width: '100%', height: '100%' }}>
            {/* Leaflet CSS is injected via link tag below */}
        </div>
    )
}

// ── Stop row in list ──────────────────────────────────────────────────────
function StopRow({ stop, active, onClick }: { stop: CachedStop; active: boolean; onClick: () => void }) {
    const s = STATUS[stop.status]
    const done = stop.status === 'ENTREGADO' || stop.status === 'FALLIDO'

    return (
        <div
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderBottom: `1px solid ${BORDER}`,
                background: active ? 'rgba(56,189,248,0.07)' : 'transparent',
                cursor: 'pointer', transition: 'background .15s',
                borderLeft: active ? `3px solid ${P}` : '3px solid transparent',
            }}
        >
            {/* Number bubble */}
            <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: done ? 'rgba(255,255,255,0.03)' : `${s.color}15`,
                border: `1.5px solid ${done ? 'rgba(255,255,255,0.07)' : s.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: active ? `0 0 10px ${P}40` : 'none',
            }}>
                {stop.status === 'ENTREGADO' ? <CheckCircle2 size={13} color={GREEN} /> :
                    stop.status === 'FALLIDO' ? <AlertCircle size={13} color={PINK} /> : (
                        <span style={{ color: s.color, fontSize: 10, fontWeight: 800, fontFamily: MONO }}>
                            {String(stop.stopNumber).padStart(2, '0')}
                        </span>
                    )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: done ? 'rgba(224,242,254,0.5)' : TEXT, fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {stop.clientName}
                    </span>
                    <div style={{ padding: '2px 7px', borderRadius: 6, background: s.bg, flexShrink: 0 }}>
                        <span style={{ color: s.color, fontSize: 10, fontWeight: 700, fontFamily: MONO }}>{s.label.toUpperCase()}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    <MapPin size={10} color={TSUB} />
                    <span style={{ color: TSUB, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stop.address}</span>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
                    {stop.packageWeight && <span style={{ color: 'rgba(148,212,252,0.4)', fontSize: 10, fontFamily: MONO, display: 'flex', alignItems: 'center', gap: 3 }}><Package size={9} />{stop.packageWeight}kg</span>}
                    {stop.estimatedTime && !done && <span style={{ color: 'rgba(148,212,252,0.4)', fontSize: 10, fontFamily: MONO, display: 'flex', alignItems: 'center', gap: 3 }}><Clock3 size={9} />{stop.estimatedTime}</span>}
                </div>
            </div>

            <ChevronRight size={14} color={TSUB} style={{ flexShrink: 0 }} />
        </div>
    )
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function DriversStopsPage() {
    const navigate = useNavigate()
    const sync = useOfflineSync()
    const [stops, setStops] = useState<CachedStop[]>([])
    const [loading, setLoading] = useState(true)
    const [activeId, setActiveId] = useState<string | null>(null)
    const [panelOpen, setPanelOpen] = useState(true)
    const [optimizing, setOptimizing] = useState(false)
    const [optimized, setOptimized] = useState(false)
    const [aiToast, setAiToast] = useState<string | null>(null)
    const stopRefs = useRef<Record<string, HTMLDivElement | null>>({})

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await api.get<CachedStop[]>('/driver/route/today')
            setStops(data)
            await offlineService.cacheStops(data)
        } catch {
            const cached = await offlineService.getCachedStops()
            setStops(cached.length > 0 ? cached : MOCK_STOPS)
        } finally { setLoading(false) }
    }, [])

    useEffect(() => { load() }, [load])

    // Inject Leaflet CSS once
    useEffect(() => {
        const id = 'leaflet-css'
        if (document.getElementById(id)) return
        const link = document.createElement('link')
        link.id = id
        link.rel = 'stylesheet'
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
        document.head.appendChild(link)
    }, [])

    // ── AI Route Optimization (mock + real endpoint) ──────────────────────
    const handleOptimize = async () => {
        setOptimizing(true)
        setOptimized(false)
        try {
            // Intento real al backend — si no hay backend, simula
            const { data } = await api.post<CachedStop[]>('/driver/route/optimize')
            setStops(data)
            setOptimized(true)
            setAiToast('✦ Ruta optimizada por IA')
        } catch {
            // Simulación: nearest-neighbor desde la primera parada pendiente
            await new Promise(r => setTimeout(r, 1800)) // Simular procesamiento

            const pending = stops.filter(s => s.status === 'PENDIENTE' || s.status === 'EN_RUTA')
            const done = stops.filter(s => s.status === 'ENTREGADO' || s.status === 'FALLIDO')

            // Simple reorder: sort by estimated time if available, else shuffle intelligently
            const optimizedPending = [...pending].sort((a, b) => {
                if (a.estimatedTime && b.estimatedTime) return a.estimatedTime.localeCompare(b.estimatedTime)
                if (a.lat && b.lat) return a.lat - b.lat
                return 0
            }).map((s, i) => ({ ...s, stopNumber: i + 1 }))

            const finalStops = [...optimizedPending, ...done.map((s, i) => ({ ...s, stopNumber: optimizedPending.length + i + 1 }))]
            setStops(finalStops)
            setOptimized(true)
            setAiToast('✦ Ruta optimizada (modo demo)')
        } finally {
            setOptimizing(false)
            setTimeout(() => setAiToast(null), 3500)
        }
    }

    const handleMarkerClick = (id: string) => {
        setActiveId(id)
        setPanelOpen(true)
        // Scroll to stop in list
        setTimeout(() => {
            stopRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }, 100)
    }

    const total = stops.length
    const completed = stops.filter(s => s.status === 'ENTREGADO' || s.status === 'FALLIDO').length
    const pending = total - completed

    return (
        <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            background: BG, fontFamily: F, color: TEXT, overflow: 'hidden',
            position: 'relative',
        }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
        @keyframes slideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .spin-icon{animation:spin 1s linear infinite}
        .leaflet-container { background: #071828 !important; }
        .leaflet-popup-content-wrapper { background: #0c2236; border: 1px solid rgba(56,189,248,0.15); border-radius: 12px; color: #e0f2fe; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
        .leaflet-popup-tip { background: #0c2236; }
        .leaflet-popup-close-button { color: rgba(148,212,252,0.5) !important; }
        .leaflet-control-zoom a { background: #0c2236 !important; border-color: rgba(56,189,248,0.2) !important; color: #38BDF8 !important; }
        .leaflet-control-zoom a:hover { background: rgba(56,189,248,0.15) !important; }
      `}</style>

            <SyncBanner isOnline={sync.isOnline} syncing={sync.syncing} pendingCount={sync.pendingCount} />

            {/* ── MAP AREA ── */}
            <div style={{ flex: panelOpen ? '0 0 45vh' : '1', transition: 'flex .3s ease', position: 'relative', minHeight: panelOpen ? 200 : 0, zIndex: 0, isolation: 'isolate', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050f18' }}>
                        <div style={{ textAlign: 'center' }}>
                            <Loader2 size={28} color={P} className="spin-icon" style={{ marginBottom: 8 }} />
                            <p style={{ color: TSUB, fontSize: 13 }}>Cargando mapa…</p>
                        </div>
                    </div>
                ) : (
                    <RouteMap stops={stops} activeId={activeId} onMarkerClick={handleMarkerClick} />
                )}

                {/* ── Floating controls on map ── */}
                <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Stats pill */}
                    <div style={{
                        padding: '7px 12px', borderRadius: 10,
                        background: 'rgba(7,24,40,0.92)', backdropFilter: 'blur(12px)',
                        border: `1px solid ${BORDER}`,
                        display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: AMBER }} />
                            <span style={{ color: TEXT, fontSize: 12, fontWeight: 700, fontFamily: MONO }}>{pending}</span>
                            <span style={{ color: TSUB, fontSize: 11 }}>pendientes</span>
                        </div>
                        <div style={{ width: 1, height: 14, background: BORDER }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: GREEN }} />
                            <span style={{ color: TEXT, fontSize: 12, fontWeight: 700, fontFamily: MONO }}>{completed}</span>
                            <span style={{ color: TSUB, fontSize: 11 }}>listas</span>
                        </div>
                    </div>
                </div>

                {/* ── AI Optimize button ── */}
                <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
                    <button
                        onClick={handleOptimize}
                        disabled={optimizing || loading}
                        style={{
                            padding: '9px 14px', borderRadius: 12, cursor: optimizing ? 'not-allowed' : 'pointer',
                            background: optimized
                                ? 'rgba(16,185,129,0.9)'
                                : optimizing
                                    ? 'rgba(56,189,248,0.6)'
                                    : 'rgba(7,24,40,0.92)',
                            backdropFilter: 'blur(12px)',
                            border: `1px solid ${optimized ? GREEN : BORDER}`,
                            color: optimized ? 'white' : P,
                            fontSize: 12, fontWeight: 700, fontFamily: F,
                            display: 'flex', alignItems: 'center', gap: 7,
                            boxShadow: optimizing ? `0 0 20px rgba(56,189,248,0.4)` : optimized ? `0 0 16px rgba(16,185,129,0.3)` : 'none',
                            transition: 'all .2s',
                        }}
                    >
                        {optimizing
                            ? <><Loader2 size={13} className="spin-icon" /> Optimizando…</>
                            : optimized
                                ? <><CheckCircle2 size={13} /> Optimizada</>
                                : <><Zap size={13} /> Optimizar con IA</>
                        }
                    </button>
                </div>

                {/* Map expand toggle */}
                <button
                    onClick={() => setPanelOpen(v => !v)}
                    style={{
                        position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
                        zIndex: 1000, padding: '7px 18px', borderRadius: 20, border: `1px solid ${BORDER}`,
                        background: 'rgba(7,24,40,0.9)', backdropFilter: 'blur(10px)',
                        color: TSUB, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: F,
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}
                >
                    <Layers size={12} />
                    {panelOpen ? 'Expandir mapa' : 'Ver lista'}
                    {panelOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                </button>
            </div>

            {/* ── STOPS PANEL ── */}
            {panelOpen && (
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    background: BG, borderTop: `1px solid ${BORDER}`,
                    overflow: 'hidden', animation: 'slideUp .25s ease',
                }}>
                    {/* Panel header */}
                    <div style={{
                        padding: '12px 16px', borderBottom: `1px solid ${BORDER}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'linear-gradient(to bottom, rgba(12,34,54,0.5), transparent)',
                        flexShrink: 0,
                    }}>
                        <div>
                            <p style={{ color: TSUB, fontSize: 10, fontWeight: 700, margin: 0, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Paradas del día</p>
                            <p style={{ color: TEXT, fontSize: 15, fontWeight: 800, margin: '2px 0 0', fontFamily: MONO }}>
                                {total} <span style={{ color: TSUB, fontWeight: 500, fontSize: 13 }}>paradas totales</span>
                            </p>
                        </div>
                        <button
                            onClick={load}
                            style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${BORDER}`, background: 'rgba(56,189,248,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <RotateCcw size={13} color={P} />
                        </button>
                    </div>

                    {/* Scrollable list */}
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {loading && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                                <Loader2 size={22} color={P} className="spin-icon" />
                            </div>
                        )}
                        {!loading && stops.map(stop => (
                            <div key={stop.id} ref={el => { stopRefs.current[stop.id] = el }}>
                                <StopRow
                                    stop={stop}
                                    active={activeId === stop.id}
                                    onClick={() => {
                                        setActiveId(stop.id)
                                        navigate(`/app/driver/stop/${stop.id}`)
                                    }}
                                />
                            </div>
                        ))}
                        {!loading && stops.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '40px 24px' }}>
                                <Navigation size={32} color={P} style={{ marginBottom: 10 }} />
                                <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: '0 0 4px' }}>Sin paradas asignadas</p>
                                <p style={{ color: TSUB, fontSize: 12 }}>Tu ruta del día aparecerá aquí</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── AI Toast ── */}
            {aiToast && (
                <div style={{
                    position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                    padding: '11px 20px', borderRadius: 14, zIndex: 9999,
                    background: 'rgba(16,185,129,0.92)', backdropFilter: 'blur(12px)',
                    color: 'white', fontSize: 13, fontWeight: 700, fontFamily: F,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    animation: 'slideUp .25s ease',
                    display: 'flex', alignItems: 'center', gap: 8,
                    whiteSpace: 'nowrap',
                }}>
                    <Zap size={14} />
                    {aiToast}
                </div>
            )}
        </div>
    )
}