import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ArrowLeft, ArrowRight, Check, MapPin, User,
    FileText, Truck, Package, Zap,
} from 'lucide-react'

const F = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"

// ── Paleta oscura estilo referencia ──────────────────────────────────────────
const CARD = 'rgba(255,255,255,0.05)'   // glassmorphism oscuro
const CARD_BORDER = 'rgba(255,255,255,0.10)'
const PINK = '#EC4899'
const LILAC = '#D8B4FE'
const BORDER = 'rgba(255,255,255,0.12)'
const BORDER_FOCUS = '#EC4899'
const TEXT = '#f1f0ff'                  // casi blanco con tinte violeta
const TEXT_SUB = 'rgba(200,190,255,0.7)'    // subtítulos apagados
const LABEL = '#c4b5fd'                  // violeta claro para labels
const INPUT_BG = 'rgba(255,255,255,0.06)'
const INPUT_BG_F = 'rgba(255,255,255,0.10)'

const CHOFERES = [
    { id: '1', nombre: 'Luis Ramos', initials: 'LR', ordenes: 8, disponible: true },
    { id: '2', nombre: 'Pedro Méndez', initials: 'PM', ordenes: 6, disponible: true },
    { id: '3', nombre: 'Carlos Suárez', initials: 'CS', ordenes: 0, disponible: true },
    { id: '4', nombre: 'Jesús Torres', initials: 'JT', ordenes: 0, disponible: false },
]

