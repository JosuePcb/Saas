import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, Search, Bell, ChevronRight, LogOut, User, Settings, X } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Role } from '@/types/enums'

interface Props { onMenuClick: () => void }

// ── Tema por rol ──────────────────────────────────────────────────────────────
interface TopBarTheme {
    bg: string
    border: string
    primary: string        // color acento principal
    primaryDim: string     // versión opaca del acento
    searchFocusBorder: string
    searchFocusShadow: string
    avatarBg: string
    notifDot: string
    dropBg: string
    dropBorder: string
    dropText: string
    dropTextSub: string
    dropHoverBg: string
    dropHoverText: string
    logoutColor: string
    logoutHoverBg: string
}

const THEMES: Record<string, TopBarTheme> = {
    [Role.ADMIN_PYME]: {
        bg: '#1a0a14',
        border: 'rgba(236,72,153,0.12)',
        primary: '#EC4899',
        primaryDim: 'rgba(236,72,153,0.15)',
        searchFocusBorder: '#EC4899',
        searchFocusShadow: '0 0 0 3px rgba(236,72,153,0.15)',
        avatarBg: '#EC4899',
        notifDot: '#EC4899',
        dropBg: '#1f0e18',
        dropBorder: 'rgba(236,72,153,0.15)',
        dropText: 'rgba(255,255,255,0.88)',
        dropTextSub: 'rgba(255,255,255,0.38)',
        dropHoverBg: 'rgba(255,255,255,0.05)',
        dropHoverText: 'rgba(255,255,255,0.9)',
        logoutColor: '#EC4899',
        logoutHoverBg: 'rgba(236,72,153,0.08)',
    },
    [Role.DESPACHADOR]: {
        bg: '#1a0a14',
        border: 'rgba(236,72,153,0.12)',
        primary: '#EC4899',
        primaryDim: 'rgba(236,72,153,0.15)',
        searchFocusBorder: '#EC4899',
        searchFocusShadow: '0 0 0 3px rgba(236,72,153,0.15)',
        avatarBg: '#EC4899',
        notifDot: '#EC4899',
        dropBg: '#1f0e18',
        dropBorder: 'rgba(236,72,153,0.15)',
        dropText: 'rgba(255,255,255,0.88)',
        dropTextSub: 'rgba(255,255,255,0.38)',
        dropHoverBg: 'rgba(255,255,255,0.05)',
        dropHoverText: 'rgba(255,255,255,0.9)',
        logoutColor: '#EC4899',
        logoutHoverBg: 'rgba(236,72,153,0.08)',
    },
    [Role.CHOFER]: {
        bg: '#0c2236',
        border: 'rgba(56,189,248,0.12)',
        primary: '#38BDF8',
        primaryDim: 'rgba(56,189,248,0.15)',
        searchFocusBorder: '#38BDF8',
        searchFocusShadow: '0 0 0 3px rgba(56,189,248,0.15)',
        avatarBg: '#38BDF8',
        notifDot: '#38BDF8',
        dropBg: '#0c2236',
        dropBorder: 'rgba(56,189,248,0.15)',
        dropText: 'rgba(255,255,255,0.88)',
        dropTextSub: 'rgba(255,255,255,0.38)',
        dropHoverBg: 'rgba(56,189,248,0.07)',
        dropHoverText: 'rgba(255,255,255,0.9)',
        logoutColor: '#38BDF8',
        logoutHoverBg: 'rgba(56,189,248,0.08)',
    },
    [Role.SUPER_ADMIN]: {
        bg: '#1a1040',
        border: 'rgba(139,92,246,0.15)',
        primary: '#8B5CF6',
        primaryDim: 'rgba(139,92,246,0.15)',
        searchFocusBorder: '#8B5CF6',
        searchFocusShadow: '0 0 0 3px rgba(139,92,246,0.18)',
        avatarBg: '#8B5CF6',
        notifDot: '#A78BFA',
        dropBg: '#1a1040',
        dropBorder: 'rgba(139,92,246,0.18)',
        dropText: 'rgba(237,233,254,0.9)',
        dropTextSub: 'rgba(167,139,250,0.5)',
        dropHoverBg: 'rgba(139,92,246,0.08)',
        dropHoverText: '#ede9fe',
        logoutColor: '#A78BFA',
        logoutHoverBg: 'rgba(139,92,246,0.1)',
    },
}

const DEFAULT_THEME = THEMES[Role.ADMIN_PYME]

// ── Breadcrumb labels ─────────────────────────────────────────────────────────
const routeLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    orders: 'Órdenes',
    routes: 'Rutas',
    fleet: 'Flota',
    users: 'Usuarios',
    billing: 'Facturación',
    driver: 'Inicio',
    stops: 'Mis Entregas',
    superadmin: 'Dashboard Global',
    payments: 'Cola de Pagos',
    tenants: 'Tenants',
    new: 'Nueva',
    settings: 'Configuración',
    tracking: 'Tracking',
}

