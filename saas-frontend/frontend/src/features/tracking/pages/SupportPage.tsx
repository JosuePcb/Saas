import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
    Zap, ArrowLeft, MessageCircle, Package,
    Clock, CheckCircle2, ChevronDown, Send, Phone,
    AlertCircle,
} from 'lucide-react'

const F = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

const BG = '#1f0d18'
const SURFACE = '#1a0a14'
const CARD = '#2a1020'
const CARD_HI = '#2f1526'

const PINK = '#EC4899'
const LILAC = '#D8B4FE'
const GREEN = '#10b981'
const AMBER = '#F59E0B'
const RED = '#ef4444'

const TEXT = 'rgba(255,255,255,0.9)'
const TEXT_MID = 'rgba(255,255,255,0.55)'
const TEXT_SUB = 'rgba(255,255,255,0.35)'
const BORDER = 'rgba(236,72,153,0.12)'
const BORDER_W = 'rgba(255,255,255,0.06)'
const SHADOW = '0 4px 24px rgba(0,0,0,0.35), 0 1px 4px rgba(236,72,153,0.1)'

// ── Constantes de validación ───────────────────────────────────────────────────
const NOMBRE_MAX = 60
const TELEFONO_MAX = 15   // e.g. 04121234567
const MENSAJE_MAX = 500
const MENSAJE_MIN = 10
const NOMBRE_MIN = 2

const MOTIVOS = [
    { id: 'no_llegó', label: 'Mi paquete no ha llegado', icon: <Package size={15} /> },
    { id: 'direccion', label: 'Problema con la dirección', icon: <Package size={15} /> },
    { id: 'dañado', label: 'Paquete llegó dañado', icon: <Package size={15} /> },
    { id: 'reprogramar', label: 'Quiero reprogramar la entrega', icon: <Clock size={15} /> },
    { id: 'otro', label: 'Otro motivo', icon: <MessageCircle size={15} /> },
]

// ── Funciones de validación ────────────────────────────────────────────────────

/** Solo letras (incluyendo acentos, ñ), espacios y guiones. Sin números ni símbolos. */
function sanitizeName(val: string): string {
    // Elimina cualquier carácter que no sea letra, espacio o guion
    return val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛäëïöüÄËÏÖÜãõÃÕñÑüÜçÇ\s\-']/g, '')
        .slice(0, NOMBRE_MAX)
}

/** Solo dígitos, sin espacios ni signos. */
function sanitizePhone(val: string): string {
    return val.replace(/[^0-9]/g, '').slice(0, TELEFONO_MAX)
}

function validateNombre(val: string): string {
    if (!val.trim()) return 'El nombre es obligatorio.'
    if (val.trim().length < NOMBRE_MIN) return `Mínimo ${NOMBRE_MIN} caracteres.`
    return ''
}

function validateTelefono(val: string): string {
    if (!val) return ''  // opcional
    if (val.length < 7) return 'El teléfono debe tener al menos 7 dígitos.'
    return ''
}

function validateMensaje(val: string): string {
    if (!val.trim()) return 'El mensaje es obligatorio.'
    if (val.trim().length < MENSAJE_MIN) return `Mínimo ${MENSAJE_MIN} caracteres.`
    return ''
}

type Step = 'form' | 'sent'

