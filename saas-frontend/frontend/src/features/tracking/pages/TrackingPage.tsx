import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import {
    Package, MapPin, Phone, Clock,
    Truck, User, Navigation, AlertCircle, Zap,
    Globe, HelpCircle, RefreshCw, Shield, MessageCircle,
} from 'lucide-react'
import 'leaflet/dist/leaflet.css'

// ── Tokens — MISMO sistema de colores del dashboard/landing ──────────────────
const F = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

const BG = '#1f0d18'
const SURFACE = '#1a0a14'
const CARD = '#2a1020'

const PINK = '#EC4899'
const LILAC = '#D8B4FE'
const GREEN = '#10B981'
const AMBER = '#F59E0B'
const RED = '#EF4444'

const TEXT = 'rgba(255,255,255,0.9)'
const TEXT_SUB = 'rgba(255,255,255,0.35)'
const TEXT_MID = 'rgba(255,255,255,0.55)'
const BORDER = 'rgba(236,72,153,0.12)'
const BORDER_W = 'rgba(255,255,255,0.06)'
const SHADOW = '0 4px 24px rgba(0,0,0,0.35), 0 1px 4px rgba(236,72,153,0.1)'

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_ORDERS: Record<string, any> = {
    'TRK-LGP-20260408-001': {
        trackingCode: 'TRK-LGP-20260408-001',
        status: 'EN_RUTA',
        cliente: 'Carlos Pérez',
        direccion: 'Av. Principal de La Vega, Cruce Calle 4, Parroquia La Vega, Caracas 1040',
        chofer: { nombre: 'Luis', apellido: 'Ramos', telefono: '+58 414-777-1234', initials: 'LR' },
        vehiculo: { placa: 'ABC-1234', modelo: 'Iveco Daily' },
        eta: '2:45 PM',
        distKm: 14,
        timeToTarget: '01:24',
        nextHub: 'CAR-A',
        peso: '4.2 kg',
        notas: 'Tocar timbre 2 veces. Si no hay nadie, dejar con el vecino.',
        creado: '08:30 AM',
        empresa: 'DistribuidoraPro C.A.',
        destinoLat: 10.4469, destinoLng: -66.9018,
        choferLat: 10.4613, choferLng: -66.8977,
        history: [
            { label: 'Creada', sub: '08:30 AM · Recibida en sistema', done: true, active: false, color: TEXT_SUB },
            { label: 'En Tránsito', sub: 'Dirección a Distribución · La Vega', done: true, active: true, color: PINK, note: 'Última actualización hace 4 min' },
            { label: 'Salida para entrega', sub: 'Estimado: 1:30 PM', done: false, active: false, color: TEXT_SUB },
            { label: 'Entregado', sub: 'Destino final', done: false, active: false, color: TEXT_SUB },
        ],
    },
    'TRK-LGP-20260408-002': {
        trackingCode: 'TRK-LGP-20260408-002',
        status: 'ENTREGADO',
        cliente: 'María González',
        direccion: 'C.C. Sambil, Nivel Feria, Local 142, Av. Libertador, Caracas',
        chofer: { nombre: 'Pedro', apellido: 'Méndez', telefono: '+58 412-888-5678', initials: 'PM' },
        vehiculo: { placa: 'XYZ-5678', modelo: 'Ford Transit' },
        eta: '11:30 AM',
        distKm: 0,
        timeToTarget: '00:00',
        nextHub: '—',
        peso: '1.8 kg',
        notas: null,
        creado: '07:00 AM',
        empresa: 'LogiExpress C.A.',
        destinoLat: 10.4987, destinoLng: -66.8712,
        choferLat: 10.4987, choferLng: -66.8712,
        history: [
            { label: 'Creada', sub: '07:00 AM · Recibida en sistema', done: true, active: false, color: TEXT_SUB },
            { label: 'En Tránsito', sub: '08:20 AM · En ruta', done: true, active: false, color: TEXT_SUB },
            { label: 'Salida para entrega', sub: '10:45 AM · Salió del hub', done: true, active: false, color: TEXT_SUB },
            { label: 'Entregado', sub: 'Recibido 11:30 AM', done: true, active: true, color: GREEN },
        ],
    },
    'TRK-LGP-20260408-003': {
        trackingCode: 'TRK-LGP-20260408-003',
        status: 'FALLIDO',
        cliente: 'Roberto Silva',
        direccion: 'Urbanización La Trinidad, Qta. Los Pinos, Calle Principal, Caracas',
        chofer: { nombre: 'Carlos', apellido: 'Torres', telefono: '+58 416-333-9900', initials: 'CT' },
        vehiculo: { placa: 'DEF-9012', modelo: 'Hyundai H1' },
        eta: '—',
        distKm: 0,
        timeToTarget: '—',
        nextHub: '—',
        peso: '7.5 kg',
        notas: 'Intento fallido: no había nadie en la dirección.',
        creado: '09:00 AM',
        empresa: 'DistribuidoraPro C.A.',
        destinoLat: 10.4762, destinoLng: -66.8293,
        choferLat: 10.4762, choferLng: -66.8293,
        history: [
            { label: 'Creada', sub: '09:00 AM · Recibida en sistema', done: true, active: false, color: TEXT_SUB },
            { label: 'En Tránsito', sub: '10:10 AM · En ruta', done: true, active: false, color: TEXT_SUB },
            { label: 'Intento de entrega', sub: '12:05 PM · Sin receptor', done: true, active: true, color: RED },
            { label: 'Entregado', sub: 'Pendiente reprogramación', done: false, active: false, color: TEXT_SUB },
        ],
    },
}

