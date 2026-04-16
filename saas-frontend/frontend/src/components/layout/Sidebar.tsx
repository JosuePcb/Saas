import { NavLink, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, Package, Map, Truck, Users, CreditCard,
    Home, ClipboardList, Globe, Wallet, Building2,
    Zap, LogOut, X, Settings,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Role } from '@/types/enums'

interface Props {
    onClose?: () => void
    collapsed?: boolean
}

const navByRole: Record<string, { label: string; icon: React.ReactNode; to: string }[]> = {
    [Role.ADMIN_PYME]: [
        { label: 'Dashboard', icon: <LayoutDashboard size={19} />, to: '/app/dashboard' },
        { label: 'Órdenes', icon: <Package size={19} />, to: '/app/orders' },
        { label: 'Rutas', icon: <Map size={19} />, to: '/app/routes' },
        { label: 'Flota', icon: <Truck size={19} />, to: '/app/fleet' },
        { label: 'Usuarios', icon: <Users size={19} />, to: '/app/users' },
        { label: 'Facturación', icon: <CreditCard size={19} />, to: '/app/billing' },
        { label: 'Configuración', icon: <Settings size={19} />, to: '/app/settings' },
    ],
    [Role.DESPACHADOR]: [
        { label: 'Dashboard', icon: <LayoutDashboard size={19} />, to: '/app/dashboard' },
        { label: 'Órdenes', icon: <Package size={19} />, to: '/app/orders' },
        { label: 'Rutas', icon: <Map size={19} />, to: '/app/routes' },
        { label: 'Flota', icon: <Truck size={19} />, to: '/app/fleet' },
        { label: 'Configuración', icon: <Settings size={19} />, to: '/app/settings' },
    ],
    [Role.CHOFER]: [
        { label: 'Inicio', icon: <Home size={19} />, to: '/app/driver' },
        { label: 'Mis Entregas', icon: <ClipboardList size={19} />, to: '/app/driver/stops' },
        { label: 'Configuración', icon: <Settings size={19} />, to: '/app/settings' },
    ],
    [Role.SUPER_ADMIN]: [
        { label: 'Dashboard Global', icon: <Globe size={19} />, to: '/app/superadmin' },
        { label: 'Cola de Pagos', icon: <Wallet size={19} />, to: '/app/superadmin/payments' },
        { label: 'Tenants', icon: <Building2 size={19} />, to: '/app/superadmin/tenants' },
    ],
}

const roleLabels: Record<string, string> = {
    [Role.ADMIN_PYME]: 'Admin PYME',
    [Role.DESPACHADOR]: 'Despachador',
    [Role.CHOFER]: 'Chofer',
    [Role.SUPER_ADMIN]: 'Super Admin',
}

// ── Tema por rol ──────────────────────────────────────────────────────────────
interface RoleTheme {
    bg: string
    orb: string
    logoBg: string
    logoShadow: string
    activeNavBg: string
    activeBar: string
    activeIcon: string
    avatarBg: string
    logoutHover: string
    border: string
}

const THEMES: Record<string, RoleTheme> = {
    [Role.ADMIN_PYME]: {
        bg: '#1a0a14',
        orb: 'rgba(236,72,153,0.12)',
        logoBg: '#EC4899',
        logoShadow: '0 4px 14px rgba(236,72,153,0.35)',
        activeNavBg: 'rgba(236,72,153,0.13)',
        activeBar: '#EC4899',
        activeIcon: '#EC4899',
        avatarBg: '#EC4899',
        logoutHover: '#EC4899',
        border: 'rgba(255,255,255,0.06)',
    },
    [Role.DESPACHADOR]: {
        bg: '#1a0a14',
        orb: 'rgba(236,72,153,0.12)',
        logoBg: '#EC4899',
        logoShadow: '0 4px 14px rgba(236,72,153,0.35)',
        activeNavBg: 'rgba(236,72,153,0.13)',
        activeBar: '#EC4899',
        activeIcon: '#EC4899',
        avatarBg: '#EC4899',
        logoutHover: '#EC4899',
        border: 'rgba(255,255,255,0.06)',
    },
    [Role.CHOFER]: {
        bg: '#071828',
        orb: 'rgba(56,189,248,0.1)',
        logoBg: '#38BDF8',
        logoShadow: '0 4px 14px rgba(56,189,248,0.35)',
        activeNavBg: 'rgba(56,189,248,0.12)',
        activeBar: '#38BDF8',
        activeIcon: '#38BDF8',
        avatarBg: '#38BDF8',
        logoutHover: '#38BDF8',
        border: 'rgba(56,189,248,0.1)',
    },
    [Role.SUPER_ADMIN]: {
        bg: '#150d35',
        orb: 'rgba(139,92,246,0.12)',
        logoBg: '#8B5CF6',
        logoShadow: '0 4px 14px rgba(139,92,246,0.4)',
        activeNavBg: 'rgba(139,92,246,0.14)',
        activeBar: '#8B5CF6',
        activeIcon: '#A78BFA',
        avatarBg: '#8B5CF6',
        logoutHover: '#A78BFA',
        border: 'rgba(139,92,246,0.12)',
    },
}

const DEFAULT_THEME = THEMES[Role.ADMIN_PYME]

