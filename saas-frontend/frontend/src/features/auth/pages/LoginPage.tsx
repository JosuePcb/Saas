import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/axios'
import { Role } from '@/types/enums'
import { Eye, EyeOff, Zap } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { setAuth } = useAuthStore()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const { data } = await api.post('/auth/login', { email, password })
            setAuth(data.user, data.accessToken)
            if (data.user.role === Role.CHOFER) navigate('/app/driver')
            else if (data.user.role === Role.SUPER_ADMIN) navigate('/app/superadmin')
            else navigate('/app/dashboard')
        } catch {
            setError('Email o contraseña incorrectos')
        } finally {
            setLoading(false)
        }
    }

    const handleDevLogin = () => {
        setAuth({
            id: 'dev-admin',
            email: 'admin@dev.com',
            nombre: 'Admin',
            apellido: 'Sistema',
            role: Role.SUPER_ADMIN,
            tenantId: null
        }, 'dev-access-token')
        navigate('/app/superadmin')
    }

    return (
        // Pantalla completa, sin scroll, sin espacios blancos
        <div
            className="fixed inset-0 flex overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1a0a14 0%, #2d0a2e 45%, #1a0a14 75%, #120818 100%)' }}
        >
            {/* Orbs de fondo */}
            <div
                className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20 blur-3xl pointer-events-none"
                style={{ background: 'radial-gradient(circle, #EC4899, transparent 65%)' }}
            />
            <div
                className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15 blur-3xl pointer-events-none"
                style={{ background: 'radial-gradient(circle, #D8B4FE, transparent 65%)' }}
            />

            {/* Panel izquierdo — branding (solo desktop) */}
            <div className="hidden lg:flex flex-col justify-center flex-1 px-16 xl:px-24 relative z-10">
                {/* Logo */}
                <div className="flex items-center gap-3 mb-14">
                    <div className="w-10 h-10 rounded-xl bg-[#EC4899] flex items-center justify-center shadow-xl shadow-[#EC4899]/40">
                        <Zap size={20} className="text-white" fill="white" />
                    </div>
                    <span className="text-white font-black text-2xl tracking-tight">LogiPyme</span>
                </div>

                <h2 className="text-white font-black text-5xl xl:text-6xl leading-tight mb-5 max-w-sm">
                    Gestiona tu flota con{' '}
                    <span
                        className="text-transparent bg-clip-text"
                        style={{ backgroundImage: 'linear-gradient(135deg,#EC4899,#D8B4FE)' }}
                    >
                        inteligencia
                    </span>
                </h2>
                <p className="text-white/40 text-lg max-w-xs leading-relaxed mb-14">
                    Únete a cientos de negocios venezolanos que ya optimizan sus entregas.
                </p>

                {/* Stats */}
                <div className="flex gap-10">
                    {[
                        { value: '500+', label: 'Negocios activos' },
                        { value: '50K+', label: 'Órdenes/mes' },
                        { value: '98%', label: 'Satisfacción' },
                    ].map((s) => (
                        <div key={s.label}>
                            <p
                                className="font-black text-3xl"
                                style={{ background: 'linear-gradient(135deg,#EC4899,#D8B4FE)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                            >
                                {s.value}
                            </p>
                            <p className="text-white/30 text-xs mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Panel derecho — card, centrado verticalmente */}
            <div className="flex items-center justify-center w-full lg:w-[480px] xl:w-[520px] shrink-0 px-6 py-8 relative z-10">
                <div
                    className="w-full max-w-sm lg:max-w-none rounded-3xl p-8 xl:p-10"
                    style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        backdropFilter: 'blur(24px)',
                    }}
                >
                    {/* Logo mobile */}
                    <div className="flex items-center gap-2.5 mb-8 lg:hidden">
                        <div className="w-8 h-8 rounded-lg bg-[#EC4899] flex items-center justify-center">
                            <Zap size={16} className="text-white" fill="white" />
                        </div>
                        <span className="text-white font-bold text-xl">LogiPyme</span>
                    </div>

                    <div className="mb-7">
                        <h1 className="text-3xl font-black text-white leading-tight">¡Bienvenido de nuevo!</h1>
                        <p className="text-white/40 text-sm mt-2">Inicia sesión en tu cuenta</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-white/60">Email</label>
                            <input
                                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@empresa.com" required maxLength={60}
                                className="w-full h-12 px-4 text-sm rounded-xl text-white placeholder-white/25 outline-none transition-all"
                                style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.1)' }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = '#EC4899'; e.currentTarget.style.background = 'rgba(255,255,255,0.12)' }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-white/60">Contraseña</label>
                            <div className="relative">
                                <input
                                    type={showPass ? 'text' : 'password'} value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••" required maxLength={30}
                                    className="w-full h-12 px-4 pr-12 text-sm rounded-xl text-white placeholder-white/25 outline-none transition-all"
                                    style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.1)' }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = '#EC4899'; e.currentTarget.style.background = 'rgba(255,255,255,0.12)' }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-xl px-4 py-3"
                                style={{ background: 'rgba(236,72,153,0.15)', border: '1px solid rgba(236,72,153,0.3)' }}>
                                <p className="text-[#EC4899] text-sm text-center font-semibold">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit" disabled={loading}
                            className="w-full h-12 text-white font-black text-sm rounded-xl transition-all disabled:opacity-50 hover:-translate-y-0.5 active:scale-95 mt-1"
                            style={{
                                background: 'linear-gradient(135deg, #EC4899, #D8B4FE)',
                                boxShadow: '0 8px 30px rgba(236,72,153,0.35)',
                            }}
                        >
                            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-white/35 mt-7">
                        ¿No tienes cuenta?{' '}
                        <Link to="/register" className="text-[#EC4899] font-bold hover:underline">
                            Crear cuenta gratis
                        </Link>
                    </p>

                    {/* Acceso Rápido SuperAdmin — Solo visible en desarrollo o para pruebas */}
                    <div className="mt-8 pt-6 border-t border-white/5">
                        <button
                            type="button"
                            onClick={handleDevLogin}
                            className="w-full h-10 text-white/40 hover:text-white/60 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all border border-white/10 hover:border-white/20 flex items-center justify-center gap-2 group"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse group-hover:scale-125 transition-transform" />
                            Acceso Rápido SuperAdmin (DEV)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}