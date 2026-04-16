import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import {
    ArrowLeft, Play, Zap, MoreHorizontal,
    CheckCircle2, Circle, Loader2, Clock, Gauge, MapPin, User, Truck
} from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import { useIsMobile } from '@/hooks/useIsMobile'

const F = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

const PINK = '#EC4899'
const LILAC = '#D8B4FE'
const BLUE = '#38bdf8'
const GREEN = '#10b981'
const AMBER = '#d97706'
const TEXT = '#f1f0ff'
const TEXT_SUB = 'rgba(200,190,255,0.5)'
const BORDER = 'rgba(255,255,255,0.07)'
const PANEL_BG = '#1c0f16'

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_ROUTES: Record<string, any> = {
    '1': {
        id: '1', codigo: 'RUT-0041', estado: 'EN_PROGRESO',
        chofer: 'Luis Ramos', choferInitials: 'LR', placa: 'ABC-1234',
        paradas: 12, paradaActual: 3,
        distanciaKm: 84, duracionMin: 375,
        inicio: '08:45', trafico: 'Fluido',
        stops: [
            { id: 1, tracking: 'PAR-901', direccion: 'Av. Central 1240, Sector Industrial', estado: 'COMPLETADA', eta: '09:12 AM', lat: 10.506, lng: -66.914 },
            { id: 2, tracking: 'PAR-902', direccion: 'Calle Los Olivos 45, Edificio B', estado: 'COMPLETADA', eta: '09:45 AM', lat: 10.499, lng: -66.901 },
            { id: 3, tracking: 'PAR-903', direccion: 'Diagonal 45 Sur #23-11, Puerta 4', estado: 'EN_PROGRESO', eta: '10:25 AM', lat: 10.491, lng: -66.889 },
            { id: 4, tracking: 'PAR-904', direccion: 'Urbanización El Sol, Casa 12-A', estado: 'PENDIENTE', eta: '11:15 AM', lat: 10.483, lng: -66.877 },
            { id: 5, tracking: 'PAR-905', direccion: 'Zona Franca, Bodega Central 9', estado: 'PENDIENTE', eta: '12:00 PM', lat: 10.475, lng: -66.866 },
            { id: 6, tracking: 'PAR-906', direccion: 'Av. Libertador Torre Norte, Piso 3', estado: 'PENDIENTE', eta: '12:45 PM', lat: 10.468, lng: -66.856 },
            { id: 7, tracking: 'PAR-907', direccion: 'CC Sambil Local 142, Nivel Feria', estado: 'PENDIENTE', eta: '13:30 PM', lat: 10.498, lng: -66.871 },
            { id: 8, tracking: 'PAR-908', direccion: 'Calle Real de Chacao 88', estado: 'PENDIENTE', eta: '14:10 PM', lat: 10.506, lng: -66.853 },
            { id: 9, tracking: 'PAR-909', direccion: 'Los Palos Grandes, Av. Andrés Bello', estado: 'PENDIENTE', eta: '14:50 PM', lat: 10.513, lng: -66.844 },
            { id: 10, tracking: 'PAR-910', direccion: 'El Rosal, Torre Financiera Piso 8', estado: 'PENDIENTE', eta: '15:30 PM', lat: 10.497, lng: -66.834 },
            { id: 11, tracking: 'PAR-911', direccion: 'Las Mercedes, C.C. Concresa', estado: 'PENDIENTE', eta: '16:00 PM', lat: 10.487, lng: -66.829 },
            { id: 12, tracking: 'PAR-912', direccion: 'La Trinidad, Urb. Alta Florida', estado: 'PENDIENTE', eta: '16:45 PM', lat: 10.476, lng: -66.822 },
        ]
    },
    '2': {
        id: '2', codigo: 'RUT-0042', estado: 'PLANIFICADA',
        chofer: 'Pedro Méndez', choferInitials: 'PM', placa: 'XYZ-5678',
        paradas: 8, paradaActual: 0,
        distanciaKm: 52, duracionMin: 210,
        inicio: '10:00', trafico: 'Moderado',
        stops: [
            { id: 1, tracking: 'PAR-801', direccion: 'Petare, Av. Francisco de Miranda', estado: 'PENDIENTE', eta: '10:15 AM', lat: 10.477, lng: -66.794 },
            { id: 2, tracking: 'PAR-802', direccion: 'Palo Verde, Calle Norte 6', estado: 'PENDIENTE', eta: '10:50 AM', lat: 10.484, lng: -66.810 },
            { id: 3, tracking: 'PAR-803', direccion: 'La Urbina, Av. Rómulo Gallegos', estado: 'PENDIENTE', eta: '11:20 AM', lat: 10.491, lng: -66.826 },
            { id: 4, tracking: 'PAR-804', direccion: 'El Marqués, C.C. Líder', estado: 'PENDIENTE', eta: '11:55 AM', lat: 10.498, lng: -66.838 },
            { id: 5, tracking: 'PAR-805', direccion: 'Terrazas del Ávila, Qta. La Palma', estado: 'PENDIENTE', eta: '12:30 PM', lat: 10.509, lng: -66.851 },
            { id: 6, tracking: 'PAR-806', direccion: 'Los Chorros, Av. Sucre', estado: 'PENDIENTE', eta: '13:00 PM', lat: 10.515, lng: -66.862 },
            { id: 7, tracking: 'PAR-807', direccion: 'La California Norte, Calle Las Minas', estado: 'PENDIENTE', eta: '13:35 PM', lat: 10.507, lng: -66.878 },
            { id: 8, tracking: 'PAR-808', direccion: 'Sebucan, Av. Luis Roche', estado: 'PENDIENTE', eta: '14:10 PM', lat: 10.511, lng: -66.891 },
        ]
    },
}