export default function SupportPage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const codigoParam = searchParams.get('codigo') ?? ''

    const [step, setStep] = useState<Step>('form')
    const [motivo, setMotivo] = useState('')
    const [mensaje, setMensaje] = useState('')
    const [nombre, setNombre] = useState('')
    const [telefono, setTelefono] = useState('')
    const [sending, setSending] = useState(false)
    const [openFaq, setOpenFaq] = useState<number | null>(null)

    // Touched — para mostrar errores solo después de que el usuario tocó el campo
    const [touched, setTouched] = useState({ nombre: false, telefono: false, mensaje: false })

    const errNombre = validateNombre(nombre)
    const errTelefono = validateTelefono(telefono)
    const errMensaje = validateMensaje(mensaje)

    const canSend = !errNombre && !errTelefono && !errMensaje && motivo !== ''

    const handleSend = async () => {
        // Marca todos como tocados para mostrar errores pendientes
        setTouched({ nombre: true, telefono: true, mensaje: true })
        if (!canSend) return
        setSending(true)
        await new Promise(r => setTimeout(r, 1400))
        setSending(false)
        setStep('sent')
    }

    const ticketNum = `SUP-${Date.now().toString().slice(-6)}`

    // ── Confirmación ────────────────────────────────────────────────────────────
    if (step === 'sent') {
        return (
            <div style={{ minHeight: '100dvh', backgroundColor: BG, fontFamily: F, display: 'flex', flexDirection: 'column' }}>
                <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
                <Header onBack={() => navigate(-1)} />
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    padding: '32px 20px', animation: 'fadeUp 0.4s ease both',
                }}>
                    <div style={{
                        width: 68, height: 68, borderRadius: 18, marginBottom: 18,
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.06))',
                        border: '1.5px solid rgba(16,185,129,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(16,185,129,0.12)',
                    }}>
                        <CheckCircle2 size={32} color={GREEN} strokeWidth={2} />
                    </div>
                    <h2 style={{ fontFamily: F, fontSize: 21, fontWeight: 900, color: TEXT, margin: '0 0 8px', textAlign: 'center', letterSpacing: '-0.02em' }}>
                        ¡Mensaje enviado!
                    </h2>
                    <p style={{ fontFamily: F, fontSize: 13, color: TEXT_MID, margin: '0 0 22px', textAlign: 'center', maxWidth: 340, lineHeight: 1.6 }}>
                        El equipo de <strong style={{ color: TEXT }}>DistribuidoraPro C.A.</strong> recibió tu solicitud y te contactará pronto.
                    </p>
                    <div style={{
                        backgroundColor: CARD, border: `1px solid ${BORDER}`,
                        borderRadius: 16, padding: '18px 20px',
                        width: '100%', maxWidth: 400, boxShadow: SHADOW, marginBottom: 22,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ fontFamily: F, fontSize: 10, fontWeight: 700, color: TEXT_SUB, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Número de ticket</span>
                            <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: PINK, backgroundColor: 'rgba(236,72,153,0.1)', padding: '2px 9px', borderRadius: 6 }}>
                                {ticketNum}
                            </span>
                        </div>
                        {[
                            { label: 'Orden', val: codigoParam || 'No especificado' },
                            { label: 'Motivo', val: MOTIVOS.find(m => m.id === motivo)?.label ?? motivo },
                            { label: 'Nombre', val: nombre },
                            { label: 'Respuesta en', val: '2–4 horas hábiles' },
                        ].map((r, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderTop: `1px solid ${BORDER_W}` }}>
                                <span style={{ fontFamily: F, fontSize: 12, color: TEXT_SUB }}>{r.label}</span>
                                <span style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: TEXT, textAlign: 'right', maxWidth: '55%' }}>{r.val}</span>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => codigoParam ? navigate(`/tracking/${codigoParam}`) : navigate('/')}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 7,
                            backgroundColor: PINK, color: 'white', border: 'none',
                            borderRadius: 12, padding: '11px 24px', cursor: 'pointer',
                            fontFamily: F, fontSize: 14, fontWeight: 700,
                            boxShadow: '0 4px 16px rgba(236,72,153,0.3)',
                        }}
                    >
                        <ArrowLeft size={14} />
                        {codigoParam ? 'Volver al seguimiento' : 'Ir al inicio'}
                    </button>
                </div>
                <Footer />
            </div>
        )
    }

    // ── Formulario ──────────────────────────────────────────────────────────────
    return (
        <div style={{ minHeight: '100dvh', backgroundColor: BG, fontFamily: F, display: 'flex', flexDirection: 'column' }}>
            <style>{`
                @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
                @keyframes spin{to{transform:rotate(360deg)}}
                .sup-input:focus{outline:none;border-color:${PINK}!important;box-shadow:0 0 0 3px rgba(236,72,153,0.15)!important;}
                .sup-input.error:focus{border-color:${RED}!important;box-shadow:0 0 0 3px rgba(239,68,68,0.12)!important;}
                .sup-textarea:focus{outline:none;border-color:${PINK}!important;box-shadow:0 0 0 3px rgba(236,72,153,0.15)!important;}
                .sup-motivo:hover{background:${CARD_HI}!important;border-color:rgba(236,72,153,0.2)!important;}
                .sup-faq:hover{background:rgba(255,255,255,0.03)!important;}
                @media(max-width:479px){.sup-name-phone{grid-template-columns:1fr!important;}}
            `}</style>

            <Header onBack={() => navigate(-1)} />

            <div style={{
                flex: 1, maxWidth: 680, width: '100%', margin: '0 auto',
                padding: '24px 16px 40px',
                display: 'flex', flexDirection: 'column', gap: 18,
                animation: 'fadeUp 0.4s ease 0.05s both',
            }}>

                {/* Título */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: 'rgba(236,72,153,0.1)', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MessageCircle size={16} color={PINK} />
                        </div>
                        <h1 style={{ fontFamily: F, fontSize: 20, fontWeight: 900, color: TEXT, margin: 0, letterSpacing: '-0.02em' }}>
                            Centro de Soporte
                        </h1>
                    </div>
                    <p style={{ fontFamily: F, fontSize: 13, color: TEXT_MID, margin: 0, lineHeight: 1.6 }}>
                        ¿Tienes un problema con tu entrega? Cuéntanos y te ayudamos.
                        {codigoParam && (
                            <> Orden: <span style={{ fontFamily: MONO, color: PINK, fontWeight: 700 }}>{codigoParam}</span></>
                        )}
                    </p>
                </div>

                {/* Formulario */}
                <div style={{ backgroundColor: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: SHADOW, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', borderBottom: `1px solid ${BORDER_W}`, display: 'flex', alignItems: 'center', gap: 7 }}>
                        <Send size={13} color={PINK} />
                        <span style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: TEXT }}>Enviar mensaje al equipo de entrega</span>
                    </div>

                    <div style={{ padding: '18px' }}>

                        {/* Nombre + Teléfono */}
                        <div
                            className="sup-name-phone"
                            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}
                        >
                            {/* Nombre */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                    <label style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: TEXT_SUB, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        Nombre *
                                    </label>
                                    <span style={{ fontFamily: MONO, fontSize: 10, color: nombre.length > NOMBRE_MAX - 10 ? AMBER : TEXT_SUB }}>
                                        {nombre.length}/{NOMBRE_MAX}
                                    </span>
                                </div>
                                <input
                                    className={`sup-input${touched.nombre && errNombre ? ' error' : ''}`}
                                    placeholder="Tu nombre completo"
                                    value={nombre}
                                    maxLength={NOMBRE_MAX}
                                    onChange={e => setNombre(sanitizeName(e.target.value))}
                                    onBlur={() => setTouched(t => ({ ...t, nombre: true }))}
                                    style={{
                                        width: '100%', boxSizing: 'border-box',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        border: `1px solid ${touched.nombre && errNombre ? RED + '60' : BORDER_W}`,
                                        borderRadius: 9, padding: '9px 11px',
                                        fontFamily: F, fontSize: 13, color: TEXT,
                                        transition: 'border-color 0.2s, box-shadow 0.2s',
                                    }}
                                />
                                {touched.nombre && errNombre && (
                                    <FieldError msg={errNombre} />
                                )}
                                {!touched.nombre && (
                                    <p style={{ fontFamily: F, fontSize: 10, color: TEXT_SUB, margin: '4px 0 0' }}>
                                        Solo letras y espacios
                                    </p>
                                )}
                            </div>

                            {/* Teléfono */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                    <label style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: TEXT_SUB, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        Teléfono <span style={{ color: TEXT_SUB, fontWeight: 400 }}>(opcional)</span>
                                    </label>
                                    <span style={{ fontFamily: MONO, fontSize: 10, color: telefono.length > TELEFONO_MAX - 3 ? AMBER : TEXT_SUB }}>
                                        {telefono.length}/{TELEFONO_MAX}
                                    </span>
                                </div>
                                <input
                                    className={`sup-input${touched.telefono && errTelefono ? ' error' : ''}`}
                                    placeholder="04121234567"
                                    value={telefono}
                                    maxLength={TELEFONO_MAX}
                                    inputMode="numeric"
                                    onChange={e => setTelefono(sanitizePhone(e.target.value))}
                                    onBlur={() => setTouched(t => ({ ...t, telefono: true }))}
                                    style={{
                                        width: '100%', boxSizing: 'border-box',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        border: `1px solid ${touched.telefono && errTelefono ? RED + '60' : BORDER_W}`,
                                        borderRadius: 9, padding: '9px 11px',
                                        fontFamily: MONO, fontSize: 13, color: TEXT,
                                        transition: 'border-color 0.2s, box-shadow 0.2s',
                                    }}
                                />
                                {touched.telefono && errTelefono && (
                                    <FieldError msg={errTelefono} />
                                )}
                                {!touched.telefono && (
                                    <p style={{ fontFamily: F, fontSize: 10, color: TEXT_SUB, margin: '4px 0 0' }}>
                                        Solo números, sin espacios ni signos
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Código de orden — solo si no viene en URL */}
                        {!codigoParam && (
                            <div style={{ marginBottom: 14 }}>
                                <label style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: TEXT_SUB, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 5 }}>
                                    Código de orden <span style={{ color: TEXT_SUB, fontWeight: 400 }}>(opcional)</span>
                                </label>
                                <input
                                    className="sup-input"
                                    placeholder="TRK-LGP-20260408-001"
                                    style={{
                                        width: '100%', boxSizing: 'border-box',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        border: `1px solid ${BORDER_W}`,
                                        borderRadius: 9, padding: '9px 11px',
                                        fontFamily: MONO, fontSize: 12, color: PINK,
                                        transition: 'border-color 0.2s, box-shadow 0.2s',
                                    }}
                                />
                            </div>
                        )}

                        {/* Motivo */}
                        <div style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                                <label style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: TEXT_SUB, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    Motivo *
                                </label>
                                {!motivo && (
                                    <span style={{ fontFamily: F, fontSize: 10, color: AMBER }}>Elige uno</span>
                                )}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 7 }}>
                                {MOTIVOS.map(m => (
                                    <button
                                        key={m.id}
                                        className="sup-motivo"
                                        onClick={() => setMotivo(m.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            padding: '9px 12px', borderRadius: 9, cursor: 'pointer',
                                            textAlign: 'left', transition: 'all 0.15s',
                                            backgroundColor: motivo === m.id ? 'rgba(236,72,153,0.1)' : 'rgba(255,255,255,0.04)',
                                            border: `1px solid ${motivo === m.id ? 'rgba(236,72,153,0.35)' : BORDER_W}`,
                                        }}
                                    >
                                        <span style={{ color: motivo === m.id ? PINK : TEXT_SUB, flexShrink: 0 }}>{m.icon}</span>
                                        <span style={{ fontFamily: F, fontSize: 12, fontWeight: motivo === m.id ? 700 : 500, color: motivo === m.id ? TEXT : TEXT_MID, lineHeight: 1.3 }}>
                                            {m.label}
                                        </span>
                                        {motivo === m.id && (
                                            <span style={{ marginLeft: 'auto', width: 15, height: 15, borderRadius: '50%', backgroundColor: PINK, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Mensaje */}
                        <div style={{ marginBottom: 18 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                <label style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: TEXT_SUB, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    Mensaje *
                                </label>
                                <span style={{ fontFamily: MONO, fontSize: 10, color: mensaje.length >= MENSAJE_MAX - 50 ? AMBER : mensaje.length >= MENSAJE_MIN ? GREEN : TEXT_SUB }}>
                                    {mensaje.length}/{MENSAJE_MAX}
                                </span>
                            </div>
                            <textarea
                                className="sup-textarea"
                                placeholder="Describe tu problema con detalle. Por ejemplo: la dirección es correcta pero el repartidor no llegó…"
                                value={mensaje}
                                onChange={e => setMensaje(e.target.value.slice(0, MENSAJE_MAX))}
                                onBlur={() => setTouched(t => ({ ...t, mensaje: true }))}
                                rows={4}
                                style={{
                                    width: '100%', boxSizing: 'border-box', resize: 'vertical',
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    border: `1px solid ${touched.mensaje && errMensaje ? RED + '60' : BORDER_W}`,
                                    borderRadius: 9, padding: '10px 12px',
                                    fontFamily: F, fontSize: 13, color: TEXT,
                                    lineHeight: 1.55,
                                    transition: 'border-color 0.2s, box-shadow 0.2s',
                                }}
                            />
                            {touched.mensaje && errMensaje && <FieldError msg={errMensaje} />}
                        </div>

                        {/* Botón enviar */}
                        <button
                            onClick={handleSend}
                            disabled={sending}
                            style={{
                                width: '100%', height: 46, borderRadius: 12, border: 'none',
                                background: canSend
                                    ? `linear-gradient(135deg, ${PINK}, ${LILAC})`
                                    : 'rgba(255,255,255,0.07)',
                                color: canSend ? 'white' : TEXT_SUB,
                                fontFamily: F, fontSize: 14, fontWeight: 700,
                                cursor: canSend ? 'pointer' : 'not-allowed',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                boxShadow: canSend ? '0 4px 16px rgba(236,72,153,0.28)' : 'none',
                                transition: 'all 0.2s',
                            }}
                        >
                            {sending ? (
                                <>
                                    <svg style={{ animation: 'spin 0.8s linear infinite', width: 15, height: 15 }} viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                                        <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                                    </svg>
                                    Enviando…
                                </>
                            ) : (
                                <><Send size={14} /> Enviar mensaje</>
                            )}
                        </button>

                        {/* Hint de campos faltantes */}
                        {(!canSend && (touched.nombre || touched.mensaje)) && (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 10, padding: '8px 12px', borderRadius: 8, backgroundColor: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)' }}>
                                <AlertCircle size={13} color={AMBER} style={{ flexShrink: 0, marginTop: 1 }} />
                                <p style={{ fontFamily: F, fontSize: 11, color: AMBER, margin: 0, lineHeight: 1.4 }}>
                                    {!motivo ? 'Elige un motivo. ' : ''}{errNombre ? errNombre + ' ' : ''}{errMensaje || ''}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* WhatsApp */}
                <div style={{ backgroundColor: CARD, borderRadius: 16, border: '1px solid rgba(37,211,102,0.2)', boxShadow: SHADOW, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, backgroundColor: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Phone size={15} color="#25D366" />
                            </div>
                            <div>
                                <p style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: TEXT, margin: '0 0 2px' }}>¿Prefieres WhatsApp?</p>
                                <p style={{ fontFamily: F, fontSize: 12, color: TEXT_MID, margin: 0, lineHeight: 1.4 }}>Respuesta más rápida directamente con el equipo.</p>
                            </div>
                        </div>
                        <a
                            href={`https://wa.me/584140000000?text=Hola%2C%20tengo%20un%20problema%20con%20mi%20orden%20${codigoParam ? encodeURIComponent(codigoParam) : ''}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                backgroundColor: '#25D366', color: 'white', border: 'none',
                                borderRadius: 9, padding: '8px 14px', cursor: 'pointer',
                                fontFamily: F, fontSize: 12, fontWeight: 700,
                                textDecoration: 'none', flexShrink: 0,
                                boxShadow: '0 3px 10px rgba(37,211,102,0.22)',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <Phone size={12} /> Abrir chat
                        </a>
                    </div>
                </div>

                {/* FAQ */}
                <div style={{ backgroundColor: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: SHADOW, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 18px', borderBottom: `1px solid ${BORDER_W}`, display: 'flex', alignItems: 'center', gap: 7 }}>
                        <MessageCircle size={13} color={PINK} />
                        <span style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: TEXT }}>Preguntas frecuentes</span>
                    </div>
                    {[
                        { q: '¿Cuánto tarda en llegar mi paquete?', a: 'Depende de la empresa y la zona. Generalmente entre 1 y 3 días hábiles en la misma ciudad. Puedes ver el ETA en tu página de seguimiento.' },
                        { q: '¿Qué pasa si no estaba en casa?', a: 'El repartidor te contactará o dejará una nota. El paquete será reprogramado. Usa este formulario para coordinar un horario conveniente.' },
                        { q: '¿Cómo sé si mi paquete fue entregado?', a: 'Cuando el estado cambie a "Entregado" en tu seguimiento, el repartidor registró la entrega con foto y nombre del receptor.' },
                        { q: '¿En cuánto tiempo responden mi solicitud?', a: 'El equipo responde en 2–4 horas hábiles (Lun–Vie, 8am–6pm). Para urgencias usa el canal de WhatsApp.' },
                    ].map((faq, i) => (
                        <div key={i} style={{ borderBottom: i < 3 ? `1px solid ${BORDER_W}` : 'none' }}>
                            <button
                                className="sup-faq"
                                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                style={{
                                    width: '100%', padding: '13px 18px',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                                    transition: 'background 0.15s',
                                }}
                            >
                                <span style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: TEXT, textAlign: 'left' }}>{faq.q}</span>
                                <ChevronDown size={15} color={TEXT_SUB} style={{ flexShrink: 0, transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </button>
                            {openFaq === i && (
                                <div style={{ padding: '0 18px 12px' }}>
                                    <p style={{ fontFamily: F, fontSize: 13, color: TEXT_MID, margin: 0, lineHeight: 1.6 }}>{faq.a}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Tiempo de respuesta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 14px', borderRadius: 11, backgroundColor: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.16)' }}>
                    <Clock size={14} color={AMBER} style={{ flexShrink: 0 }} />
                    <p style={{ fontFamily: F, fontSize: 12, color: TEXT_MID, margin: 0, lineHeight: 1.4 }}>
                        <strong style={{ color: TEXT }}>Tiempo de respuesta:</strong>{' '}
                        2–4 horas hábiles · Lun–Vie 8am–6pm VET
                    </p>
                </div>

            </div>

            <Footer />
            <div style={{ height: 'env(safe-area-inset-bottom, 8px)' }} />
        </div>
    )
}

// ── FieldError ────────────────────────────────────────────────────────────────
function FieldError({ msg }: { msg: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
            <AlertCircle size={11} color={RED} style={{ flexShrink: 0 }} />
            <p style={{ fontFamily: 'inherit', fontSize: 11, color: RED, margin: 0 }}>{msg}</p>
        </div>
    )
}

// ── Shared ────────────────────────────────────────────────────────────────────
function Header({ onBack }: { onBack: () => void }) {
    return (
        <nav style={{
            backgroundColor: SURFACE, height: 52,
            display: 'flex', alignItems: 'center', padding: '0 16px', gap: 11,
            borderBottom: `1px solid ${BORDER_W}`,
            position: 'sticky', top: 0, zIndex: 100,
        }}>
            <button
                onClick={onBack}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: TEXT_MID, fontFamily: F, fontSize: 13, fontWeight: 600, padding: '5px 0', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = TEXT)}
                onMouseLeave={e => (e.currentTarget.style.color = TEXT_MID)}
            >
                <ArrowLeft size={15} /> Volver
            </button>
            <div style={{ width: 1, height: 20, backgroundColor: BORDER_W }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 25, height: 25, borderRadius: 7, background: `linear-gradient(135deg,${PINK},${LILAC})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(236,72,153,0.3)' }}>
                    <Zap size={11} color="white" fill="white" />
                </div>
                <span style={{ fontFamily: F, fontWeight: 800, fontSize: 13, background: `linear-gradient(135deg,${PINK},${LILAC})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    LogiPyme · Soporte
                </span>
            </div>
        </nav>
    )
}

function Footer() {
    return (
        <div style={{ borderTop: `1px solid ${BORDER_W}`, backgroundColor: SURFACE, padding: '11px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: F, fontSize: 10, color: TEXT_SUB }}>© 2026 VELVET KINETIC · PRECISION MICRO-LOGISTICS</span>
        </div>
    )
}