const STATUS_CFG: Record<string, { label: string; color: string }> = {
    EN_RUTA: { label: 'En Tránsito', color: PINK },
    ENTREGADO: { label: 'Entregado', color: GREEN },
    FALLIDO: { label: 'Fallido', color: RED },
    ASIGNADA: { label: 'Asignada', color: AMBER },
    PENDIENTE: { label: 'Pendiente', color: TEXT_SUB },
}

// ── Leaflet markers ───────────────────────────────────────────────────────────
function makeDestIcon() {
    return L.divIcon({
        className: '',
        html: `<div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,${PINK},${LILAC});border:2.5px solid rgba(255,255,255,0.85);display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 4px rgba(236,72,153,0.2),0 4px 12px rgba(0,0,0,0.5);">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>`,
        iconSize: [30, 30], iconAnchor: [15, 15],
    })
}

function makeDriverIcon() {
    return L.divIcon({
        className: '',
        html: `<div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#2a1020,#3d1a2e);border:2.5px solid ${PINK};display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 4px rgba(236,72,153,0.15),0 4px 12px rgba(0,0,0,0.5);">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${PINK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 4v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
        </div>`,
        iconSize: [34, 34], iconAnchor: [17, 17],
    })
}

function MapFit({ bounds }: { bounds: [[number, number], [number, number]] }) {
    const map = useMap()
    useEffect(() => {
        map.invalidateSize()
        map.fitBounds(bounds, { padding: [44, 44] })
    }, [map])
    return null
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TrackingPage() {
    const { orderId } = useParams<{ orderId: string }>()
    const navigate = useNavigate()
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        const t = setTimeout(() => {
            const found = MOCK_ORDERS[orderId ?? '']
            found ? setOrder(found) : setNotFound(true)
            setLoading(false)
        }, 850)
        return () => clearTimeout(t)
    }, [orderId])

    const handleRefresh = async () => {
        setRefreshing(true)
        await new Promise(r => setTimeout(r, 1100))
        setRefreshing(false)
    }

    if (loading) return <LoadingScreen />
    if (notFound) return <NotFoundScreen code={orderId} />

    const cfg = STATUS_CFG[order.status] ?? STATUS_CFG.PENDIENTE
    const isLive = order.status === 'EN_RUTA'
    const isDone = order.status === 'ENTREGADO'

    const destPos: [number, number] = [order.destinoLat, order.destinoLng]
    const driverPos: [number, number] = [order.choferLat, order.choferLng]
    const bounds: [[number, number], [number, number]] = [
        [Math.min(destPos[0], driverPos[0]) - 0.007, Math.min(destPos[1], driverPos[1]) - 0.007],
        [Math.max(destPos[0], driverPos[0]) + 0.007, Math.max(destPos[1], driverPos[1]) + 0.007],
    ]

    return (
        <div style={{ minHeight: '100dvh', backgroundColor: BG, fontFamily: F, display: 'flex', flexDirection: 'column' }}>
            <style>{`
                @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
                @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
                @keyframes spinA   { to{transform:rotate(360deg)} }
                @keyframes ping    { 0%{transform:scale(0.8);opacity:0.5} 75%{transform:scale(2.2);opacity:0} 100%{transform:scale(2.2);opacity:0} }
                .trk-spin { animation: spinA 0.85s linear infinite; }
                .leaflet-container { background: ${SURFACE} !important; }
                .leaflet-control-zoom, .leaflet-control-attribution { display:none!important; }
                .leaflet-tile-pane { filter:brightness(0.78) saturate(0.8) hue-rotate(200deg); }
                ::-webkit-scrollbar { width:3px; }
                ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
                .trk-nav-links { display:none; }
                @media(min-width:700px){ .trk-nav-links{display:flex!important;} }
                @media(min-width:860px){ .trk-main-grid{grid-template-columns:300px 1fr!important;} }
                @media(min-width:1080px){ .trk-main-grid{grid-template-columns:340px 1fr!important;} }
            `}</style>

            {/* ── Navbar ── */}
            <nav style={{
                backgroundColor: SURFACE, height: 52,
                display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16,
                borderBottom: `1px solid ${BORDER_W}`,
                position: 'sticky', top: 0, zIndex: 100,
                animation: 'fadeIn 0.3s ease both',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 'auto' }}>
                    <div style={{
                        width: 26, height: 26, borderRadius: 7,
                        background: `linear-gradient(135deg,${PINK},${LILAC})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 3px 10px rgba(236,72,153,0.35)`,
                    }}>
                        <Zap size={12} color="white" fill="white" />
                    </div>
                    <span style={{
                        fontFamily: F, fontWeight: 800, fontSize: 13, letterSpacing: '-0.01em',
                        background: `linear-gradient(135deg,${PINK},${LILAC})`,
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    }}>
                        Velvet Kinetic Logistics
                    </span>
                </div>

                <div className="trk-nav-links" style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                    {['Track', 'Soporte'].map((l, i) => (
                        <span 
                            key={l} 
                            onClick={() => i === 1 && navigate(`/soporte?codigo=${order?.trackingCode ?? ''}`)}
                            style={{
                                fontFamily: F, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                color: i === 0 ? TEXT : TEXT_MID,
                                borderBottom: i === 0 ? `2px solid ${PINK}` : '2px solid transparent',
                                paddingBottom: 2,
                            }}
                        >
                            {l}
                        </span>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginLeft: 12 }}>
                    <Globe size={16} color={TEXT_MID} style={{ cursor: 'pointer' }} />
                    <HelpCircle size={16} color={TEXT_MID} style={{ cursor: 'pointer' }} />
                </div>
            </nav>

            {/* ── Hero ── */}
            <div style={{
                backgroundColor: SURFACE, borderBottom: `1px solid ${BORDER_W}`,
                padding: '32px 20px 24px', textAlign: 'center',
                animation: 'fadeUp 0.4s ease 0.05s both',
            }}>
                <h1 style={{
                    fontFamily: F, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05,
                    fontSize: 'clamp(1.8rem, 5vw, 3rem)', color: 'white', margin: '0 0 10px',
                }}>
                    Real–Time{' '}
                    <span style={{
                        background: `linear-gradient(135deg,${PINK},${LILAC})`,
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    }}>
                        Momentum
                    </span>
                </h1>
                <p style={{ fontFamily: F, fontSize: 13, color: TEXT_MID, margin: '0 auto 20px', maxWidth: 400, lineHeight: 1.6 }}>
                    Ingresa tu código LogiPyme para vivir la precisión del tracking y actualizaciones cinéticas en tiempo real.
                </p>

                {/* Code pill */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center',
                    backgroundColor: CARD, border: `1px solid ${BORDER}`,
                    borderRadius: 13, padding: '9px 6px 9px 14px', gap: 8,
                    maxWidth: 420, width: '100%', boxShadow: SHADOW,
                }}>
                    <Navigation size={14} color={PINK} />
                    <span style={{
                        flex: 1, fontFamily: MONO, fontSize: 12, fontWeight: 600,
                        color: TEXT_MID, textAlign: 'left',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {order.trackingCode}
                    </span>
                    <button onClick={handleRefresh} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        backgroundColor: PINK, color: 'white', border: 'none',
                        borderRadius: 9, padding: '7px 14px', cursor: 'pointer',
                        fontFamily: F, fontSize: 12, fontWeight: 700,
                        boxShadow: '0 3px 10px rgba(236,72,153,0.3)',
                        whiteSpace: 'nowrap', flexShrink: 0, transition: 'opacity 0.15s',
                    }}>
                        <RefreshCw size={11} className={refreshing ? 'trk-spin' : ''} />
                        {refreshing ? 'Actualizando…' : 'Track Now'}
                    </button>
                </div>
            </div>

            {/* ── 2-col grid ── */}
            <div
                className="trk-main-grid"
                style={{
                    flex: 1, display: 'grid',
                    gridTemplateColumns: '1fr',   // mobile default — CSS override en desktop
                    maxWidth: 1200, width: '100%', margin: '0 auto',
                    animation: 'fadeUp 0.4s ease 0.15s both',
                }}
            >
                {/* ── COL IZQUIERDA ── */}
                <div style={{ display: 'flex', flexDirection: 'column', borderRight: `1px solid ${BORDER_W}` }}>

                    {/* Current status */}
                    <div style={{ backgroundColor: CARD, borderBottom: `1px solid ${BORDER_W}`, padding: '20px 20px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <span style={{ fontFamily: F, fontSize: 10, fontWeight: 700, color: TEXT_SUB, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                                ESTADO ACTUAL
                            </span>
                            {/* Pulsing dot */}
                            <span style={{ position: 'relative', display: 'inline-flex', width: 10, height: 10 }}>
                                <span style={{
                                    position: 'absolute', inset: 0, borderRadius: '50%',
                                    backgroundColor: cfg.color, opacity: 0.35,
                                    animation: isLive ? 'ping 1.8s infinite' : 'none',
                                }} />
                                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: cfg.color, display: 'inline-block' }} />
                            </span>
                        </div>

                        <h2 style={{ fontFamily: F, fontSize: 28, fontWeight: 900, color: 'white', margin: '0 0 22px', letterSpacing: '-0.025em' }}>
                            {cfg.label}
                        </h2>

                        {/* Timeline */}
                        <div>
                            {order.history.map((h: any, i: number) => (
                                <div key={i} style={{
                                    display: 'flex', gap: 14, alignItems: 'flex-start',
                                    paddingBottom: i < order.history.length - 1 ? 18 : 22,
                                    opacity: h.done ? 1 : 0.3,
                                }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                        <div style={{
                                            width: 18, height: 18, borderRadius: '50%',
                                            backgroundColor: h.done ? h.color : 'transparent',
                                            border: `2px solid ${h.done ? h.color : BORDER_W}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: h.active ? `0 0 0 4px ${h.color}22` : 'none',
                                            zIndex: 1, position: 'relative',
                                        }}>
                                            {h.done && <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: 'white' }} />}
                                        </div>
                                        {i < order.history.length - 1 && (
                                            <div style={{ width: 1, flex: 1, minHeight: 18, backgroundColor: h.done ? `${h.color}35` : BORDER_W, margin: '3px 0' }} />
                                        )}
                                    </div>
                                    <div style={{ paddingTop: 0 }}>
                                        <p style={{
                                            fontFamily: F, fontSize: 14, margin: '0 0 2px',
                                            fontWeight: h.active ? 700 : 500,
                                            color: h.active ? h.color : h.done ? TEXT : TEXT_SUB,
                                        }}>
                                            {h.label}
                                        </p>
                                        <p style={{ fontFamily: F, fontSize: 11, color: TEXT_SUB, margin: 0 }}>{h.sub}</p>
                                        {h.note && (
                                            <p style={{ fontFamily: F, fontSize: 10, color: `${PINK}80`, margin: '3px 0 0', fontStyle: 'italic' }}>{h.note}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Delivery summary */}
                    <div style={{ backgroundColor: CARD, borderBottom: `1px solid ${BORDER_W}`, padding: '18px 20px', flex: 1 }}>
                        <p style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: TEXT, margin: '0 0 16px' }}>
                            Resumen de Entrega
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                            {[
                                { Icon: User, label: 'DESTINATARIO', val: order.cliente },
                                { Icon: MapPin, label: 'DIRECCIÓN', val: order.direccion },
                                {
                                    Icon: Clock, label: 'LLEGADA ESTIMADA',
                                    val: order.status === 'EN_RUTA'
                                        ? `${new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })} · ${order.eta}`
                                        : order.status === 'ENTREGADO' ? `Entregado ${order.eta}` : '—',
                                },
                                {
                                    Icon: Truck, label: 'REPARTIDOR',
                                    val: `${order.chofer.nombre} ${order.chofer.apellido}`,
                                    phone: isLive ? order.chofer.telefono : null,
                                },
                            ].map(({ Icon, label, val, phone }, i) => (
                                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                        backgroundColor: 'rgba(236,72,153,0.09)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Icon size={14} color={PINK} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontFamily: F, fontSize: 9, fontWeight: 700, color: TEXT_SUB, textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 2px' }}>
                                            {label}
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: TEXT, margin: 0, lineHeight: 1.4, flex: 1, minWidth: 0 }}>
                                                {val}
                                            </p>
                                            {phone && (
                                                <a href={`tel:${phone}`} style={{
                                                    width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                                                    backgroundColor: 'rgba(16,185,129,0.15)',
                                                    border: '1px solid rgba(16,185,129,0.25)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: GREEN, textDecoration: 'none',
                                                }}>
                                                    <Phone size={12} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── COL DERECHA — mapa ── */}
                <div style={{ backgroundColor: CARD, display: 'flex', flexDirection: 'column', minHeight: 420 }}>

                    {/* Telemetry header */}
                    <div style={{
                        padding: '10px 14px 8px',
                        borderBottom: `1px solid ${BORDER_W}`,
                        backgroundColor: 'rgba(0,0,0,0.25)',
                        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    }}>
                        <div>
                            <span style={{ fontFamily: F, fontSize: 9, fontWeight: 700, color: TEXT_SUB, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                                {isLive ? 'TELEMETRÍA EN VIVO' : 'MAPA DE ENTREGA'}
                            </span>
                            {isLive && (
                                <>
                                    <p style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: TEXT, margin: '2px 0 0', letterSpacing: '0.01em' }}>
                                        {order.destinoLat.toFixed(5)}°N {Math.abs(order.destinoLng).toFixed(5)}°E
                                    </p>
                                    <div style={{ display: 'flex', gap: 14, marginTop: 2 }}>
                                        <span style={{ fontFamily: F, fontSize: 10, color: TEXT_SUB }}>Velocidad: 64 km/h</span>
                                        <span style={{ fontFamily: F, fontSize: 10, color: TEXT_SUB }}>Altitud: 822m</span>
                                    </div>
                                </>
                            )}
                        </div>
                        {isLive && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: GREEN, display: 'inline-block', boxShadow: `0 0 6px ${GREEN}` }} />
                                <span style={{ fontFamily: F, fontSize: 10, fontWeight: 700, color: GREEN }}>EN VIVO</span>
                            </div>
                        )}
                    </div>

                    {/* Map */}
                    <div style={{ flex: 1, position: 'relative', minHeight: 280 }}>
                        <MapContainer
                            center={destPos}
                            zoom={13}
                            style={{ width: '100%', height: '100%', minHeight: 280 }}
                            zoomControl={false}
                        >
                            <MapFit bounds={bounds} />
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                            {isLive && (
                                <Polyline
                                    positions={[driverPos, destPos]}
                                    pathOptions={{ color: PINK, weight: 2.5, opacity: 0.65, dashArray: '7,5' }}
                                />
                            )}
                            <Marker position={destPos} icon={makeDestIcon()} />
                            {isLive && <Marker position={driverPos} icon={makeDriverIcon()} />}
                        </MapContainer>

                        {/* Zoom controls */}
                        <div style={{
                            position: 'absolute', top: 10, right: 10, zIndex: 1000,
                            display: 'flex', flexDirection: 'column', gap: 3,
                        }}>
                            {['+', '−'].map(s => (
                                <button key={s} style={{
                                    width: 30, height: 30, borderRadius: 7,
                                    backgroundColor: 'rgba(26,10,20,0.88)',
                                    border: `1px solid ${BORDER_W}`,
                                    color: TEXT_MID, fontFamily: MONO, fontSize: 15, fontWeight: 700,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    backdropFilter: 'blur(4px)',
                                }}>{s}</button>
                            ))}
                        </div>

                        {/* Destination pin icon bottom-right */}
                        <div style={{
                            position: 'absolute', bottom: 10, right: 10, zIndex: 1000,
                            width: 30, height: 30, borderRadius: '50%',
                            backgroundColor: 'rgba(26,10,20,0.88)',
                            border: `1px solid ${BORDER}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backdropFilter: 'blur(4px)',
                        }}>
                            <MapPin size={13} color={PINK} />
                        </div>
                    </div>

                    {/* Telemetry footer */}
                    <div style={{
                        borderTop: `1px solid ${BORDER_W}`,
                        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                        backgroundColor: 'rgba(0,0,0,0.2)',
                    }}>
                        {[
                            { label: 'DIST. REST.', value: isLive ? `${order.distKm} km` : '0 km' },
                            { label: 'TIEMPO AL DESTINO', value: isLive ? order.timeToTarget : '—' },
                            { label: 'SIGUIENTE HUB', value: order.nextHub },
                        ].map((s, i) => (
                            <div key={i} style={{
                                padding: '11px 12px',
                                borderRight: i < 2 ? `1px solid ${BORDER_W}` : 'none',
                            }}>
                                <p style={{ fontFamily: F, fontSize: 9, fontWeight: 700, color: TEXT_SUB, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 3px' }}>
                                    {s.label}
                                </p>
                                <p style={{ fontFamily: MONO, fontSize: 19, fontWeight: 900, color: TEXT, margin: 0, letterSpacing: '-0.02em' }}>
                                    {s.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Bottom 3 cards ── */}
            <div style={{
                maxWidth: 1200, width: '100%', margin: '0 auto',
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
                animation: 'fadeUp 0.4s ease 0.25s both',
            }}>
                {[
                    { Icon: Package, label: 'Peso del Paquete', val: order.peso, sub: 'STANDARD EXPRESS CARGO', color: PINK },
                    { Icon: Shield, label: 'LogiGuard Plus', val: 'Asegurado', sub: 'SEGURO ACTIVO · COBERTURA TOTAL', color: LILAC },
                    { Icon: Navigation, label: 'Eco-Precisión', val: isDone ? 'Completado' : isLive ? 'En curso' : '—', sub: 'RUTA OPTIMIZADA PARA EFICIENCIA', color: GREEN },
                ].map(({ Icon, label, val, sub, color }, i) => (
                    <div key={i} style={{
                        backgroundColor: CARD,
                        borderTop: `1px solid ${BORDER_W}`,
                        borderRight: i < 2 ? `1px solid ${BORDER_W}` : 'none',
                        padding: '16px 18px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <div style={{
                                width: 30, height: 30, borderRadius: 8,
                                backgroundColor: `${color}15`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Icon size={16} color={color} />
                            </div>
                            <span style={{ fontFamily: F, fontSize: 12, color: TEXT_MID, fontWeight: 500 }}>{label}</span>
                        </div>
                        <p style={{ fontFamily: F, fontSize: 21, fontWeight: 900, color: TEXT, margin: '0 0 3px', letterSpacing: '-0.02em' }}>{val}</p>
                        <p style={{ fontFamily: F, fontSize: 9, fontWeight: 700, color: TEXT_SUB, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>{sub}</p>
                    </div>
                ))}
            </div>

            {/* ── Footer ── */}
            <div style={{
                borderTop: `1px solid ${BORDER_W}`,
                backgroundColor: SURFACE,
                padding: '12px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
                animation: 'fadeIn 0.4s ease 0.3s both',
            }}>
                <span style={{ fontFamily: F, fontSize: 10, color: TEXT_SUB }}>
                    © 2026 VELVET KINETIC · PRECISION MICRO-LOGISTICS
                </span>
                <button
                    onClick={() => navigate(`/soporte?codigo=${order?.trackingCode ?? ''}`)}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: 'none', border: `1px solid ${BORDER}`,
                        borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
                        fontFamily: F, fontSize: 10, fontWeight: 700, color: PINK,
                        transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(236,72,153,0.07)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                    <MessageCircle size={11} />
                    SOPORTE
                </button>
            </div>

            <div style={{ height: 'env(safe-area-inset-bottom, 8px)' }} />
        </div>
    )
}

// ── Loading ───────────────────────────────────────────────────────────────────
function LoadingScreen() {
    return (
        <div style={{ minHeight: '100dvh', backgroundColor: BG, fontFamily: F, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
            <div style={{
                width: 50, height: 50, borderRadius: 14,
                background: `linear-gradient(135deg,${PINK},${LILAC})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 8px 28px rgba(236,72,153,0.35)`,
            }}>
                <Truck size={22} color="white" />
            </div>
            <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: TEXT, margin: '0 0 10px' }}>Buscando tu paquete…</p>
                <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                    {[0, 1, 2].map(i => (
                        <div key={i} style={{
                            width: 6, height: 6, borderRadius: '50%', backgroundColor: PINK,
                            animation: `ping 1.2s ${i * 0.2}s ease-in-out infinite`,
                        }} />
                    ))}
                </div>
            </div>
            <style>{`@keyframes ping{0%,100%{opacity:0.3;transform:scale(0.85)}50%{opacity:1;transform:scale(1.2)}}`}</style>
        </div>
    )
}

// ── Not found ─────────────────────────────────────────────────────────────────
function NotFoundScreen({ code }: { code?: string }) {
    return (
        <div style={{ minHeight: '100dvh', backgroundColor: BG, fontFamily: F, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, backgroundColor: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <AlertCircle size={26} color={RED} />
            </div>
            <p style={{ fontSize: 19, fontWeight: 900, color: TEXT, margin: '0 0 8px' }}>Paquete no encontrado</p>
            <p style={{ fontSize: 13, color: TEXT_MID, margin: '0 0 20px', maxWidth: 300, lineHeight: 1.6 }}>
                No encontramos ninguna orden con el código{' '}
                <span style={{ fontFamily: MONO, color: RED, fontWeight: 700 }}>{code}</span>.
            </p>
            <div style={{ padding: '10px 16px', borderRadius: 10, backgroundColor: 'rgba(236,72,153,0.08)', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 7 }}>
                <Clock size={12} color={PINK} />
                <span style={{ fontFamily: F, fontSize: 12, color: PINK, fontWeight: 600 }}>¿Recién creado? Puede tardar unos minutos.</span>
            </div>
        </div>
    )
}