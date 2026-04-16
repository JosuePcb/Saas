import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'

export function CtaSection() {
    return (
        <section className="w-full py-20 sm:py-28 px-5 sm:px-8 relative overflow-hidden" style={{ backgroundColor: '#1a0a14' }}>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[500px] h-[250px] rounded-full opacity-15 blur-3xl"
                    style={{ background: 'radial-gradient(ellipse, #EC4899, transparent 70%)' }} />
            </div>
            <div className="w-full mx-auto text-center relative z-10">
                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
                    Empieza hoy gratis.
                </h2>
                <p className="text-[#D8B4FE] text-base sm:text-xl mb-10">
                    7 días sin tarjeta. Sin contratos. Sin complicaciones.
                </p>
                <Link to="/register"
                    className="inline-block px-8 sm:px-12 py-4 sm:py-5 font-black text-sm sm:text-xl rounded-2xl transition-all hover:-translate-y-1 active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #EC4899, #DB2777)', boxShadow: '0 20px 60px rgba(236,72,153,0.4)', color: 'white' }}>
                    Comenzar ya →
                </Link>
            </div>
        </section>
    )
}

export function Footer() {
    return (
        <footer className="w-full border-t py-12 px-5 sm:px-8" style={{ backgroundColor: '#1a0a14', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="w-full mx-auto">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
                    <div className="col-span-2">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-[#EC4899] flex items-center justify-center shadow-lg shadow-[#EC4899]/30">
                                <Zap size={16} className="text-white" fill="white" />
                            </div>
                            <span className="text-white font-bold text-xl">LogiPyme</span>
                        </div>
                        <p className="text-white/35 text-sm leading-relaxed max-w-xs">
                            La plataforma de micro-logística para PYMES venezolanas.
                        </p>
                    </div>
                    {[
                        { title: 'PRODUCTO', links: ['Funcionalidades', 'Precios', 'Seguridad', 'Changelog'] },
                        { title: 'LEGAL', links: ['Términos de uso', 'Privacidad', 'Cookies', 'Contacto'] },
                    ].map((col) => (
                        <div key={col.title}>
                            <p className="text-white/50 text-[10px] font-black tracking-widest mb-4">{col.title}</p>
                            <ul className="space-y-2.5">
                                {col.links.map((l) => (
                                    <li key={l}><a href="#" className="text-white/35 hover:text-white text-sm transition-colors">{l}</a></li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
                    style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <p className="text-white/25 text-xs">© 2026 LogiPyme. Todos los derechos reservados.</p>
                    <p className="text-white/20 text-xs">Hecho con ❤️ para Venezuela</p>
                </div>
            </div>
        </footer>
    )
}