import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Menu, X } from 'lucide-react'

export default function Navbar() {
    const [open, setOpen] = useState(false)

    const scrollTo = (id: string) => {
        setOpen(false)
        setTimeout(() => {
            const el = document.getElementById(id)
            if (el) el.scrollIntoView({ behavior: 'smooth' })
        }, 100)
    }

    return (
        <nav className="w-full z-50" style={{ backgroundColor: '#1a0a14' }}>
            {/* Barra principal */}
            <div className="w-full mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-[#EC4899] flex items-center justify-center shadow-lg shadow-[#EC4899]/40">
                        <Zap size={16} className="text-white" fill="white" />
                    </div>
                    <span className="text-white font-bold text-lg tracking-tight">LogiPyme</span>
                </Link>

                {/* Links — solo desktop */}
                <div className="hidden md:flex items-center gap-8 flex-1 justify-center">
                    {[
                        { label: 'Home', fn: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
                        { label: 'Funcionalidades', fn: () => scrollTo('funcionalidades') },
                        { label: 'Precios', fn: () => scrollTo('precios') },
                    ].map((it) => (
                        <button key={it.label} onClick={it.fn}
                            className="text-white/70 hover:text-white text-sm font-medium transition-colors">
                            {it.label}
                        </button>
                    ))}
                </div>

                {/* CTAs — solo desktop */}
                <div className="hidden md:flex items-center gap-3 shrink-0">
                    <Link to="/login"
                        className="text-white text-sm font-medium px-4 py-2 rounded-lg border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all">
                        Iniciar sesión
                    </Link>
                    <Link to="/register"
                        className="text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-all opacity-90
                                   bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-500 hover:opacity-100 shadow-sm"
                        style={{ color: '#ffffff' }}>
                        Comenzar ahora
                    </Link>
                </div>

                {/* Hamburger — solo mobile */}
                <button className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                    onClick={() => setOpen(!open)}>
                    {open ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>

            {/* Menú mobile desplegable */}
            {open && (
                <div className="md:hidden border-t border-white/10 px-5 py-4 space-y-1"
                    style={{ backgroundColor: '#1a0a14' }}>
                    {[
                        { label: 'Home', fn: () => { window.scrollTo({ top: 0, behavior: 'smooth' }); setOpen(false) } },
                        { label: 'Funcionalidades', fn: () => scrollTo('funcionalidades') },
                        { label: 'Precios', fn: () => scrollTo('precios') },
                    ].map((it) => (
                        <button key={it.label} onClick={it.fn}
                            className="w-full text-left text-white/70 hover:text-white text-sm font-medium py-3 px-3 rounded-lg hover:bg-white/5 transition-all">
                            {it.label}
                        </button>
                    ))}
                    <div className="pt-3 space-y-2.5 border-t border-white/10">
                        <Link to="/login" onClick={() => setOpen(false)}
                            className="block w-full text-center text-white text-sm font-semibold py-3 rounded-xl border border-white/20">
                            Iniciar sesión
                        </Link>
                        <Link to="/register" onClick={() => setOpen(false)}
                            className="block w-full text-center text-white text-sm font-bold py-3 rounded-xl"
                            style={{ background: 'linear-gradient(135deg,#EC4899,#DB2777)', color: '#ffffff' }}>
                            Comenzar gratis
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    )
}