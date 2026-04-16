import { Link } from 'react-router-dom'
import { UserPlus, Settings, Zap } from 'lucide-react'

const steps = [
    {
        num: '01', icon: <UserPlus size={24} />,
        title: 'Regístrate para empezar',
        description: 'Cuéntanos sobre tu negocio para ayudarte a aprovechar LogiPyme desde el primer día. Solo toma 2 minutos.',
    },
    {
        num: '02', icon: <Settings size={24} />,
        title: 'Configuración inicial',
        description: 'Agrega tus choferes, vehículos y clientes. El sistema te guía paso a paso sin complicaciones técnicas.',
    },
    {
        num: '03', icon: <Zap size={24} />,
        title: 'Gestiona y crece',
        description: 'Crea órdenes, asigna rutas y monitorea cada entrega en tiempo real. Todo desde un solo lugar.',
    },
]

export default function HowItWorksSection() {
    return (
        <section className="w-full py-20 sm:py-28 px-5 sm:px-8 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1a0a14 0%, #2d0a2e 50%, #1a0a14 100%)' }}>

            <div className="absolute top-[-20%] right-[-10%] w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
                style={{ background: 'radial-gradient(circle, #EC4899, transparent 70%)' }} />
            <div className="absolute bottom-[-20%] left-[-10%] w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
                style={{ background: 'radial-gradient(circle, #D8B4FE, transparent 70%)' }} />

            <div className="w-full mx-auto relative z-10">
                <div className="text-center mb-12 sm:mb-16">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3">¿Cómo empezar?</h2>
                    <p className="text-white/50 text-base sm:text-lg">En minutos tienes tu operación corriendo.</p>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-12">
                    <div>
                        {steps.map((step, i) => (
                            <div key={step.num}>
                                <div className="flex items-start gap-4 sm:gap-6 py-6 sm:py-8">
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 text-white"
                                        style={{ background: 'linear-gradient(135deg, #EC4899, #D8B4FE)' }}>
                                        {step.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-xs sm:text-sm font-black tracking-widest text-[#EC4899]">{step.num}</span>
                                            <h3 className="text-white font-bold text-lg sm:text-xl lg:text-2xl">{step.title}</h3>
                                        </div>
                                        <p className="text-white/50 text-base sm:text-lg leading-relaxed">{step.description}</p>
                                    </div>
                                </div>
                                {i < steps.length - 1 && (
                                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 text-center">
                        <Link to="/register"
                            className="inline-block px-8 py-4 font-black text-base sm:text-lg rounded-xl transition-all hover:-translate-y-0.5 active:scale-95"
                            style={{ background: 'linear-gradient(135deg, #EC4899, #DB2777)', boxShadow: '0 10px 35px rgba(236,72,153,0.3)', color: 'white' }}>
                            Crea tu cuenta hoy
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}