// ─── Input oscuro ─────────────────────────────────────────────────────────────
function DarkInput({
    label, value, onChange, placeholder = '', type = 'text',
    required = false, hint, prefix, multiline = false,
    maxLength, inputMode, onlyLetters = false, onlyNumbers = false,
}: {
    label: string; value: string; onChange: (v: string) => void
    placeholder?: string; type?: string; required?: boolean
    hint?: string; prefix?: React.ReactNode; multiline?: boolean
    maxLength?: number; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
    onlyLetters?: boolean; onlyNumbers?: boolean
}) {
    const [focused, setFocused] = useState(false)

    const sanitize = (raw: string): string => {
        let v = raw
        if (onlyLetters) v = v.replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]/g, '')
        if (onlyNumbers) v = v.replace(/\D/g, '')
        if (maxLength) v = v.slice(0, maxLength)
        return v
    }

    const baseStyle: React.CSSProperties = {
        flex: 1, border: 'none', outline: 'none',
        fontFamily: F, fontSize: 15, color: TEXT,
        backgroundColor: 'transparent', resize: 'none',
        WebkitAppearance: 'none', MozAppearance: 'textfield',
    }

    return (
        <div>
            <label style={{
                fontFamily: F, fontSize: 13, fontWeight: 700,
                color: LABEL, display: 'block', marginBottom: 6,
                letterSpacing: '0.02em',
            }}>
                {label} {required && <span style={{ color: PINK }}>*</span>}
                {maxLength && (
                    <span style={{ fontWeight: 400, color: 'rgba(167,139,250,0.6)', marginLeft: 6 }}>
                        ({value.length}/{maxLength})
                    </span>
                )}
            </label>
            <div style={{
                display: 'flex', alignItems: multiline ? 'flex-start' : 'center',
                gap: 10,
                border: `1.5px solid ${focused ? BORDER_FOCUS : BORDER}`,
                borderRadius: 14, padding: multiline ? '12px 14px' : '0 14px',
                backgroundColor: focused ? INPUT_BG_F : INPUT_BG,
                transition: 'all 0.15s',
                boxShadow: focused ? `0 0 0 3px rgba(236,72,153,0.15)` : 'none',
                minHeight: multiline ? 90 : 48,
            }}>
                {prefix && <span style={{ color: LABEL, flexShrink: 0, paddingTop: multiline ? 2 : 0 }}>{prefix}</span>}
                {multiline ? (
                    <textarea
                        value={value}
                        onChange={e => onChange(sanitize(e.target.value))}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        placeholder={placeholder}
                        rows={3}
                        maxLength={maxLength}
                        style={{ ...baseStyle, paddingTop: 4 }}
                    />
                ) : (
                    <input
                        type={type === 'number' ? 'text' : type}
                        value={value}
                        inputMode={inputMode ?? (onlyNumbers ? 'numeric' : type === 'number' ? 'decimal' : undefined)}
                        maxLength={maxLength}
                        onChange={e => {
                            let v = e.target.value
                            if (inputMode === 'decimal' || inputMode === 'numeric') {
                                v = v.replace(/[^0-9.,]/g, '').replace(',', '.')
                                const parts = v.split('.')
                                if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('')
                            }
                            onChange(sanitize(v))
                        }}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        placeholder={placeholder}
                        style={{ ...baseStyle, height: 44 }}
                    />
                )}
            </div>
            {hint && (
                <p style={{ fontFamily: F, fontSize: 12, color: 'rgba(167,139,250,0.6)', margin: '5px 0 0 2px' }}>{hint}</p>
            )}
        </div>
    )
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepBar({ current, total }: { current: number; total: number }) {
    const steps = [
        { label: 'Cliente', icon: <User size={16} /> },
        { label: 'Entrega', icon: <MapPin size={16} /> },
        { label: 'Asignación', icon: <Truck size={16} /> },
    ]
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 36 }}>
            {steps.map((s, i) => {
                const done = i < current
                const active = i === current
                return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < total - 1 ? 1 : 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                            <div style={{
                                width: active ? 44 : 36, height: active ? 44 : 36,
                                borderRadius: '50%',
                                background: done || active
                                    ? 'linear-gradient(135deg, #EC4899, #D8B4FE)'
                                    : 'rgba(255,255,255,0.07)',
                                border: `1.5px solid ${done || active ? 'transparent' : 'rgba(255,255,255,0.15)'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: done || active ? 'white' : 'rgba(167,139,250,0.5)',
                                transition: 'all 0.3s',
                                boxShadow: active ? '0 4px 18px rgba(236,72,153,0.4)' : 'none',
                            }}>
                                {done ? <Check size={16} strokeWidth={3} /> : s.icon}
                            </div>
                            <span style={{
                                fontFamily: F, fontSize: 12, fontWeight: active ? 700 : 500,
                                color: active ? PINK : done ? LILAC : 'rgba(167,139,250,0.4)',
                                whiteSpace: 'nowrap',
                            }}>
                                {s.label}
                            </span>
                        </div>
                        {i < total - 1 && (
                            <div style={{
                                flex: 1, height: 1.5, margin: '0 8px', marginBottom: 22,
                                background: done
                                    ? 'linear-gradient(90deg, #EC4899, #D8B4FE)'
                                    : 'rgba(255,255,255,0.1)',
                                borderRadius: 1, transition: 'all 0.3s',
                            }} />
                        )}
                    </div>
                )
            })}
        </div>
    )
}

// ─── Paso 1: Datos del cliente ────────────────────────────────────────────────
function Step1({ data, setData }: { data: any; setData: (d: any) => void }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
                <h2 style={{ fontFamily: F, fontSize: 22, fontWeight: 800, color: TEXT, margin: '0 0 4px 0' }}>
                    Datos del cliente
                </h2>
                <p style={{ fontFamily: F, fontSize: 15, color: TEXT_SUB, margin: 0 }}>
                    ¿A quién le estamos entregando?
                </p>
            </div>

            <DarkInput
                label="Nombre completo"
                value={data.nombre}
                onChange={v => setData({ ...data, nombre: v })}
                placeholder="Ej: María González"
                required maxLength={30} onlyLetters
                prefix={<User size={16} />}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                    <label style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: LABEL, display: 'block', marginBottom: 6 }}>
                        Teléfono <span style={{ color: PINK }}>*</span>
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '0 12px', height: 48, borderRadius: 14,
                            border: `1.5px solid ${BORDER}`,
                            backgroundColor: INPUT_BG, flexShrink: 0,
                        }}>
                            <span>🇻🇪</span>
                            <span style={{ fontFamily: F, fontSize: 14, color: LABEL, fontWeight: 600 }}>+58</span>
                        </div>
                        <input
                            value={data.telefono}
                            onChange={e => setData({ ...data, telefono: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                            placeholder="412 000 0000"
                            inputMode="numeric"
                            maxLength={10}
                            style={{
                                flex: 1, height: 48, borderRadius: 14,
                                border: `1.5px solid ${BORDER}`, padding: '0 14px',
                                fontFamily: F, fontSize: 15, color: TEXT, outline: 'none',
                                backgroundColor: INPUT_BG,
                                WebkitAppearance: 'none', MozAppearance: 'textfield',
                            } as React.CSSProperties}
                            onFocus={e => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(236,72,153,0.15)'; e.currentTarget.style.backgroundColor = INPUT_BG_F }}
                            onBlur={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.backgroundColor = INPUT_BG }}
                        />
                    </div>
                </div>
                <DarkInput
                    label="Email (opcional)"
                    value={data.email}
                    onChange={v => setData({ ...data, email: v })}
                    placeholder="cliente@email.com"
                    type="email" maxLength={50}
                />
            </div>

            <DarkInput
                label="Monto a cobrar ($)"
                value={data.monto}
                onChange={v => setData({ ...data, monto: v })}
                placeholder="0.00"
                inputMode="decimal" required
                hint="Monto en dólares. Ej: 12.50"
                prefix={<span style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: PINK }}>$</span>}
            />

            {/* Dimensiones y peso — RF-05 */}
            <div>
                <p style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: LABEL, margin: '0 0 10px 0' }}>
                    Paquete <span style={{ color: 'rgba(167,139,250,0.5)', fontWeight: 500 }}>(opcional)</span>
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    {[
                        { key: 'peso', label: 'Peso (kg)', placeholder: '0.0' },
                        { key: 'largo', label: 'Largo (cm)', placeholder: '0' },
                        { key: 'ancho', label: 'Ancho (cm)', placeholder: '0' },
                        { key: 'alto', label: 'Alto (cm)', placeholder: '0' },
                    ].map(f => (
                        <div key={f.key}>
                            <label style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: LABEL, display: 'block', marginBottom: 5 }}>
                                {f.label}
                            </label>
                            <input
                                type="number"
                                value={data[f.key] ?? ''}
                                onChange={e => setData({ ...data, [f.key]: e.target.value })}
                                placeholder={f.placeholder}
                                min="0"
                                style={{
                                    width: '100%', height: 44, borderRadius: 12,
                                    border: `1.5px solid ${BORDER}`, padding: '0 12px',
                                    fontFamily: F, fontSize: 15, color: TEXT,
                                    outline: 'none', backgroundColor: INPUT_BG,
                                    boxSizing: 'border-box',
                                }}
                                onFocus={e => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(236,72,153,0.15)'; e.currentTarget.style.backgroundColor = INPUT_BG_F }}
                                onBlur={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.backgroundColor = INPUT_BG }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ─── Paso 2: Dirección de entrega ─────────────────────────────────────────────
function Step2({ data, setData }: { data: any; setData: (d: any) => void }) {
    const zonas = ['Chacao', 'Altamira', 'La Candelaria', 'El Paraíso', 'Petare', 'Las Mercedes', 'Sabana Grande', 'Bello Campo', 'Los Palos Grandes', 'El Cafetal']

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
                <h2 style={{ fontFamily: F, fontSize: 22, fontWeight: 800, color: TEXT, margin: '0 0 4px 0' }}>
                    Dirección de entrega
                </h2>
                <p style={{ fontFamily: F, fontSize: 15, color: TEXT_SUB, margin: 0 }}>
                    ¿Dónde hay que entregar?
                </p>
            </div>

            <DarkInput
                label="Dirección completa"
                value={data.direccion}
                onChange={v => setData({ ...data, direccion: v })}
                placeholder="Ej: Av. Francisco de Miranda, Edif. Centro, Piso 3, Apto 3-B"
                required
                prefix={<MapPin size={16} />}
                multiline maxLength={200}
                hint="Mientras más detallada sea la dirección, mejor la precisión de la IA"
            />

            {/* Zona / sector */}
            <div>
                <label style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: LABEL, display: 'block', marginBottom: 10 }}>
                    Zona / Sector <span style={{ color: PINK }}>*</span>
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {zonas.map(z => (
                        <button
                            key={z}
                            onClick={() => setData({ ...data, zona: z })}
                            style={{
                                padding: '7px 15px', borderRadius: 20,
                                border: `1.5px solid ${data.zona === z ? PINK : 'rgba(255,255,255,0.12)'}`,
                                backgroundColor: data.zona === z ? 'rgba(236,72,153,0.15)' : 'rgba(255,255,255,0.05)',
                                color: data.zona === z ? PINK : 'rgba(200,190,255,0.65)',
                                fontFamily: F, fontSize: 13, fontWeight: data.zona === z ? 700 : 500,
                                cursor: 'pointer', transition: 'all 0.15s',
                            }}
                        >
                            {data.zona === z && <Check size={11} style={{ display: 'inline', marginRight: 4 }} strokeWidth={3} />}
                            {z}
                        </button>
                    ))}
                </div>
            </div>

            <DarkInput
                label="Notas de entrega (opcional)"
                value={data.notas}
                onChange={v => setData({ ...data, notas: v })}
                placeholder="Ej: Tocar timbre 2 veces. Entregar solo a Carlos. No dejar en portería."
                multiline maxLength={300}
                prefix={<FileText size={16} />}
            />
        </div>
    )
}

// ─── Paso 3: Asignar chofer ───────────────────────────────────────────────────
function Step3({ data, setData }: { data: any; setData: (d: any) => void }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
                <h2 style={{ fontFamily: F, fontSize: 22, fontWeight: 800, color: TEXT, margin: '0 0 4px 0' }}>
                    Asignar chofer
                </h2>
                <p style={{ fontFamily: F, fontSize: 15, color: TEXT_SUB, margin: 0 }}>
                    ¿Quién va a entregar? (opcional — puedes asignar después)
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Sin asignar */}
                <button
                    onClick={() => setData({ ...data, choferId: null })}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 18px', borderRadius: 16,
                        border: `1.5px solid ${!data.choferId ? PINK : 'rgba(255,255,255,0.1)'}`,
                        backgroundColor: !data.choferId ? 'rgba(236,72,153,0.1)' : 'rgba(255,255,255,0.04)',
                        cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                    }}
                >
                    <div style={{
                        width: 42, height: 42, borderRadius: 12,
                        backgroundColor: 'rgba(167,139,250,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                        <Package size={18} color="#a78bfa" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: TEXT, margin: 0 }}>Sin asignar por ahora</p>
                        <p style={{ fontFamily: F, fontSize: 13, color: TEXT_SUB, margin: 0 }}>La orden quedará en estado "Creada"</p>
                    </div>
                    {!data.choferId && (
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#EC4899,#D8B4FE)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Check size={13} color="white" strokeWidth={3} />
                        </div>
                    )}
                </button>

                {/* Choferes */}
                {CHOFERES.map(c => (
                    <button
                        key={c.id}
                        onClick={() => c.disponible && setData({ ...data, choferId: c.id })}
                        disabled={!c.disponible}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            padding: '14px 18px', borderRadius: 16,
                            border: `1.5px solid ${data.choferId === c.id ? PINK : 'rgba(255,255,255,0.1)'}`,
                            backgroundColor: data.choferId === c.id
                                ? 'rgba(236,72,153,0.1)'
                                : c.disponible ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                            cursor: c.disponible ? 'pointer' : 'not-allowed',
                            transition: 'all 0.15s', textAlign: 'left',
                            opacity: c.disponible ? 1 : 0.4,
                        }}
                    >
                        <div style={{
                            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                            background: c.disponible ? 'linear-gradient(135deg,#EC4899,#D8B4FE)' : 'rgba(255,255,255,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: 13, fontWeight: 800, letterSpacing: '0.02em',
                        }}>
                            {c.initials}
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: TEXT, margin: 0 }}>{c.nombre}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                <span style={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    backgroundColor: c.disponible ? '#10b981' : '#ef4444', display: 'inline-block',
                                }} />
                                <span style={{ fontFamily: F, fontSize: 13, color: TEXT_SUB }}>
                                    {c.disponible ? `Disponible · ${c.ordenes} órdenes hoy` : 'Inactivo'}
                                </span>
                            </div>
                        </div>
                        {data.choferId === c.id && (
                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#EC4899,#D8B4FE)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Check size={13} color="white" strokeWidth={3} />
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    )
}

// ─── Page principal ────────────────────────────────────────────────────────────
export default function NewOrderPage() {
    const navigate = useNavigate()
    const [step, setStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)

    const [step1, setStep1] = useState({ nombre: '', telefono: '', email: '', monto: '', peso: '', largo: '', ancho: '', alto: '' })
    const [step2, setStep2] = useState({ direccion: '', zona: '', notas: '' })
    const [step3, setStep3] = useState({ choferId: null as string | null })

    const canNext = [
        step1.nombre.trim() && step1.telefono.trim() && step1.monto.trim(),
        step2.direccion.trim() && step2.zona.trim(),
        true,
    ][step]

    const handleSubmit = async () => {
        setLoading(true)
        // TODO: POST /api/logistics/orders + PATCH status si hay chofer
        await new Promise(r => setTimeout(r, 1200))
        setLoading(false)
        setDone(true)
        setTimeout(() => navigate('/app/orders'), 1800)
    }

    // ── Pantalla de éxito ──
    if (done) {
        return (
            <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: '50%', margin: '0 auto 20px',
                        background: 'linear-gradient(135deg, #EC4899, #D8B4FE)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 12px 40px rgba(236,72,153,0.5)',
                        animation: 'pop 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
                    }}>
                        <Check size={36} color="white" strokeWidth={3} />
                    </div>
                    <h2 style={{ fontFamily: F, fontSize: 26, fontWeight: 900, color: TEXT, margin: '0 0 8px 0' }}>
                        ¡Orden creada!
                    </h2>
                    <p style={{ fontFamily: F, fontSize: 16, color: TEXT_SUB, margin: 0 }}>
                        Redirigiendo a órdenes...
                    </p>
                    <style>{`@keyframes pop{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
                </div>
            </div>
        )
    }

    return (
        <div style={{ fontFamily: F, maxWidth: 640, margin: '0 auto' }}>

            {/* Back */}
            <button
                onClick={() => navigate('/app/orders')}
                style={{
                    display: 'flex', alignItems: 'center', gap: 7, marginBottom: 28,
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: F, fontSize: 15, color: 'rgba(200,190,255,0.45)',
                    padding: 0, transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(200,190,255,0.9)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(200,190,255,0.45)')}
            >
                <ArrowLeft size={17} />
                Volver a órdenes
            </button>

            {/* Card principal — glassmorphism oscuro */}
            <div style={{
                backgroundColor: CARD,
                borderRadius: 24,
                border: `1.5px solid ${CARD_BORDER}`,
                boxShadow: '0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
                padding: '32px',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                position: 'relative', overflow: 'hidden',
            }}>
                {/* Decos de fondo */}
                <div style={{
                    position: 'absolute', top: -80, right: -80,
                    width: 220, height: 220, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(236,72,153,0.12), transparent 70%)',
                    pointerEvents: 'none',
                }} />
                <div style={{
                    position: 'absolute', bottom: -60, left: -60,
                    width: 180, height: 180, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)',
                    pointerEvents: 'none',
                }} />

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: 'linear-gradient(135deg, #EC4899, #D8B4FE)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 16px rgba(236,72,153,0.4)',
                    }}>
                        <Package size={18} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontFamily: F, fontSize: 20, fontWeight: 900, color: TEXT, margin: 0, letterSpacing: '-0.01em' }}>
                            Nueva orden
                        </h1>
                        <p style={{ fontFamily: F, fontSize: 13, color: TEXT_SUB, margin: 0 }}>
                            Paso {step + 1} de 3
                        </p>
                    </div>
                </div>

                <StepBar current={step} total={3} />

                {/* Contenido del paso */}
                <div style={{ minHeight: 320 }}>
                    {step === 0 && <Step1 data={step1} setData={setStep1} />}
                    {step === 1 && <Step2 data={step2} setData={setStep2} />}
                    {step === 2 && <Step3 data={step3} setData={setStep3} />}
                </div>

                {/* Botones de navegación */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginTop: 28, paddingTop: 20,
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                }}>
                    <button
                        onClick={() => step > 0 ? setStep(step - 1) : navigate('/app/orders')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '11px 20px', borderRadius: 12,
                            border: `1.5px solid rgba(255,255,255,0.12)`,
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            color: 'rgba(200,190,255,0.7)', cursor: 'pointer',
                            fontFamily: F, fontSize: 15, fontWeight: 600,
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.color = PINK }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(200,190,255,0.7)' }}
                    >
                        <ArrowLeft size={16} />
                        {step === 0 ? 'Cancelar' : 'Anterior'}
                    </button>

                    {/* Dots */}
                    <div style={{ display: 'flex', gap: 6 }}>
                        {[0, 1, 2].map(i => (
                            <div key={i} style={{
                                width: i === step ? 20 : 6, height: 6, borderRadius: 3,
                                backgroundColor: i === step ? PINK : i < step ? LILAC : 'rgba(255,255,255,0.15)',
                                transition: 'all 0.3s',
                            }} />
                        ))}
                    </div>

                    {step < 2 ? (
                        <button
                            onClick={() => canNext && setStep(step + 1)}
                            disabled={!canNext}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '11px 22px', borderRadius: 12,
                                background: canNext ? 'linear-gradient(135deg,#EC4899,#D8B4FE)' : 'rgba(255,255,255,0.07)',
                                border: 'none',
                                color: canNext ? 'white' : 'rgba(167,139,250,0.4)',
                                cursor: canNext ? 'pointer' : 'not-allowed',
                                fontFamily: F, fontSize: 15, fontWeight: 700,
                                transition: 'all 0.15s',
                                boxShadow: canNext ? '0 4px 18px rgba(236,72,153,0.35)' : 'none',
                            }}
                        >
                            Siguiente
                            <ArrowRight size={16} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '11px 24px', borderRadius: 12,
                                background: 'linear-gradient(135deg,#EC4899,#D8B4FE)',
                                border: 'none', color: 'white',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontFamily: F, fontSize: 15, fontWeight: 700,
                                opacity: loading ? 0.7 : 1, transition: 'all 0.2s',
                                boxShadow: '0 4px 20px rgba(236,72,153,0.45)',
                            }}
                        >
                            {loading ? (
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                            ) : <Zap size={16} fill="white" />}
                            {loading ? 'Creando...' : 'Crear orden'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}