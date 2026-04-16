import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { useAuthStore } from '@/store/authStore'
import { Role } from '@/types/enums'

const COLLAPSED_W = 68
const EXPANDED_W = 256

// Rutas que tienen fondo claro propio
const LIGHT_BG_ROUTES: string[] = []

export default function AppShell() {
    const [mobileOpen, setMobileOpen] = useState(false)
    const [hovered, setHovered] = useState(false)
    const location = useLocation()
    const { user } = useAuthStore()

    const isLightRoute = LIGHT_BG_ROUTES.some(r => location.pathname.startsWith(r))

    // Determinar rol activo: primero por ruta (por si hay impersonación futura),
    // luego por rol del usuario logueado
    const isSuperAdmin =
        location.pathname.startsWith('/app/superadmin') ||
        user?.role === Role.SUPER_ADMIN

    const isChofer =
        location.pathname.startsWith('/app/driver') ||
        user?.role === Role.CHOFER

    // Colores de fondo por rol
    const mainBg = isLightRoute
        ? 'linear-gradient(135deg, #ede5ff 0%, #f0e8ff 50%, #fce7f3 100%)'
        : isSuperAdmin ? '#120a2e'
            : isChofer ? '#071828'
                : '#1f0d18'

    // Colores de sidebar por rol
    const sidebarBg = isSuperAdmin ? '#150d35'
        : isChofer ? '#091d30'
            : '#1a0a14'

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                display: 'flex',
                overflow: 'hidden',
                background: mainBg,
                transition: 'background 0.3s ease',
            }}
        >
            {/* ── Overlay mobile ── */}
            {mobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 20,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                    }}
                    className="lg:hidden"
                />
            )}

            {/* ── Sidebar desktop (empuja el contenido) ── */}
            <aside
                className="hidden lg:flex flex-col shrink-0"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    width: hovered ? EXPANDED_W : COLLAPSED_W,
                    transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
                    backgroundColor: sidebarBg,
                    overflow: 'hidden',
                    zIndex: 30,
                    flexShrink: 0,
                }}
            >
                <Sidebar collapsed={!hovered} onClose={() => { }} />
            </aside>

            {/* ── Sidebar mobile (overlay) ── */}
            <aside
                className="lg:hidden"
                style={{
                    position: 'fixed',
                    inset: '0 auto 0 0',
                    width: EXPANDED_W,
                    backgroundColor: sidebarBg,
                    transform: mobileOpen ? 'translateX(0)' : `translateX(-${EXPANDED_W}px)`,
                    transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
                    zIndex: 30,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Sidebar collapsed={false} onClose={() => setMobileOpen(false)} />
            </aside>

            {/* ── Contenido principal ── */}
            <div
                style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                <TopBar onMenuClick={() => setMobileOpen(true)} />
                <main
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '1.5rem 2rem',
                        background: mainBg,
                        transition: 'background 0.3s ease',
                    }}
                >
                    <Outlet />
                </main>
            </div>
        </div>
    )
}