const MOCK_NOTIFS = [
    { id: 1, text: 'Orden TRK-2845 cancelada', time: 'hace 5 min', dot: '#EF4444', read: false },
    { id: 2, text: 'Luis Ramos completó su ruta', time: 'hace 12 min', dot: '#10B981', read: false },
    { id: 3, text: 'Nueva orden TRK-2846 creada', time: 'hace 20 min', dot: '#3B82F6', read: true },
]

function useBreadcrumbs() {
    const { pathname } = useLocation()
    const parts = pathname.replace('/app/', '').replace('/app', '').split('/').filter(Boolean)
    return parts.map((part, i) => ({
        label: routeLabels[part] ?? part,
        isLast: i === parts.length - 1,
    }))
}

export default function TopBar({ onMenuClick }: Props) {
    const { user, clearAuth } = useAuthStore()
    const navigate = useNavigate()
    const breadcrumbs = useBreadcrumbs()
    const theme = THEMES[user?.role ?? ''] ?? DEFAULT_THEME

    const [userDrop, setUserDrop] = useState(false)
    const [bellDrop, setBellDrop] = useState(false)
    const [searchVal, setSearchVal] = useState('')
    const [searchFocus, setSearchFocus] = useState(false)
    const userRef = useRef<HTMLDivElement>(null)
    const bellRef = useRef<HTMLDivElement>(null)

    const unread = MOCK_NOTIFS.filter(n => !n.read).length

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (userRef.current && !userRef.current.contains(e.target as Node)) setUserDrop(false)
            if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellDrop(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const initials = user
        ? `${user.nombre?.[0] ?? ''}${user.apellido?.[0] ?? ''}`.toUpperCase()
        : '?'

    const handleLogout = () => { clearAuth(); navigate('/login') }

    // ── Estilos del dropdown compartido ──────────────────────────────────────
    const dropStyle: React.CSSProperties = {
        position: 'absolute', right: 0, top: 52, zIndex: 50,
        backgroundColor: theme.dropBg,
        border: `1px solid ${theme.dropBorder}`,
        borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        overflow: 'hidden',
    }

    return (
        <header
            className="shrink-0 flex items-center gap-3 px-4 sm:px-6"
            style={{
                height: 64,
                backgroundColor: theme.bg,
                borderBottom: `1px solid ${theme.border}`,
                zIndex: 10,
                transition: 'background-color 0.3s ease, border-color 0.3s ease',
            }}
        >
            {/* Hamburger mobile */}
            <button
                onClick={onMenuClick}
                className="lg:hidden p-2 rounded-xl transition-colors"
                style={{ color: 'rgba(255,255,255,0.5)' }}
            >
                <Menu size={20} />
            </button>

            {/* Breadcrumb desktop */}
            <nav className="hidden sm:flex items-center gap-1.5 flex-1 min-w-0">
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>App</span>
                {breadcrumbs.map((bc) => (
                    <span key={bc.label} className="flex items-center gap-1.5">
                        <ChevronRight size={13} className="shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }} />
                        <span className="text-sm truncate" style={{
                            fontWeight: bc.isLast ? 600 : 400,
                            color: bc.isLast ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                        }}>
                            {bc.label}
                        </span>
                    </span>
                ))}
            </nav>

            {/* Título mobile */}
            <span className="sm:hidden flex-1 text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>
                {breadcrumbs.at(-1)?.label ?? 'App'}
            </span>

            {/* Búsqueda */}
            <div
                className="hidden md:flex items-center gap-2 px-3 h-9 rounded-xl transition-all duration-200 overflow-hidden"
                style={{
                    border: `1.5px solid ${searchFocus || searchVal ? theme.searchFocusBorder : 'rgba(255,255,255,0.1)'}`,
                    backgroundColor: searchFocus || searchVal ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
                    width: searchFocus || searchVal ? 260 : 160,
                    boxShadow: searchFocus ? theme.searchFocusShadow : 'none',
                    flexShrink: 0,
                }}
            >
                <Search size={14} style={{
                    color: searchFocus || searchVal ? theme.primary : 'rgba(255,255,255,0.3)',
                    flexShrink: 0,
                    transition: 'color 0.15s',
                }} />
                <input
                    type="text"
                    value={searchVal}
                    onChange={e => setSearchVal(e.target.value.slice(0, 50))}
                    placeholder="Buscar..."
                    maxLength={50}
                    style={{
                        flex: 1, minWidth: 0, border: 'none', outline: 'none',
                        backgroundColor: 'transparent', fontSize: 13,
                        color: 'rgba(255,255,255,0.85)',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                    onFocus={() => setSearchFocus(true)}
                    onBlur={() => setSearchFocus(false)}
                />
                {searchVal && (
                    <button
                        onMouseDown={e => { e.preventDefault(); setSearchVal('') }}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
                            color: 'rgba(255,255,255,0.4)', flexShrink: 0, display: 'flex', alignItems: 'center',
                            borderRadius: 4, transition: 'color 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = theme.primary)}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                    >
                        <X size={13} />
                    </button>
                )}
            </div>

            {/* Campana */}
            <div className="relative" ref={bellRef}>
                <button
                    onClick={() => { setBellDrop(!bellDrop); setUserDrop(false) }}
                    className="relative p-2 rounded-xl transition-colors"
                    style={{ color: 'rgba(255,255,255,0.5)', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
                >
                    <Bell size={20} />
                    {unread > 0 && (
                        <span
                            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                            style={{ backgroundColor: theme.notifDot, transition: 'background-color 0.3s' }}
                        />
                    )}
                </button>

                {bellDrop && (
                    <div style={{ ...dropStyle, width: 300 }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px 16px', borderBottom: `1px solid ${theme.dropBorder}`,
                        }}>
                            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: theme.dropText, margin: 0 }}>
                                Notificaciones
                            </p>
                            {unread > 0 && (
                                <span style={{
                                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                                    backgroundColor: theme.primary, color: 'white',
                                }}>
                                    {unread} nuevas
                                </span>
                            )}
                        </div>
                        {MOCK_NOTIFS.map(n => (
                            <div
                                key={n.id}
                                style={{
                                    display: 'flex', alignItems: 'flex-start', gap: 10,
                                    padding: '11px 16px', cursor: 'pointer',
                                    opacity: n.read ? 0.45 : 1,
                                    borderBottom: `1px solid ${theme.dropBorder}`,
                                    transition: 'background 0.12s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = theme.dropHoverBg)}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: n.dot, flexShrink: 0, marginTop: 5 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: theme.dropText, margin: '0 0 2px', lineHeight: 1.4 }}>
                                        {n.text}
                                    </p>
                                    <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: theme.dropTextSub, margin: 0 }}>
                                        {n.time}
                                    </p>
                                </div>
                                {!n.read && (
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: theme.primary, flexShrink: 0, marginTop: 6 }} />
                                )}
                            </div>
                        ))}
                        <div style={{ padding: '10px 16px', textAlign: 'center' }}>
                            <button style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                fontSize: 12, fontWeight: 600, color: theme.primary,
                            }}>
                                Ver todas las notificaciones
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Avatar */}
            <div className="relative" ref={userRef}>
                <button
                    onClick={() => { setUserDrop(!userDrop); setBellDrop(false) }}
                    style={{
                        width: 36, height: 36, borderRadius: 10,
                        backgroundColor: theme.avatarBg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: 12, fontWeight: 800,
                        border: 'none', cursor: 'pointer',
                        transition: 'background-color 0.3s, opacity 0.15s',
                        boxShadow: `0 3px 10px ${theme.primaryDim}`,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                    {initials}
                </button>

                {userDrop && (
                    <div style={{ ...dropStyle, width: 220 }}>
                        {/* Info usuario */}
                        <div style={{
                            padding: '12px 16px',
                            borderBottom: `1px solid ${theme.dropBorder}`,
                        }}>
                            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, color: theme.dropText, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user?.nombre} {user?.apellido}
                            </p>
                            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: theme.dropTextSub, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user?.email}
                            </p>
                        </div>

                        {/* Items */}
                        {[
                            { icon: <User size={14} />, label: 'Mi perfil', action: () => { navigate('/app/settings'); setUserDrop(false) } },
                            { icon: <Settings size={14} />, label: 'Configuración', action: () => { navigate('/app/settings'); setUserDrop(false) } },
                        ].map(item => (
                            <button
                                key={item.label}
                                onClick={item.action}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
                                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13,
                                    color: theme.dropTextSub, textAlign: 'left',
                                    transition: 'background 0.12s, color 0.12s',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = theme.dropHoverBg
                                    e.currentTarget.style.color = theme.dropHoverText
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'transparent'
                                    e.currentTarget.style.color = theme.dropTextSub
                                }}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}

                        {/* Logout */}
                        <div style={{ borderTop: `1px solid ${theme.dropBorder}`, marginTop: 2, paddingTop: 2 }}>
                            <button
                                onClick={handleLogout}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
                                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600,
                                    color: theme.logoutColor, textAlign: 'left',
                                    transition: 'background 0.12s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = theme.logoutHoverBg)}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <LogOut size={14} />
                                Cerrar sesión
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </header>
    )
}