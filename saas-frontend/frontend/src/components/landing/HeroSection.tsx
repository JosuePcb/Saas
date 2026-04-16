import { Link } from 'react-router-dom'

export default function HeroSection() {
    return (
        <section
            className="w-full min-h-[calc(100svh-64px)] flex flex-col items-center justify-center px-4 sm:px-5 pt-12 sm:pt-16 pb-12 sm:pb-24 overflow-hidden relative"
            style={{ backgroundColor: '#2a1020' }}
        >
            {/* Orb decorativo centro */}
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-30 blur-3xl pointer-events-none"
                style={{ background: 'radial-gradient(ellipse, #EC4899 0%, transparent 70%)' }}
            />
            <div
                className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-10 blur-3xl pointer-events-none"
                style={{ background: 'radial-gradient(ellipse, #D8B4FE 0%, transparent 70%)' }}
            />

            <div className="max-w-3xl w-full mx-auto text-center relative z-10">

                {/* Headline */}
                <h1
                    className="font-black leading-[1.05] tracking-tight mb-5 text-white"
                    style={{ animation: 'fadeUp 0.6s ease 0.1s both', fontSize: 'clamp(2.1rem, 6vw, 4.5rem)' }}
                >
                    Gestiona tu flota,
                    <br />entregas y rutas
                    <br />
                    <span
                        className="text-transparent bg-clip-text"
                        style={{ backgroundImage: 'linear-gradient(135deg, #EC4899 30%, #D8B4FE 100%)' }}
                    >
                        en un solo lugar
                    </span>
                </h1>

                {/* Sub */}
                <p
                    className="text-sm sm:text-base lg:text-lg max-w-xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2"
                    style={{ color: 'rgba(255,255,255,0.55)', animation: 'fadeUp 0.6s ease 0.2s both' }}
                >
                    La herramienta que necesitan las PYMES venezolanas para manejar
                    sus repartidores, órdenes y rutas desde un solo lugar.
                </p>

                {/* CTA */}
                <div style={{ animation: 'fadeUp 0.6s ease 0.3s both' }} className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        to="/register"
                        className="w-full sm:w-auto inline-flex items-center justify-center px-8 sm:px-12 py-4 sm:py-5 text-white font-black text-lg sm:text-xl rounded-2xl transition-all hover:-translate-y-1 active:scale-95"
                        style={{
                            background: 'linear-gradient(135deg, #EC4899, #D8B4FE)',
                            boxShadow: '0 16px 50px rgba(236,72,153,0.4)',
                            color: '#ffffff'
                        }}
                    >
                        Comenzar ya →
                    </Link>
                    <Link
                        to="/login"
                        className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-white/60 hover:text-white font-semibold text-base sm:text-lg rounded-2xl border border-white/15 hover:border-white/30 transition-all"
                    >
                        Iniciar sesión
                    </Link>
                </div>
            </div>

            {/* Dashboard screenshot real */}
            <div
                className="w-full max-w-5xl mx-auto mt-14 relative z-10 px-2 sm:px-0"
                style={{ animation: 'fadeUp 0.7s ease 0.4s both' }}
            >
                {/* Browser chrome */}
                <div
                    className="rounded-2xl overflow-hidden"
                    style={{
                        border: '1px solid rgba(236,72,153,0.2)',
                        boxShadow: '0 -8px 60px rgba(236,72,153,0.15), 0 0 0 1px rgba(236,72,153,0.08)',
                    }}
                >
                    {/* Window bar */}
                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10"
                        style={{ backgroundColor: '#120810' }}>
                        <div className="w-2.5 h-2.5 rounded-full bg-[#EC4899]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#D8B4FE]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                        <div className="flex-1 mx-4 h-5 rounded-md bg-white/5 hidden sm:block" />
                    </div>
                    {/* Screenshot */}
                    <img
                        src="/screenshots/dashboard.png"
                        alt="Dashboard de LogiPyme"
                        className="w-full block"
                        style={{ display: 'block', maxHeight: 'clamp(200px, 40vw, 520px)', objectFit: 'cover', objectPosition: 'top' }}
                    />
                </div>
            </div>

            <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
        </section>
    )
}