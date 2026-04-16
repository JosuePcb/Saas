import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, X } from 'lucide-react'

const plans = [
    {
        id: 'starter', name: 'Starter', monthlyPrice: 15,
        gradient: 'linear-gradient(135deg, #EC4899 0%, #D8B4FE 100%)',
        features: [
            { text: '3 choferes', ok: true },
            { text: '300 órdenes/mes', ok: true },
            { text: 'Dashboard básico', ok: true },
            { text: 'Soporte por email', ok: true },
            { text: 'IA y analytics avanzado', ok: false },
            { text: 'API pública', ok: false },
        ],
    },
    {
        id: 'growth', name: 'Growth', monthlyPrice: 35,
        gradient: 'linear-gradient(135deg, #D8B4FE 0%, #EC4899 100%)',
        features: [
            { text: '10 choferes', ok: true },
            { text: '1,000 órdenes/mes', ok: true },
            { text: 'IA básica (100 normalizaciones)', ok: true },
            { text: 'Analytics avanzado', ok: true },
            { text: 'Soporte prioritario', ok: true },
            { text: 'API pública', ok: false },
        ],
        badge: 'LA MEJOR OPCIÓN',
    },
    {
        id: 'pro', name: 'Pro', monthlyPrice: 75,
        gradient: 'linear-gradient(135deg, #EC4899 0%, #9333EA 100%)',
        features: [
            { text: 'Choferes ilimitados', ok: true },
            { text: 'Órdenes ilimitadas', ok: true },
            { text: 'IA completa', ok: true },
            { text: 'API pública', ok: true },
            { text: 'Soporte 24/7', ok: true },
            { text: 'SLA garantizado', ok: true },
        ],
    },
]

export default function PricingSection() {
    const [annual, setAnnual] = useState(false)
    const navigate = useNavigate()
    const price = (m: number) => annual ? Math.round(m * 0.8) : m

    return (
        <section id="precios" className="w-full py-20 sm:py-28 px-5" style={{ backgroundColor: '#1a0a14' }}>
            <div className="max-w-6xl mx-auto">

                <div className="text-center mb-10 sm:mb-14">
                    <h2 className="font-black text-white mb-3" style={{ fontSize: 'clamp(1.8rem, 4vw, 3.2rem)' }}>
                        El precio justo para tu negocio
                    </h2>
                    <p className="text-[#D8B4FE] text-base sm:text-lg">
                        Sin contratos. Cancela cuando quieras. Empieza gratis 7 días.
                    </p>
                </div>

                {/* Toggle */}
                <div className="flex justify-center mb-10 sm:mb-14">
                    <div className="flex items-center gap-1 bg-white/10 rounded-full p-1">
                        <button
                            onClick={() => setAnnual(false)}
                            className={`px-5 sm:px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${!annual ? 'bg-white text-[#1a0a14]' : 'text-white/50 hover:text-white'}`}
                        >
                            Mensual
                        </button>
                        <button
                            onClick={() => setAnnual(true)}
                            className={`flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${annual ? 'bg-white text-[#1a0a14]' : 'text-white/50 hover:text-white'}`}
                        >
                            Anual
                            <span className="bg-[#EC4899] text-white text-[10px] font-black px-2 py-0.5 rounded-full">20% OFF</span>
                        </button>
                    </div>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {plans.map((plan, i) => (
                        <div
                            key={plan.id}
                            className="relative flex flex-col rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                            style={{ animation: `cardIn 0.5s ease ${i * 0.1}s both` }}
                        >
                            {/* Badge "mejor opción" */}
                            {plan.badge && (
                                <div className="absolute top-3 right-3 z-10">
                                    <span
                                        className="text-[10px] font-black px-3 py-1 rounded-full tracking-wider"
                                        style={{ background: 'rgba(255,255,255,0.25)', color: 'white', backdropFilter: 'blur(4px)' }}
                                    >
                                        ★ MEJOR OPCIÓN
                                    </span>
                                </div>
                            )}

                            {/* Header gradiente */}
                            <div className="px-6 pt-7 pb-6" style={{ background: plan.gradient }}>
                                <p className="text-white font-black text-xl mb-3">{plan.name}</p>
                                <div className="flex items-end gap-1">
                                    <span className="text-white font-black text-5xl sm:text-6xl leading-none">
                                        ${price(plan.monthlyPrice)}
                                    </span>
                                    <span className="text-white/70 text-sm mb-1">/mes</span>
                                </div>
                                {annual && (
                                    <p className="text-white/70 text-xs mt-1.5">
                                        Ahorrás ${(plan.monthlyPrice - price(plan.monthlyPrice)) * 12}/año
                                    </p>
                                )}
                            </div>

                            {/* Features */}
                            <div className="flex-1 bg-white px-6 py-6 flex flex-col">
                                <ul className="space-y-3.5 flex-1 mb-7">
                                    {plan.features.map((feat) => (
                                        <li key={feat.text} className="flex items-center gap-3">
                                            {feat.ok ? (
                                                <div className="w-5 h-5 rounded-full bg-[#10B981]/15 flex items-center justify-center shrink-0">
                                                    <Check size={11} className="text-[#10B981]" strokeWidth={3} />
                                                </div>
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                                    <X size={11} className="text-gray-300" strokeWidth={2} />
                                                </div>
                                            )}
                                            <span className={`text-sm ${feat.ok ? 'text-gray-700 font-medium' : 'text-gray-300'}`}>
                                                {feat.text}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <PlanButton planId={plan.id} navigate={navigate} gradient={plan.gradient} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
        @keyframes cardIn { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
        </section>
    )
}

function PlanButton({
    planId,
    navigate,
    gradient,
}: {
    planId: string
    navigate: (path: string) => void
    gradient: string
}) {
    const [hovered, setHovered] = useState(false)

    return (
        <button
            onClick={() => navigate(`/register?plan=${planId}`)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="w-full py-3.5 rounded-xl text-sm font-black transition-all duration-200 border-2 hover:-translate-y-0.5 active:scale-95"
            style={{
                background: hovered ? gradient : 'transparent',
                borderColor: hovered ? 'transparent' : '#EC4899',
                color: hovered ? 'white' : '#EC4899',
                boxShadow: hovered ? '0 6px 24px rgba(236,72,153,0.3)' : 'none',
            }}
        >
            Seleccionar plan
        </button>
    )
}