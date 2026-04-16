import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Zap, Check } from 'lucide-react'

const planLabels: Record<string, { label: string; color: string }> = {
    starter: { label: 'Plan Starter — $15/mes', color: '#EC4899' },
    growth: { label: 'Plan Growth — $35/mes', color: '#D8B4FE' },
    pro: { label: 'Plan Pro — $75/mes', color: '#9333EA' },
}

export default function RegisterPage() {
    const [searchParams] = useSearchParams()
    const planParam = searchParams.get('plan') ?? ''
    const navigate = useNavigate()

    const [form, setForm] = useState({ negocio: '', email: '', telefono: '', password: '', confirm: '' })
    const [showPass, setShowPass] = useState(false)
    const [showConf, setShowConf] = useState(false)
    const [loading, setLoading] = useState(false)

    const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [k]: e.target.value }))

    const passMin8 = form.password.length >= 8
    const passMatch = form.password === form.confirm && form.confirm.length > 0

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!passMin8 || !passMatch) return
        setLoading(true)
        await new Promise((r) => setTimeout(r, 1000))
        setLoading(false)
        navigate('/login')
    }

    const plan = planLabels[planParam]

    const inputStyle = { background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.1)' }
    const focusHandler = (e: React.FocusEvent<HTMLInputElement>) => {
        e.currentTarget.style.borderColor = '#EC4899'
        e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
    }
    const blurHandler = (e: React.FocusEvent<HTMLInputElement>) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
        e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
    }

    return (
        // fixed inset-0 = pantalla completa sin espacios
        <div
            className="fixed inset-0 flex overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1a0a14 0%, #2d0a2e 45%, #1a0a14 75%, #120818 100%)' }}
        >
            {/* Orbs */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20 blur-3xl pointer-events-none"
                style={{ background: 'radial-gradient(circle, #EC4899, transparent 65%)' }} />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15 blur-3xl pointer-events-none"
                style={{ background: 'radial-gradient(circle, #D8B4FE, transparent 65%)' }} />

            {/* Branding izquierda (solo desktop) */}
            <div className="hidden lg:flex flex-col justify-center flex-1 px-16 xl:px-24 relative z-10">
                <div className="flex items-center gap-3 mb-14">
                    <div className="w-10 h-10 rounded-xl bg-[#EC4899] flex items-center justify-center shadow-xl shadow-[#EC4899]/40">
                        <Zap size={20} className="text-white" fill="white" />
                    </div>
                    <span className="text-white font-black text-2xl tracking-tight">LogiPyme</span>
                </div>

                <h2 className="text-white font-black text-5xl xl:text-6xl leading-tight mb-5 max-w-sm">
                    Empieza hoy,{' '}
                    <span className="text-transparent bg-clip-text"
                        style={{ backgroundImage: 'linear-gradient(135deg,#EC4899,#D8B4FE)' }}>
                        gratis
                    </span>
                </h2>
                <p className="text-white/40 text-lg max-w-xs leading-relaxed mb-12">
                    7 días de prueba sin tarjeta de crédito. Sin contratos ni permanencia.
                </p>

                <div className="space-y-4">
                    {['7 días gratis, sin tarjeta', 'Sin contratos ni permanencia', 'Cancela cuando quieras', 'Soporte en español'].map((t) => (
                        <div key={t} className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                                style={{ background: 'rgba(236,72,153,0.2)' }}>
                                <Check size={12} className="text-[#EC4899]" strokeWidth={3} />
                            </div>
                            <span className="text-white/50 text-sm">{t}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Card derecha — scroll interno si el contenido es largo */}
            <div className="flex items-center justify-center w-full lg:w-[500px] xl:w-[540px] shrink-0 px-5 py-6 relative z-10 overflow-y-auto">
                <div
                    className="w-full max-w-sm lg:max-w-none rounded-3xl p-7 xl:p-9 my-auto"
                    style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        backdropFilter: 'blur(24px)',
                    }}
                >
                    {/* Logo mobile */}
                    <div className="flex items-center gap-2.5 mb-6 lg:hidden">
                        <div className="w-8 h-8 rounded-lg bg-[#EC4899] flex items-center justify-center">
                            <Zap size={16} className="text-white" fill="white" />
                        </div>
                        <span className="text-white font-bold text-xl">LogiPyme</span>
                    </div>

                    {/* Plan badge */}
                    {plan && (
                        <div className="mb-5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border"
                                style={{ color: plan.color, borderColor: `${plan.color}40`, background: `${plan.color}15` }}>
                                <Check size={11} strokeWidth={3} /> {plan.label}
                            </span>
                        </div>
                    )}

                    <div className="mb-6">
                        <h1 className="text-2xl xl:text-3xl font-black text-white leading-tight">¡Bienvenido!</h1>
                        <p className="text-white/40 text-sm mt-1.5">Crea tu cuenta gratis</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3.5">
                        {/* Nombre negocio */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-white/55 uppercase tracking-wide">Nombre del negocio</label>
                            <div className="flex rounded-xl overflow-hidden transition-all"
                                style={inputStyle}>
                                <input type="text" value={form.negocio} onChange={set('negocio')}
                                    placeholder="Mi Negocio" required maxLength={50}
                                    className="flex-1 h-11 px-4 text-sm text-white placeholder-white/25 outline-none bg-transparent"
                                    onFocus={(e) => { (e.currentTarget.parentElement as HTMLElement).style.borderColor = '#EC4899' }}
                                    onBlur={(e) => { (e.currentTarget.parentElement as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)' }}
                                />
                                <div className="flex items-center px-3 border-l" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                                    <span className="text-white/25 text-xs whitespace-nowrap">.logipyme.app</span>
                                </div>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-white/55 uppercase tracking-wide">Email</label>
                            <input type="email" value={form.email} onChange={set('email')}
                                placeholder="tu@negocio.com" required maxLength={60}
                                className="w-full h-11 px-4 text-sm rounded-xl text-white placeholder-white/25 outline-none transition-all"
                                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
                        </div>

                        {/* Teléfono */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-white/55 uppercase tracking-wide">Teléfono</label>
                            <div className="flex gap-2">
                                <div className="flex items-center gap-2 px-3 h-11 rounded-xl shrink-0"
                                    style={inputStyle}>
                                    <span>🇻🇪</span>
                                    <span className="text-white/60 text-sm font-semibold">+58</span>
                                </div>
                                <input type="tel" value={form.telefono}
                                    onChange={(e) => setForm(f => ({ ...f, telefono: e.target.value.replace(/\D/g, '') }))}
                                    placeholder="412 000 0000" required maxLength={11}
                                    className="flex-1 h-11 px-4 text-sm rounded-xl text-white placeholder-white/25 outline-none transition-all"
                                    style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
                            </div>
                        </div>

                        {/* Contraseña */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-white/55 uppercase tracking-wide">Contraseña</label>
                            <div className="relative">
                                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')}
                                    placeholder="Mínimo 8 caracteres" required maxLength={30}
                                    className="w-full h-11 px-4 pr-12 text-sm rounded-xl text-white placeholder-white/25 outline-none transition-all"
                                    style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirmar */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-white/55 uppercase tracking-wide">Confirmar contraseña</label>
                            <div className="relative">
                                <input type={showConf ? 'text' : 'password'} value={form.confirm} onChange={set('confirm')}
                                    placeholder="Repite tu contraseña" required maxLength={30}
                                    className="w-full h-11 px-4 pr-12 text-sm rounded-xl text-white placeholder-white/25 outline-none transition-all"
                                    style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
                                <button type="button" onClick={() => setShowConf(!showConf)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                                    {showConf ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Validaciones */}
                        {(form.password.length > 0 || form.confirm.length > 0) && (
                            <div className="rounded-xl px-4 py-3 space-y-2"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                {[
                                    { ok: passMin8, text: 'Al menos 8 caracteres' },
                                    { ok: passMatch, text: 'Las contraseñas coinciden' },
                                ].map((v) => (
                                    <div key={v.text} className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${v.ok ? 'bg-[#10B981]' : 'bg-white/10'}`}>
                                            {v.ok && <Check size={9} className="text-white" strokeWidth={3} />}
                                        </div>
                                        <span className={`text-xs transition-colors ${v.ok ? 'text-[#10B981]' : 'text-white/30'}`}>{v.text}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button type="submit" disabled={loading || !passMin8 || !passMatch}
                            className="w-full h-11 text-white font-black text-sm rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 active:scale-95 !mt-5"
                            style={{
                                background: 'linear-gradient(135deg, #EC4899, #D8B4FE)',
                                boxShadow: '0 8px 28px rgba(236,72,153,0.35)',
                            }}>
                            {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
                        </button>

                        <p className="text-center text-xs text-white/25 !mt-2">7 días gratis, sin tarjeta de crédito</p>
                    </form>

                    <p className="text-center text-sm text-white/35 mt-5">
                        ¿Ya tienes cuenta?{' '}
                        <Link to="/login" className="text-[#EC4899] font-bold hover:underline">Iniciar sesión</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}