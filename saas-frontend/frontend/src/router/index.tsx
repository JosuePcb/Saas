import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Role } from '@/types/enums'

// Layout
import AppShell from '@/components/layout/AppShell'

// Páginas públicas
import LandingPage from '@/features/auth/pages/LandingPage'
import LoginPage from '@/features/auth/pages/LoginPage'
import RegisterPage from '@/features/auth/pages/RegisterPage'
import TrackingPage from '@/features/tracking/pages/TrackingPage'
import SupportPage from '@/features/tracking/pages/SupportPage'

// Páginas privadas
import DashboardPage from '@/features/dashboard/pages/DashboardPage'
import SettingsPage from '@/features/settings/pages/SettingsPage'
import OrdersListPage from '@/features/orders/pages/OrdersListPage'
import OrderDetailPage from '@/features/orders/pages/OrderDetailPage'
import NewOrderPage from '@/features/orders/pages/NewOrderPage'
import FleetPage from '@/features/fleet/pages/FleetPage'
import UsersPage from '@/features/users/pages/UsersPage'
import RoutesListPage from '@/features/routes/pages/RoutesListPage'
import NewRoutePage from '@/features/routes/pages/NewRoutePage'
import RouteDetailPage from '@/features/routes/pages/RouteDetailPage'
import BillingPage from '@/features/billing/pages/BillingPage'
import AdminDashboard from '@/features/superadmin/pages/AdminDashboard'
import PaymentQueuePage from '@/features/superadmin/pages/PaymentQueuePage'
import TenantsPage from '@/features/superadmin/pages/TenantsPage'
import DriverHomePage from '@/features/driver/pages/DriverHomePage'
import StopDetailPage from '@/features/driver/pages/StopDetailPage'
import DriversStopsPage from '@/features/driver/pages/DriversStopsPage'

function ComingSoon({ page }: { page: string }) {
    return (
        <div className="flex items-center justify-center h-64">
            <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#EC4899]/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🚧</span>
                </div>
                <p className="text-white/80 font-semibold text-lg">{page}</p>
                <p className="text-white/40 text-sm mt-1">Página en desarrollo</p>
            </div>
        </div>
    )
}

function ProtectedRoute({ children, roles }: { children: React.ReactElement; roles: Role[] }) {
    const { user } = useAuthStore()
    if (!user) return <Navigate to="/login" replace />
    if (!roles.includes(user.role)) return <Navigate to="/unauthorized" replace />
    return children
}

const ADMIN_ROLES = [Role.ADMIN_PYME, Role.DESPACHADOR]
const SUPER_ROLES = [Role.SUPER_ADMIN]
const DRIVER_ROLES = [Role.CHOFER]
const ALL_ROLES = [...ADMIN_ROLES, ...SUPER_ROLES, ...DRIVER_ROLES]

export default function AppRouter() {
    const { user } = useAuthStore()

    return (
        <Routes>
            {/* Públicas */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/tracking/:orderId" element={<TrackingPage />} />
            <Route path="/soporte" element={<SupportPage />} />

            {/* Privadas — AppShell */}
            <Route path="/app" element={<ProtectedRoute roles={ALL_ROLES}><AppShell /></ProtectedRoute>}>

                <Route index element={
                    user?.role === Role.CHOFER ? <Navigate to="/app/driver" replace />
                        : user?.role === Role.SUPER_ADMIN ? <Navigate to="/app/superadmin" replace />
                            : <Navigate to="/app/dashboard" replace />
                } />

                {/* Admin / Despachador */}
                <Route path="dashboard" element={<ProtectedRoute roles={ADMIN_ROLES}><DashboardPage /></ProtectedRoute>} />
                <Route path="orders" element={<ProtectedRoute roles={ADMIN_ROLES}><OrdersListPage /></ProtectedRoute>} />
                <Route path="orders/new" element={<ProtectedRoute roles={ADMIN_ROLES}><NewOrderPage /></ProtectedRoute>} />
                <Route path="orders/:id" element={<ProtectedRoute roles={ADMIN_ROLES}><OrderDetailPage /></ProtectedRoute>} />
                <Route path="routes" element={<ProtectedRoute roles={ADMIN_ROLES}><RoutesListPage /></ProtectedRoute>} />
                <Route path="routes/new" element={<ProtectedRoute roles={ADMIN_ROLES}><NewRoutePage /></ProtectedRoute>} />
                <Route path="routes/:id" element={<ProtectedRoute roles={ADMIN_ROLES}><RouteDetailPage /></ProtectedRoute>} />
                <Route path="fleet" element={<ProtectedRoute roles={ADMIN_ROLES}><FleetPage /></ProtectedRoute>} />
                <Route path="users" element={<ProtectedRoute roles={[Role.ADMIN_PYME]}><UsersPage /></ProtectedRoute>} />
                <Route path="billing" element={<ProtectedRoute roles={[Role.ADMIN_PYME]}><BillingPage /></ProtectedRoute>} />

                {/* Settings — todos los roles */}
                <Route path="settings" element={<ProtectedRoute roles={ALL_ROLES}><SettingsPage /></ProtectedRoute>} />

                {/* Chofer */}
                <Route path="driver" element={<ProtectedRoute roles={DRIVER_ROLES}><DriverHomePage /></ProtectedRoute>} />
                <Route path="driver/stops" element={<ProtectedRoute roles={DRIVER_ROLES}><DriversStopsPage /></ProtectedRoute>} />
                <Route path="driver/stop/:id" element={<ProtectedRoute roles={DRIVER_ROLES}><StopDetailPage /></ProtectedRoute>} />

                {/* Super Admin */}
                <Route path="superadmin" element={<ProtectedRoute roles={SUPER_ROLES}><AdminDashboard /></ProtectedRoute>} />
                <Route path="superadmin/payments" element={<ProtectedRoute roles={SUPER_ROLES}><PaymentQueuePage /></ProtectedRoute>} />
                <Route path="superadmin/tenants" element={<ProtectedRoute roles={SUPER_ROLES}><TenantsPage /></ProtectedRoute>} />
            </Route>

            {/* Aliases */}
            <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/driver" element={<Navigate to="/app/driver" replace />} />
            <Route path="/superadmin" element={<Navigate to="/app/superadmin" replace />} />

            {/* 403 */}
            <Route path="/unauthorized" element={
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1f0d18' }}>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 72, fontWeight: 900, color: '#EC4899', margin: 0 }}>403</p>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, margin: '8px 0' }}>Sin acceso</p>
                        <button onClick={() => window.history.back()}
                            style={{ padding: '8px 20px', backgroundColor: '#EC4899', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                            Volver
                        </button>
                    </div>
                </div>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}