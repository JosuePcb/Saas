import { useState } from 'react'
import { Package, Map, BarChart3 } from 'lucide-react'

const features = [
    {
        id: 'ordenes', icon: <Package size={18} />, label: 'Órdenes',
        badge: 'ÓRDENES', badgeColor: '#EC4899',
        headline: 'Crea, asigna y rastrea cada orden al instante',
        description: 'Registra pedidos en segundos, asígnalos a tus choferes y sigue el estado en tiempo real. Sin papeles, sin llamadas.',
        bullets: ['Estados automáticos: pendiente, en camino, entregado', 'Historial completo con fotos de entrega', 'Notificaciones al cliente'],
        mock: (
            <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ border: '1px solid rgba(236,72,153,0.15)' }}>
                <img
                    src="/screenshots/ordenes.png"
                    alt="Vista de órdenes en LogiPyme"
                    className="w-full block"
                    style={{ display: 'block', maxHeight: '340px', objectFit: 'cover', objectPosition: 'top' }}
                />
            </div>
        ),
    },
    {
        id: 'rutas', icon: <Map size={18} />, label: 'Rutas',
        badge: 'RUTAS', badgeColor: '#D8B4FE',
        headline: 'Rutas optimizadas con mapas en tiempo real',
        description: 'Planifica las rutas del día, visualiza a tus choferes en el mapa y optimiza cada parada para ahorrar tiempo y combustible.',
        bullets: ['Mapa interactivo con OpenStreetMap', 'Reordenamiento de paradas drag & drop', 'Seguimiento GPS en tiempo real'],
        mock: (
            <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ border: '1px solid rgba(216,180,254,0.15)' }}>
                <img
                    src="/screenshots/rutas.png"
                    alt="Vista de rutas con mapa en LogiPyme"
                    className="w-full block"
                    style={{ display: 'block', maxHeight: '340px', objectFit: 'cover', objectPosition: 'top' }}
                />
            </div>
        ),
    },
    {
        id: 'analytics', icon: <BarChart3 size={18} />, label: 'Reportes',
        badge: 'ANALYTICS', badgeColor: '#F59E0B',
        headline: 'Reportes y analytics para crecer con datos',
        description: 'Visualiza el rendimiento de tu operación e identifica zonas problemáticas. Toma decisiones basadas en datos reales.',
        bullets: ['Gráficas de entregas exitosas vs fallidas', 'Ranking de choferes por desempeño', 'Exporta en PDF o Excel'],
        mock: (
            <div className="rounded-2xl overflow-hidden border border-[#1a0a14]/10 p-4 sm:p-5" style={{ backgroundColor: '#1a0a14' }}>
                <p className="text-white/40 text-xs mb-3">Entregas últimos 7 días</p>
                <div className="flex items-end gap-1.5 h-28 mb-4">
                    {[{ h: 55, l: 'L' }, { h: 70, l: 'M' }, { h: 45, l: 'X' }, { h: 85, l: 'J' }, { h: 60, l: 'V' }, { h: 92, l: 'S' }, { h: 75, l: 'D' }].map((b, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full rounded-sm" style={{ height: `${b.h}%`, background: i === 5 ? 'linear-gradient(180deg,#EC4899,#D8B4FE)' : 'rgba(255,255,255,0.1)' }} />
                            <span className="text-white/25 text-[9px]">{b.l}</span>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {[{ label: 'Exitosas', value: '94%', color: '#10B981' }, { label: 'Fallidas', value: '4%', color: '#EF4444' }, { label: 'Prom/día', value: '67', color: '#D8B4FE' }].map(s => (
                        <div key={s.label} className="bg-white/5 rounded-xl p-3 text-center">
                            <p className="text-base sm:text-lg font-black" style={{ color: s.color }}>{s.value}</p>
                            <p className="text-white/40 text-[10px]">{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        ),
    },
]

export default function FeaturesSection() {
    const [active, setActive] = useState(0)
    const f = features[active]

    return (
        <section id="funcionalidades" className="w-full py-20 sm:py-28 px-5 sm:px-8 bg-[#F9FAFB]">
            <div className="w-full mx-auto">
                <div className="text-center mb-12 sm:mb-16">
                    <h2 className="font-black text-[#1a0a14] mb-4 leading-tight" style={{ fontSize: 'clamp(1.8rem, 4vw, 3.2rem)' }}>
                        Todo lo que necesitas<br className="hidden sm:block" />para gestionar tu logística
                    </h2>
                    <p className="text-[#4B5563] text-base sm:text-lg max-w-xl mx-auto">
                        Una sola plataforma para órdenes, rutas, choferes y reportes.
                    </p>
                </div>

                {/* Pills — scroll horizontal en mobile */}
                <div className="flex gap-2 sm:gap-3 mb-10 sm:mb-14 overflow-x-auto pb-2 sm:justify-center sm:flex-wrap scrollbar-hide">
                    {features.map((feat, i) => (
                        <button key={feat.id} onClick={() => setActive(i)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-200 shrink-0
                ${active === i
                                    ? 'bg-[#1a0a14] border-[#EC4899] text-white shadow-lg'
                                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                }`}>
                            <span style={{ color: active === i ? '#EC4899' : '#9CA3AF' }}>{feat.icon}</span>
                            {feat.label}
                        </button>
                    ))}
                </div>

                {/* Detail — stack en mobile, side-by-side en desktop */}
                <div key={f.id} className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center"
                    style={{ animation: 'featureIn 0.35s ease forwards' }}>
                    <div className="order-2 lg:order-1">
                        <span className="inline-block text-[10px] font-black tracking-widest px-3 py-1.5 rounded-full mb-4"
                            style={{ color: f.badgeColor, backgroundColor: `${f.badgeColor}18` }}>
                            {f.badge}
                        </span>
                        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1a0a14] leading-tight mb-4">{f.headline}</h3>
                        <p className="text-[#4B5563] text-sm sm:text-base leading-relaxed mb-6">{f.description}</p>
                        <ul className="space-y-3">
                            {f.bullets.map((b) => (
                                <li key={b} className="flex items-start gap-3">
                                    <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                                        style={{ backgroundColor: `${f.badgeColor}20` }}>
                                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                            <path d="M1 4L3.5 6.5L9 1" stroke={f.badgeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </span>
                                    <span className="text-[#4B5563] text-sm">{b}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="order-1 lg:order-2">{f.mock}</div>
                </div>
            </div>
            <style>{`
        @keyframes featureIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none; }
        .scrollbar-hide::-webkit-scrollbar { display:none; }
      `}</style>
        </section>
    )
}