// ── Stop status config ────────────────────────────────────────────────────────
const STOP_CFG = {
    COMPLETADA: { color: GREEN, icon: <CheckCircle2 size={14} strokeWidth={2.5} /> },
    EN_PROGRESO: { color: PINK, icon: <Loader2 size={14} strokeWidth={2.5} /> },
    PENDIENTE: { color: 'rgba(255,255,255,0.2)', icon: <Circle size={14} strokeWidth={2} /> },
}

// ── Custom Leaflet marker ─────────────────────────────────────────────────────
function createStopIcon(num: number, estado: string) {
    const color = estado === 'COMPLETADA' ? GREEN : estado === 'EN_PROGRESO' ? PINK : 'rgba(60,30,50,0.9)'
    const textColor = estado === 'PENDIENTE' ? 'rgba(200,190,255,0.5)' : 'white'
    const glow = estado === 'EN_PROGRESO' ? `0 0 12px ${PINK}` : 'none'
    return L.divIcon({
        className: '',
        html: `<div style="
            width:28px;height:28px;border-radius:50%;
            background:${color};
            border:2px solid rgba(255,255,255,0.2);
            display:flex;align-items:center;justify-content:center;
            font-family:'Plus Jakarta Sans',sans-serif;
            font-size:11px;font-weight:800;color:${textColor};
            box-shadow:${glow},0 4px 12px rgba(0,0,0,0.6);
            transition:all 0.3s;
        ">${num}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
    })
}

// ── Map tile fixer ────────────────────────────────────────────────────────────
function MapSetup() {
    const map = useMap()
    useEffect(() => {
        map.invalidateSize()
    }, [map])
    return null
}

// ── Stop Item ─────────────────────────────────────────────────────────────────
function StopItem({ stop, index, isActive, onClick }: {
    stop: any; index: number; isActive: boolean; onClick: () => void
}) {
    const cfg = STOP_CFG[stop.estado as keyof typeof STOP_CFG]

    return (
        <div
            onClick={onClick}
            style={{
                display: 'flex', gap: 12, padding: isActive ? '14px 14px' : '10px 14px',
                borderRadius: 12, cursor: 'pointer',
                backgroundColor: isActive ? 'rgba(236,72,153,0.08)' : 'transparent',
                border: `1px solid ${isActive ? 'rgba(236,72,153,0.2)' : 'transparent'}`,
                borderLeft: `2px solid ${isActive ? PINK : 'transparent'}`,
                transition: 'all 0.2s',
                position: 'relative',
            }}
            onMouseEnter={e => { if (!isActive) (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)') }}
            onMouseLeave={e => { if (!isActive) (e.currentTarget.style.backgroundColor = 'transparent') }}
        >
            {/* Number */}
            <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                backgroundColor: stop.estado === 'COMPLETADA' ? GREEN : stop.estado === 'EN_PROGRESO' ? PINK : 'rgba(255,255,255,0.06)',
                border: `1.5px solid ${stop.estado === 'PENDIENTE' ? BORDER : 'transparent'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 800, color: stop.estado === 'PENDIENTE' ? TEXT_SUB : 'white',
                fontFamily: MONO,
                boxShadow: stop.estado === 'EN_PROGRESO' ? `0 0 8px ${PINK}66` : 'none',
            }}>
                {stop.estado === 'COMPLETADA' ? '✓' : index + 1}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: cfg.color, margin: 0, letterSpacing: '0.04em' }}>
                        {stop.tracking}
                        {stop.estado === 'EN_PROGRESO' && (
                            <span style={{ marginLeft: 8, fontFamily: F, fontSize: 10, fontWeight: 800, color: PINK, backgroundColor: 'rgba(236,72,153,0.15)', padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                En Progreso
                            </span>
                        )}
                    </p>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: TEXT_SUB, flexShrink: 0, marginLeft: 8 }}>{stop.eta}</span>
                </div>
                <p style={{
                    fontFamily: F, fontSize: 12,
                    color: stop.estado === 'PENDIENTE' ? TEXT_SUB : TEXT,
                    margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    fontWeight: isActive ? 600 : 400,
                }}>
                    {stop.direccion}
                </p>
            </div>
        </div>
    )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RouteDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [activeStop, setActiveStop] = useState<number | null>(null)
    const [optimizing, setOptimizing] = useState(false)
    const [panelVisible, setPanelVisible] = useState(false)
    const [headerVisible, setHeaderVisible] = useState(false)
    const stopListRef = useRef<HTMLDivElement>(null)

    const route = MOCK_ROUTES[id ?? '1'] ?? MOCK_ROUTES['1']
    const isMobile = useIsMobile()
    const [showMap, setShowMap] = useState(false)

    useEffect(() => {
        const t1 = setTimeout(() => setHeaderVisible(true), 50)
        const t2 = setTimeout(() => setPanelVisible(true), 150)
        // Auto select active stop
        const active = route.stops.findIndex((s: any) => s.estado === 'EN_PROGRESO')
        if (active >= 0) setActiveStop(active)
        return () => { clearTimeout(t1); clearTimeout(t2) }
    }, [route])

    const handleOptimize = async () => {
        setOptimizing(true)
        await new Promise(r => setTimeout(r, 2000))
        setOptimizing(false)
    }

    const routeCoords: [number, number][] = route.stops.map((s: any) => [s.lat, s.lng])
    const center: [number, number] = [
        route.stops.reduce((acc: number, s: any) => acc + s.lat, 0) / route.stops.length,
        route.stops.reduce((acc: number, s: any) => acc + s.lng, 0) / route.stops.length,
    ]

    const estadoColor = route.estado === 'EN_PROGRESO' ? BLUE : route.estado === 'PLANIFICADA' ? AMBER : route.estado === 'COMPLETADA' ? GREEN : TEXT_SUB

    return (
        <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>

            {/* Top bar */}
            <div style={{
                flexShrink: 0,
                backgroundColor: '#1a0a14',
                borderBottom: `1px solid ${BORDER}`,
                padding: '14px 24px',
                display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto',
                opacity: headerVisible ? 1 : 0,
                transform: headerVisible ? 'none' : 'translateY(-8px)',
                transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
            }}>
                {/* Back */}
                <button onClick={() => navigate('/app/routes')} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: TEXT_SUB, fontFamily: F, fontSize: 13, padding: 0, flexShrink: 0,
                    transition: 'color 0.15s',
                }}
                    onMouseEnter={e => (e.currentTarget.style.color = TEXT)}
                    onMouseLeave={e => (e.currentTarget.style.color = TEXT_SUB)}
                >
                    <ArrowLeft size={15} />
                </button>

                <div style={{ width: 1, height: 24, backgroundColor: BORDER, margin: '0 20px', flexShrink: 0 }} />

                {/* Code */}
                <div style={{ marginRight: 32, flexShrink: 0 }}>
                    <p style={{ fontFamily: F, fontSize: 10, color: TEXT_SUB, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Código</p>
                    <p style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: TEXT, margin: 0 }}>{route.codigo}</p>
                </div>

                {/* Stats — hidden on mobile */}
                {!isMobile && [
                    { label: 'Paradas', value: route.paradas },
                    { label: 'Distancia', value: `${route.distanciaKm} km` },
                    { label: 'Duración', value: `${Math.floor(route.duracionMin / 60)}h ${route.duracionMin % 60}m` },
                    { label: 'Inicio', value: route.inicio },
                ].map((s, i) => (
                    <div key={i} style={{ marginRight: 32, paddingRight: 32, borderRight: `1px solid ${BORDER}`, flexShrink: 0 }}>
                        <p style={{ fontFamily: F, fontSize: 10, color: TEXT_SUB, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</p>
                        <p style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: TEXT, margin: 0 }}>{s.value}</p>
                    </div>
                ))}

                {/* Traffic — hidden on mobile */}
                {!isMobile && <div style={{
                    padding: '5px 12px', borderRadius: 6,
                    border: `1px solid ${BORDER}`,
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    marginRight: 'auto', flexShrink: 0,
                }}>
                    <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: TEXT_SUB, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Tráfico {route.trafico}
                    </p>
                </div>}

                {/* Driver */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: TEXT, margin: 0 }}>{route.chofer}</p>
                        <p style={{ fontFamily: MONO, fontSize: 11, color: TEXT_SUB, margin: 0 }}>{route.placa}</p>
                    </div>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'linear-gradient(135deg, #8b5cf6, #D8B4FE)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: 12, fontWeight: 800, fontFamily: F,
                    }}>
                        {route.choferInitials}
                    </div>
                </div>
            </div>

            {/* Main split layout */}
            <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden' }}>

                {/* Left panel — stop list */}
                <div style={{
                    width: isMobile ? '100%' : 380,
                    height: isMobile ? (showMap ? '45%' : '100%') : 'auto',
                    flexShrink: 0,
                    backgroundColor: PANEL_BG,
                    borderRight: isMobile ? 'none' : `1px solid ${BORDER}`,
                    borderBottom: isMobile ? `1px solid ${BORDER}` : 'none',
                    display: 'flex', flexDirection: 'column',
                    opacity: panelVisible ? 1 : 0,
                    transform: panelVisible ? 'none' : 'translateX(-12px)',
                    transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
                }}>
                    {/* Panel header */}
                    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>

                        {/* Mobile: mini stats + map toggle */}
                        {isMobile && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                <div style={{ display: 'flex', gap: 18 }}>
                                    {[
                                        { label: 'Paradas', value: String(route.paradas) },
                                        { label: 'Km', value: String(route.distanciaKm) },
                                        { label: 'Dur.', value: `${Math.floor(route.duracionMin / 60)}h${route.duracionMin % 60}m` },
                                    ].map(s => (
                                        <div key={s.label}>
                                            <p style={{ fontFamily: F, fontSize: 9, color: TEXT_SUB, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</p>
                                            <p style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>{s.value}</p>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setShowMap((m: boolean) => !m)}
                                    style={{
                                        padding: '6px 14px', borderRadius: 8,
                                        border: `1.5px solid ${showMap ? PINK : BORDER}`,
                                        backgroundColor: showMap ? 'rgba(236,72,153,0.1)' : 'rgba(255,255,255,0.04)',
                                        color: showMap ? PINK : TEXT_SUB,
                                        fontFamily: F, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {showMap ? 'Ver lista' : 'Ver mapa'}
                                </button>
                            </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: TEXT_SUB, margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Itinerario
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: estadoColor, display: 'inline-block', boxShadow: `0 0 6px ${estadoColor}` }} />
                                <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: estadoColor, margin: 0 }}>
                                    {route.estado === 'EN_PROGRESO' ? 'En Progreso' : route.estado === 'PLANIFICADA' ? 'Planificada' : 'Completada'}
                                </p>
                            </div>
                        </div>
                    </div>
                    {(!isMobile || !showMap) && <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                        {[
                            { label: 'Completadas', value: route.stops.filter((s: any) => s.estado === 'COMPLETADA').length, color: GREEN },
                            { label: 'Pendientes', value: route.stops.filter((s: any) => s.estado === 'PENDIENTE').length, color: TEXT_SUB },
                        ].map(s => (
                            <div key={s.label}>
                                <p style={{ fontFamily: MONO, fontSize: 16, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
                                <p style={{ fontFamily: F, fontSize: 10, color: TEXT_SUB, margin: 0 }}>{s.label}</p>
                            </div>
                        ))}
                        {/* Progress bar */}
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                            <div style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)' }}>
                                <div style={{
                                    height: '100%', borderRadius: 2,
                                    width: `${(route.stops.filter((s: any) => s.estado === 'COMPLETADA').length / route.stops.length) * 100}%`,
                                    background: `linear-gradient(90deg, ${GREEN}, ${BLUE})`,
                                    transition: 'width 0.6s ease',
                                }} />
                            </div>
                        </div>
                    </div>}

                {/* Stop list — hidden when map is shown on mobile */}
                <div ref={stopListRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: isMobile && showMap ? 'none' : undefined }}>
                    {route.stops.map((stop: any, i: number) => (
                        <StopItem
                            key={stop.id}
                            stop={stop}
                            index={i}
                            isActive={activeStop === i}
                            onClick={() => setActiveStop(activeStop === i ? null : i)}
                        />
                    ))}
                </div>

                {/* Action buttons */}
                <div style={{
                    padding: '16px 20px', borderTop: `1px solid ${BORDER}`,
                    display: 'flex', gap: 10, flexShrink: 0,
                    backgroundColor: '#1a0a14',
                }}>
                    <button style={{
                        flex: 1, height: 44, borderRadius: 12,
                        backgroundColor: PINK, border: 'none', color: 'white',
                        fontFamily: F, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        boxShadow: '0 4px 16px rgba(236,72,153,0.35)',
                        transition: 'all 0.15s',
                    }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#d6307a')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = PINK)}
                    >
                        <Play size={13} fill="white" />
                        Iniciar Ruta
                    </button>

                    <button
                        onClick={handleOptimize}
                        disabled={optimizing}
                        style={{
                            flex: 1, height: 44, borderRadius: 12,
                            backgroundColor: 'transparent',
                            border: `1.5px solid ${optimizing ? 'rgba(216,180,254,0.3)' : LILAC}`,
                            color: optimizing ? 'rgba(216,180,254,0.4)' : LILAC,
                            fontFamily: F, fontSize: 13, fontWeight: 700,
                            cursor: optimizing ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            transition: 'all 0.15s',
                        }}
                    >
                        {optimizing
                            ? <><svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Optimizando...</>
                            : <><Zap size={13} />Optimizar con IA</>
                        }
                    </button>
                </div>
            </div>

            {/* Right panel — map, toggle on mobile */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: isMobile && !showMap ? 'none' : 'block' }}>
                <MapContainer
                    center={center}
                    zoom={13}
                    style={{ width: '100%', height: '100%' }}
                    zoomControl={false}
                >
                    <MapSetup />
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    />

                    {/* Route polyline */}
                    <Polyline
                        positions={routeCoords}
                        pathOptions={{
                            color: PINK, weight: 2.5, opacity: 0.8,
                            dashArray: '8,6',
                        }}
                    />
                    {/* Completed segment solid */}
                    <Polyline
                        positions={routeCoords.slice(0, route.paradaActual + 1)}
                        pathOptions={{ color: PINK, weight: 3, opacity: 1 }}
                    />

                    {/* Stop markers */}
                    {route.stops.map((stop: any, i: number) => (
                        <Marker
                            key={stop.id}
                            position={[stop.lat, stop.lng]}
                            icon={createStopIcon(i + 1, stop.estado)}
                        >
                            <Popup>
                                <div style={{ fontFamily: F, fontSize: 12, color: '#1e1b4b', minWidth: 160 }}>
                                    <p style={{ fontFamily: MONO, fontWeight: 700, margin: '0 0 4px', fontSize: 13 }}>{stop.tracking}</p>
                                    <p style={{ margin: '0 0 4px', color: '#6b7280' }}>{stop.direccion}</p>
                                    <p style={{ margin: 0, fontWeight: 700 }}>ETA: {stop.eta}</p>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                {/* Legend overlay */}
                <div style={{
                    position: 'absolute', bottom: 20, right: 20, zIndex: 1000,
                    backgroundColor: 'rgba(28,15,22,0.92)',
                    border: `1px solid ${BORDER}`,
                    borderRadius: 12, padding: '12px 16px',
                    backdropFilter: 'blur(8px)',
                }}>
                    <p style={{ fontFamily: F, fontSize: 10, fontWeight: 700, color: TEXT_SUB, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Leyenda
                    </p>
                    {[
                        { color: GREEN, label: 'Completado' },
                        { color: PINK, label: 'En Tránsito' },
                        { color: 'rgba(255,255,255,0.2)', label: 'Siguiente' },
                    ].map(l => (
                        <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: l.color, display: 'inline-block', flexShrink: 0 }} />
                            <p style={{ fontFamily: F, fontSize: 11, color: TEXT_SUB, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{l.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>

            {/* Leaflet CSS override for dark map */ }
    <style>{`
                .leaflet-container { background: #1a0a14 !important; }
                .leaflet-popup-content-wrapper { border-radius: 10px !important; box-shadow: 0 8px 32px rgba(0,0,0,0.4) !important; }
                .leaflet-popup-tip { display: none; }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
            `}</style>
        </div >
    )
}