export default function Sidebar({ onClose, collapsed = false }: Props) {
    const { user, clearAuth } = useAuthStore()
    const navigate = useNavigate()
    const items = navByRole[user?.role ?? ''] ?? []
    const theme = THEMES[user?.role ?? ''] ?? DEFAULT_THEME

    const handleLogout = () => {
        clearAuth()
        navigate('/login')
    }

    const initials = user
        ? `${user.nombre?.[0] ?? ''}${user.apellido?.[0] ?? ''}`.toUpperCase()
        : '?'

    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            height: '100%',
            backgroundColor: theme.bg,
            position: 'relative', overflow: 'hidden',
            transition: 'background-color 0.3s ease',
        }}>
            {/* Orb decorativo */}
            <div style={{
                position: 'absolute', top: -40, left: -40,
                width: 180, height: 180, borderRadius: '50%',
                background: `radial-gradient(circle, ${theme.orb}, transparent 70%)`,
                filter: 'blur(30px)', pointerEvents: 'none',
            }} />

            {/* ── Logo ── */}
            <div style={{
                height: 64, display: 'flex', alignItems: 'center',
                justifyContent: 'center',
                padding: collapsed ? '0' : '0 16px',
                borderBottom: `1px solid ${theme.border}`,
                flexShrink: 0, position: 'relative', zIndex: 1,
            }}>
                {collapsed ? (
                    <div style={{
                        width: 34, height: 34, borderRadius: 10,
                        backgroundColor: theme.logoBg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: theme.logoShadow,
                        transition: 'background-color 0.3s, box-shadow 0.3s',
                    }}>
                        <Zap size={16} color="white" fill="white" />
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: 10,
                            backgroundColor: theme.logoBg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, boxShadow: theme.logoShadow,
                            transition: 'background-color 0.3s, box-shadow 0.3s',
                        }}>
                            <Zap size={16} color="white" fill="white" />
                        </div>
                        <span style={{
                            color: 'white', fontWeight: 800, fontSize: 17,
                            letterSpacing: '-0.02em', whiteSpace: 'nowrap',
                        }}>
                            LogiPyme
                        </span>
                        <button
                            onClick={onClose}
                            className="lg:hidden ml-auto"
                            style={{ color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}
            </div>

            {/* ── Nav ── */}
            <nav style={{
                flex: 1, padding: '10px 8px',
                overflowY: 'auto', overflowX: 'hidden',
                position: 'relative', zIndex: 1,
            }}>
                {items.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onClose}
                        end
                        style={{ textDecoration: 'none', display: 'block', marginBottom: 2 }}
                    >
                        {({ isActive }) => (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: collapsed ? 'center' : 'flex-start',
                                    gap: collapsed ? 0 : 12,
                                    padding: collapsed ? '11px 0' : '10px 12px',
                                    borderRadius: 12,
                                    cursor: 'pointer',
                                    position: 'relative',
                                    backgroundColor: isActive ? theme.activeNavBg : 'transparent',
                                    transition: 'background-color 0.15s',
                                }}
                                onMouseEnter={e => {
                                    if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                                }}
                                onMouseLeave={e => {
                                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                            >
                                {/* Barra izquierda activa */}
                                {isActive && !collapsed && (
                                    <span style={{
                                        position: 'absolute', left: 0, top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: 3, height: 20, borderRadius: 2,
                                        backgroundColor: theme.activeBar,
                                        transition: 'background-color 0.3s',
                                    }} />
                                )}

                                {/* Ícono */}
                                <span style={{
                                    color: isActive ? theme.activeIcon : 'rgba(255,255,255,0.38)',
                                    flexShrink: 0, display: 'flex', alignItems: 'center',
                                    transition: 'color 0.15s',
                                }}>
                                    {item.icon}
                                </span>

                                {/* Label */}
                                {!collapsed && (
                                    <span style={{
                                        color: isActive ? 'white' : 'rgba(255,255,255,0.55)',
                                        fontSize: 14,
                                        fontWeight: isActive ? 600 : 500,
                                        whiteSpace: 'nowrap',
                                        transition: 'color 0.15s',
                                    }}>
                                        {item.label}
                                    </span>
                                )}
                            </div>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* ── Footer usuario ── */}
            <div style={{
                padding: '10px 8px',
                borderTop: `1px solid ${theme.border}`,
                flexShrink: 0, position: 'relative', zIndex: 1,
            }}>
                {collapsed ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: 10,
                            backgroundColor: theme.avatarBg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: 11, fontWeight: 800,
                            transition: 'background-color 0.3s',
                        }}>
                            {initials}
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 12 }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: 10,
                            backgroundColor: theme.avatarBg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: 11, fontWeight: 800, flexShrink: 0,
                            transition: 'background-color 0.3s',
                        }}>
                            {initials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                                color: 'white', fontSize: 13, fontWeight: 600,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0,
                            }}>
                                {user?.nombre} {user?.apellido}
                            </p>
                            <p style={{
                                color: 'rgba(255,255,255,0.3)', fontSize: 11,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0,
                            }}>
                                {roleLabels[user?.role ?? ''] ?? user?.role}
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            style={{
                                color: 'rgba(255,255,255,0.25)', background: 'none',
                                border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0,
                                transition: 'color 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = theme.logoutHover)}
                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
                        >
                            <LogOut size={15} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}