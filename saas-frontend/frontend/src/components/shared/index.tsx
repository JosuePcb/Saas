import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

// ─── StatsCard ────────────────────────────────────────────────────────────────
interface StatsCardProps {
    label: string
    value: string | number
    icon: React.ReactNode
    iconBg?: string
    trend?: number        // positivo = verde, negativo = rojo, 0 = neutro
    trendLabel?: string
    loading?: boolean
}

export function StatsCard({ label, value, icon, iconBg = '#EC4899', trend, trendLabel, loading }: StatsCardProps) {
    const trendColor = trend === undefined ? '' : trend > 0 ? '#10B981' : trend < 0 ? '#EF4444' : '#9CA3AF'
    const TrendIcon = trend === undefined ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm animate-pulse">
                <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                        <div className="h-3 w-24 bg-gray-100 rounded-full" />
                        <div className="h-7 w-16 bg-gray-100 rounded-full" />
                        <div className="h-3 w-20 bg-gray-100 rounded-full" />
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-gray-100" />
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">{label}</p>
                    <p className="text-gray-900 text-2xl font-black mb-1.5">{value}</p>
                    {(trend !== undefined || trendLabel) && (
                        <div className="flex items-center gap-1">
                            {TrendIcon && <TrendIcon size={13} style={{ color: trendColor }} />}
                            <span className="text-xs font-medium" style={{ color: trendColor }}>
                                {trend !== undefined && `${trend > 0 ? '+' : ''}${trend}%`}
                                {trendLabel && ` ${trendLabel}`}
                            </span>
                        </div>
                    )}
                </div>
                <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: `${iconBg}18` }}
                >
                    <span style={{ color: iconBg }}>{icon}</span>
                </div>
            </div>
        </div>
    )
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────
const orderStatusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    // Order statuses (backend enums)
    CREATED: { label: 'Creada', color: '#3B82F6', bg: '#3B82F608', dot: '#3B82F6' },
    ASSIGNED: { label: 'Asignada', color: '#F59E0B', bg: '#F59E0B08', dot: '#F59E0B' },
    IN_TRANSIT: { label: 'En camino', color: '#EC4899', bg: '#EC489910', dot: '#EC4899' },
    DELIVERED: { label: 'Entregada', color: '#10B981', bg: '#10B98108', dot: '#10B981' },
    CANCELLED: { label: 'Cancelada', color: '#EF4444', bg: '#EF444408', dot: '#EF4444' },
    // Route statuses
    DRAFT: { label: 'Borrador', color: '#9CA3AF', bg: '#9CA3AF10', dot: '#9CA3AF' },
    IN_PROGRESS: { label: 'En curso', color: '#EC4899', bg: '#EC489910', dot: '#EC4899' },
    COMPLETED: { label: 'Completada', color: '#10B981', bg: '#10B98108', dot: '#10B981' },
    // Payment statuses
    PENDING_VALIDATION: { label: 'Pendiente', color: '#F59E0B', bg: '#F59E0B08', dot: '#F59E0B' },
    APPROVED: { label: 'Aprobado', color: '#10B981', bg: '#10B98108', dot: '#10B981' },
    REJECTED: { label: 'Rechazado', color: '#EF4444', bg: '#EF444408', dot: '#EF4444' },
    // Vehicle statuses
    DISPONIBLE: { label: 'Disponible', color: '#10B981', bg: '#10B98108', dot: '#10B981' },
    EN_RUTA: { label: 'En ruta', color: '#EC4899', bg: '#EC489910', dot: '#EC4899' },
    MANTENIMIENTO: { label: 'Mantenimiento', color: '#F59E0B', bg: '#F59E0B08', dot: '#F59E0B' },
    // Tenant statuses
    TRIAL: { label: 'Trial', color: '#3B82F6', bg: '#3B82F608', dot: '#3B82F6' },
    ACTIVE: { label: 'Activo', color: '#10B981', bg: '#10B98108', dot: '#10B981' },
    SUSPENDED: { label: 'Suspendido', color: '#F59E0B', bg: '#F59E0B08', dot: '#F59E0B' },
}

interface StatusBadgeProps {
    status: string
    size?: 'sm' | 'md'
    showDot?: boolean
}

export function StatusBadge({ status, size = 'md', showDot = true }: StatusBadgeProps) {
    const cfg = orderStatusConfig[status] ?? {
        label: status, color: '#9CA3AF', bg: '#9CA3AF10', dot: '#9CA3AF',
    }

    return (
        <span
            className={`inline-flex items-center gap-1.5 font-semibold rounded-full
        ${size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'}`}
            style={{ color: cfg.color, backgroundColor: cfg.bg }}
        >
            {showDot && (
                <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: cfg.dot }}
                />
            )}
            {cfg.label}
        </span>
    )
}

// ─── PageHeader ───────────────────────────────────────────────────────────────
interface PageHeaderProps {
    title: string
    subtitle?: string
    action?: React.ReactNode
    breadcrumb?: string
}

export function PageHeader({ title, subtitle, action, breadcrumb }: PageHeaderProps) {
    return (
        <div className="flex items-start justify-between mb-6 gap-4">
            <div>
                {breadcrumb && (
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
                        {breadcrumb}
                    </p>
                )}
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">{title}</h1>
                {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    )
}

// ─── PrimaryButton ────────────────────────────────────────────────────────────
interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: React.ReactNode
    loading?: boolean
    variant?: 'solid' | 'outline' | 'ghost'
}

export function PrimaryButton({
    children, icon, loading, variant = 'solid', className = '', ...props
}: PrimaryButtonProps) {
    const base = 'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
        solid: 'text-white shadow-lg shadow-[#EC4899]/20 hover:shadow-[#EC4899]/30',
        outline: 'border-2 border-[#EC4899] text-[#EC4899] hover:bg-[#EC4899]/5',
        ghost: 'text-gray-500 hover:bg-gray-100 hover:text-gray-800',
    }

    return (
        <button
            {...props}
            className={`${base} ${variants[variant]} ${className}`}
            style={variant === 'solid' ? { background: 'linear-gradient(135deg,#EC4899,#D8B4FE)' } : {}}
        >
            {loading ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
            ) : icon}
            {children}
        </button>
    )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
interface EmptyStateProps {
    icon: React.ReactNode
    title: string
    description?: string
    action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
                {icon}
            </div>
            <p className="text-gray-700 font-semibold text-base mb-1">{title}</p>
            {description && <p className="text-gray-400 text-sm max-w-xs mb-5">{description}</p>}
            {action}
        </div>
    )
}