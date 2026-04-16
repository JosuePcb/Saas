import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ArrowLeft, Check, Truck, User, Package,
    Zap, Plus, X, GripVertical, ChevronDown,
    MapPin, Search, AlertTriangle
} from 'lucide-react'

const F = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

const PINK = '#EC4899'
const LILAC = '#D8B4FE'
const BLUE = '#38bdf8'
const GREEN = '#10b981'
const TEXT = '#f1f0ff'
const TEXT_SUB = 'rgba(200,190,255,0.5)'
const BORDER = 'rgba(255,255,255,0.07)'
const CARD = '#211119'
const INPUT_BG = 'rgba(255,255,255,0.06)'
const INPUT_BD = 'rgba(255,255,255,0.10)'

// ── Responsive hook ───────────────────────────────────────────────────────────
function useIsMobile() {
    const [v, setV] = useState(window.innerWidth < 768)
    useEffect(() => {
        const h = () => setV(window.innerWidth < 768)
        window.addEventListener('resize', h)
        return () => window.removeEventListener('resize', h)
    }, [])
    return v
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_CHOFERES = [
    { id: 'CHO-001', nombre: 'Luis Ramos', initials: 'LR', disponible: true, rutasHoy: 1 },
    { id: 'CHO-002', nombre: 'Pedro Méndez', initials: 'PM', disponible: true, rutasHoy: 0 },
    { id: 'CHO-003', nombre: 'Carlos Suárez', initials: 'CS', disponible: true, rutasHoy: 0 },
    { id: 'CHO-004', nombre: 'Ana Rodríguez', initials: 'AR', disponible: false, rutasHoy: 1 },
]

const MOCK_VEHICULOS = [
    { id: 'VEH-001', placa: 'ABC-1234', modelo: 'Toyota Hiace', capacidadKg: 1500, disponible: true },
    { id: 'VEH-002', placa: 'XYZ-5678', modelo: 'Mercedes Sprinter', capacidadKg: 2000, disponible: true },
    { id: 'VEH-003', placa: 'GHI-9012', modelo: 'Ford Transit', capacidadKg: 3500, disponible: false },
    { id: 'VEH-004', placa: 'JKL-3456', modelo: 'Isuzu NPR', capacidadKg: 4000, disponible: true },
]

const MOCK_ORDENES = [
    { id: 'ORD-001', tracking: 'TRK-1001', cliente: 'María González', direccion: 'Av. Libertador, Torre Norte Piso 3', zona: 'Altamira', pesoKg: 2.5 },
    { id: 'ORD-002', tracking: 'TRK-1002', cliente: 'José Martínez', direccion: 'CC Sambil Local 142, Nivel Feria', zona: 'Chacao', pesoKg: 0.8 },
    { id: 'ORD-003', tracking: 'TRK-1003', cliente: 'Ana Rodríguez', direccion: 'Calle Real de Chacao 88, Qta. La Rosa', zona: 'Chacao', pesoKg: 5.0 },
    { id: 'ORD-004', tracking: 'TRK-1004', cliente: 'Carlos Pérez', direccion: 'Los Palos Grandes, Av. Andrés Bello', zona: 'Los Palos Grandes', pesoKg: 1.2 },
    { id: 'ORD-005', tracking: 'TRK-1005', cliente: 'Elena Torres', direccion: 'El Rosal, Torre Financiera Piso 8', zona: 'El Rosal', pesoKg: 3.1 },
    { id: 'ORD-006', tracking: 'TRK-1006', cliente: 'Roberto Sánchez', direccion: 'Las Mercedes, C.C. Concresa Local 45', zona: 'Las Mercedes', pesoKg: 0.5 },
    { id: 'ORD-007', tracking: 'TRK-1007', cliente: 'Luisa Fernández', direccion: 'Av. Principal de La Florida, Edif. Centro', zona: 'La Florida', pesoKg: 7.0 },
    { id: 'ORD-008', tracking: 'TRK-1008', cliente: 'Miguel Herrera', direccion: 'Bello Campo, Calle 7 Qta. Milagros', zona: 'Bello Campo', pesoKg: 2.0 },
    { id: 'ORD-009', tracking: 'TRK-1009', cliente: 'Carmen López', direccion: 'Urb. El Cafetal, Av. Principal Casa 12', zona: 'El Cafetal', pesoKg: 4.5 },
    { id: 'ORD-010', tracking: 'TRK-1010', cliente: 'Diego Morales', direccion: 'La Candelaria, Esq. Reducto a Monjas', zona: 'La Candelaria', pesoKg: 1.8 },
]

// ── Validation ────────────────────────────────────────────────────────────────
function validate(form: { choferId: string; vehiculoId: string; ordenIds: string[] }) {
    const errs: Record<string, string> = {}
    if (!form.choferId) errs.chofer = 'Selecciona un chofer'
    if (!form.vehiculoId) errs.vehiculo = 'Selecciona un vehículo'
    if (form.ordenIds.length === 0) errs.ordenes = 'Agrega al menos una orden'
    if (form.ordenIds.length > 20) errs.ordenes = 'Máximo 20 órdenes por ruta'
    return errs
}

// ── DarkSelect ────────────────────────────────────────────────────────────────
function DarkSelect({ label, value, onChange, options, error, required = false, placeholder }: {
    label: string; value: string; onChange: (v: string) => void
    options: { value: string; label: string; disabled?: boolean }[]
    error?: string; required?: boolean; placeholder?: string
}) {
    const [focused, setFocused] = useState(false)
    return (
        <div>
            <label style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: TEXT_SUB, display: 'block', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {label} {required && <span style={{ color: PINK }}>*</span>}
            </label>
            <div style={{ position: 'relative' }}>
                <select value={value} onChange={e => onChange(e.target.value)}
                    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    style={{
                        width: '100%', height: 44, borderRadius: 10, boxSizing: 'border-box', appearance: 'none',
                        border: `1.5px solid ${error ? '#ef4444' : focused ? PINK : INPUT_BD}`,
                        backgroundColor: focused ? 'rgba(255,255,255,0.08)' : INPUT_BG,
                        padding: '0 36px 0 14px', fontFamily: F, fontSize: 14, color: value ? TEXT : TEXT_SUB,
                        outline: 'none', boxShadow: focused ? '0 0 0 3px rgba(236,72,153,0.12)' : 'none',
                        transition: 'all 0.15s', cursor: 'pointer',
                    }}>
                    {placeholder && <option value="" style={{ backgroundColor: '#211119', color: TEXT_SUB }}>{placeholder}</option>}
                    {options.map(o => (
                        <option key={o.value} value={o.value} disabled={o.disabled} style={{ backgroundColor: '#211119', color: o.disabled ? TEXT_SUB : TEXT }}>
                            {o.label}
                        </option>
                    ))}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: TEXT_SUB, pointerEvents: 'none' }} />
            </div>
            {error && <p style={{ fontFamily: F, fontSize: 11, color: '#ef4444', margin: '4px 0 0 2px' }}>{error}</p>}
        </div>
    )
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepBar({ current }: { current: number }) {
    const steps = [
        { label: 'Asignación', icon: <User size={15} /> },
        { label: 'Órdenes', icon: <Package size={15} /> },
        { label: 'Confirmar', icon: <Check size={15} /> },
    ]
    return (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
            {steps.map((s, i) => {
                const done = i < current
                const active = i === current
                return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                            <div style={{
                                width: active ? 42 : 34, height: active ? 42 : 34, borderRadius: '50%',
                                background: done || active ? 'linear-gradient(135deg,#EC4899,#D8B4FE)' : 'rgba(255,255,255,0.06)',
                                border: `1.5px solid ${done || active ? 'transparent' : BORDER}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: done || active ? 'white' : TEXT_SUB, transition: 'all 0.3s',
                                boxShadow: active ? '0 4px 16px rgba(236,72,153,0.4)' : 'none',
                                flexShrink: 0,
                            }}>
                                {done ? <Check size={15} strokeWidth={3} /> : s.icon}
                            </div>
                            <span style={{ fontFamily: F, fontSize: 11, fontWeight: active ? 700 : 500, color: active ? PINK : done ? LILAC : TEXT_SUB, whiteSpace: 'nowrap' }}>
                                {s.label}
                            </span>
                        </div>
                        {i < 2 && (
                            <div style={{ flex: 1, height: 1.5, margin: '0 8px', marginBottom: 22, backgroundColor: done ? PINK : BORDER, transition: 'all 0.3s' }} />
                        )}
                    </div>
                )
            })}
        </div>
    )
}

// ── Step 1: Chofer + Vehículo ─────────────────────────────────────────────────
function Step1({ choferId, vehiculoId, onChofer, onVehiculo, errors }: {
    choferId: string; vehiculoId: string
    onChofer: (v: string) => void; onVehiculo: (v: string) => void
    errors: Record<string, string>
}) {
    const isMobile = useIsMobile()
    const choferSel = MOCK_CHOFERES.find(c => c.id === choferId)
    const vehiculoSel = MOCK_VEHICULOS.find(v => v.id === vehiculoId)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
                <h2 style={{ fontFamily: F, fontSize: 20, fontWeight: 800, color: TEXT, margin: '0 0 4px' }}>Asignación</h2>
                <p style={{ fontFamily: F, fontSize: 14, color: TEXT_SUB, margin: 0 }}>Selecciona el chofer y vehículo para esta ruta</p>
            </div>

            {/* Choferes */}
            <div>
                <label style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: TEXT_SUB, display: 'block', marginBottom: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Chofer <span style={{ color: PINK }}>*</span>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {MOCK_CHOFERES.map(c => (
                        <button key={c.id} onClick={() => c.disponible && onChofer(c.id)} disabled={!c.disponible}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 14,
                                padding: '12px 16px', borderRadius: 12, textAlign: 'left',
                                border: `1.5px solid ${choferId === c.id ? PINK : BORDER}`,
                                backgroundColor: choferId === c.id ? 'rgba(236,72,153,0.08)' : c.disponible ? INPUT_BG : 'rgba(255,255,255,0.02)',
                                cursor: c.disponible ? 'pointer' : 'not-allowed',
                                opacity: c.disponible ? 1 : 0.45, transition: 'all 0.15s',
                            }}>
                            <div style={{
                                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                                background: c.disponible ? 'linear-gradient(135deg,#EC4899,#D8B4FE)' : 'rgba(255,255,255,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontSize: 12, fontWeight: 800, fontFamily: F,
                            }}>{c.initials}</div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>{c.nombre}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: c.disponible ? GREEN : '#ef4444', display: 'inline-block' }} />
                                    <span style={{ fontFamily: F, fontSize: 12, color: TEXT_SUB }}>
                                        {c.disponible ? `Disponible · ${c.rutasHoy} ruta${c.rutasHoy !== 1 ? 's' : ''} hoy` : 'No disponible'}
                                    </span>
                                </div>
                            </div>
                            {choferId === c.id && (
                                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#EC4899,#D8B4FE)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Check size={11} color="white" strokeWidth={3} />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
                {errors.chofer && <p style={{ fontFamily: F, fontSize: 11, color: '#ef4444', margin: '6px 0 0 2px' }}>{errors.chofer}</p>}
            </div>

            {/* Vehículos */}
            <div>
                <label style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: TEXT_SUB, display: 'block', marginBottom: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Vehículo <span style={{ color: PINK }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
                    {MOCK_VEHICULOS.map(v => (
                        <button key={v.id} onClick={() => v.disponible && onVehiculo(v.id)} disabled={!v.disponible}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '12px 14px', borderRadius: 12, textAlign: 'left',
                                border: `1.5px solid ${vehiculoId === v.id ? PINK : BORDER}`,
                                backgroundColor: vehiculoId === v.id ? 'rgba(236,72,153,0.08)' : v.disponible ? INPUT_BG : 'rgba(255,255,255,0.02)',
                                cursor: v.disponible ? 'pointer' : 'not-allowed',
                                opacity: v.disponible ? 1 : 0.45, transition: 'all 0.15s',
                            }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                backgroundColor: vehiculoId === v.id ? 'rgba(236,72,153,0.15)' : 'rgba(255,255,255,0.06)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Truck size={16} color={vehiculoId === v.id ? PINK : TEXT_SUB} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: vehiculoId === v.id ? PINK : TEXT, margin: '0 0 2px', letterSpacing: '0.06em' }}>{v.placa}</p>
                                <p style={{ fontFamily: F, fontSize: 12, color: TEXT_SUB, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.modelo}</p>
                                <p style={{ fontFamily: F, fontSize: 11, color: 'rgba(200,190,255,0.35)', margin: 0 }}>{v.capacidadKg.toLocaleString()} kg</p>
                            </div>
                            {!v.disponible && <span style={{ fontFamily: F, fontSize: 10, color: '#ef4444', fontWeight: 700, flexShrink: 0 }}>En ruta</span>}
                        </button>
                    ))}
                </div>
                {errors.vehiculo && <p style={{ fontFamily: F, fontSize: 11, color: '#ef4444', margin: '6px 0 0 2px' }}>{errors.vehiculo}</p>}
            </div>
        </div>
    )
}

// ── Step 2: Seleccionar órdenes ───────────────────────────────────────────────
function Step2({ ordenIds, onToggle, errors }: {
    ordenIds: string[]; onToggle: (id: string) => void; errors: Record<string, string>
}) {
    const [search, setSearch] = useState('')
    const vehiculoSel = null // TODO conectar con vehículo seleccionado para validar capacidad

    const filtered = MOCK_ORDENES.filter(o => {
        const q = search.toLowerCase()
        return !q || o.tracking.toLowerCase().includes(q) || o.cliente.toLowerCase().includes(q) || o.zona.toLowerCase().includes(q)
    })

    const pesoTotal = ordenIds.reduce((acc, id) => {
        const o = MOCK_ORDENES.find(o => o.id === id)
        return acc + (o?.pesoKg ?? 0)
    }, 0)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
                <h2 style={{ fontFamily: F, fontSize: 20, fontWeight: 800, color: TEXT, margin: '0 0 4px' }}>Órdenes</h2>
                <p style={{ fontFamily: F, fontSize: 14, color: TEXT_SUB, margin: 0 }}>Selecciona las órdenes pendientes para esta ruta</p>
            </div>

            {/* Summary bar */}
            <div style={{ display: 'flex', gap: 16, padding: '12px 16px', borderRadius: 12, backgroundColor: CARD, border: `1px solid ${BORDER}`, flexWrap: 'wrap' }}>
                <div>
                    <p style={{ fontFamily: F, fontSize: 10, color: TEXT_SUB, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Seleccionadas</p>
                    <p style={{ fontFamily: MONO, fontSize: 18, fontWeight: 800, color: ordenIds.length > 0 ? PINK : TEXT_SUB, margin: 0 }}>{ordenIds.length}<span style={{ fontSize: 12, color: TEXT_SUB }}>/20</span></p>
                </div>
                <div style={{ width: 1, backgroundColor: BORDER }} />
                <div>
                    <p style={{ fontFamily: F, fontSize: 10, color: TEXT_SUB, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Peso total</p>
                    <p style={{ fontFamily: MONO, fontSize: 18, fontWeight: 800, color: TEXT, margin: 0 }}>{pesoTotal.toFixed(1)}<span style={{ fontSize: 12, color: TEXT_SUB }}> kg</span></p>
                </div>
                <div style={{ width: 1, backgroundColor: BORDER }} />
                <div>
                    <p style={{ fontFamily: F, fontSize: 10, color: TEXT_SUB, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Disponibles</p>
                    <p style={{ fontFamily: MONO, fontSize: 18, fontWeight: 800, color: TEXT, margin: 0 }}>{MOCK_ORDENES.length}</p>
                </div>
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: TEXT_SUB }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por tracking, cliente o zona..."
                    style={{
                        width: '100%', height: 40, borderRadius: 10, boxSizing: 'border-box',
                        border: `1.5px solid ${BORDER}`, backgroundColor: INPUT_BG,
                        padding: '0 14px 0 36px', fontFamily: F, fontSize: 13, color: TEXT, outline: 'none',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(236,72,153,0.12)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = 'none' }}
                />
            </div>

            {/* Orders list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 340, overflowY: 'auto' }} className="scrollbar-hide">
                {filtered.length === 0 ? (
                    <p style={{ fontFamily: F, fontSize: 13, color: TEXT_SUB, textAlign: 'center', padding: '24px 0' }}>Sin órdenes que coincidan</p>
                ) : filtered.map(o => {
                    const selected = ordenIds.includes(o.id)
                    const disabled = !selected && ordenIds.length >= 20
                    return (
                        <button key={o.id} onClick={() => !disabled && onToggle(o.id)} disabled={disabled}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '10px 14px', borderRadius: 10, textAlign: 'left',
                                border: `1.5px solid ${selected ? PINK : BORDER}`,
                                backgroundColor: selected ? 'rgba(236,72,153,0.07)' : INPUT_BG,
                                cursor: disabled ? 'not-allowed' : 'pointer',
                                opacity: disabled ? 0.4 : 1, transition: 'all 0.15s',
                            }}>
                            {/* Checkbox */}
                            <div style={{
                                width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                                border: `1.5px solid ${selected ? PINK : BORDER}`,
                                backgroundColor: selected ? PINK : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.15s',
                            }}>
                                {selected && <Check size={11} color="white" strokeWidth={3} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: selected ? PINK : TEXT_SUB, letterSpacing: '0.04em' }}>{o.tracking}</span>
                                    <span style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: TEXT }}>{o.cliente}</span>
                                </div>
                                <p style={{ fontFamily: F, fontSize: 12, color: TEXT_SUB, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {o.direccion}
                                </p>
                            </div>
                            <div style={{ flexShrink: 0, textAlign: 'right' }}>
                                <p style={{ fontFamily: MONO, fontSize: 11, color: TEXT_SUB, margin: 0 }}>{o.pesoKg} kg</p>
                                <p style={{ fontFamily: F, fontSize: 10, color: 'rgba(200,190,255,0.35)', margin: '2px 0 0' }}>{o.zona}</p>
                            </div>
                        </button>
                    )
                })}
            </div>

            {errors.ordenes && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <AlertTriangle size={14} color="#ef4444" />
                    <p style={{ fontFamily: F, fontSize: 12, color: '#ef4444', margin: 0 }}>{errors.ordenes}</p>
                </div>
            )}
        </div>
    )
}

// ── Step 3: Confirmar ─────────────────────────────────────────────────────────
function Step3({ choferId, vehiculoId, ordenIds, optimizing, onOptimize }: {
    choferId: string; vehiculoId: string; ordenIds: string[]
    optimizing: boolean; onOptimize: () => void
}) {
    const chofer = MOCK_CHOFERES.find(c => c.id === choferId)
    const vehiculo = MOCK_VEHICULOS.find(v => v.id === vehiculoId)
    const ordenes = MOCK_ORDENES.filter(o => ordenIds.includes(o.id))
    const pesoTotal = ordenes.reduce((acc, o) => acc + o.pesoKg, 0)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
                <h2 style={{ fontFamily: F, fontSize: 20, fontWeight: 800, color: TEXT, margin: '0 0 4px' }}>Confirmar ruta</h2>
                <p style={{ fontFamily: F, fontSize: 14, color: TEXT_SUB, margin: 0 }}>Revisa los datos antes de crear la ruta</p>
            </div>

            {/* Resumen */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
                {/* Chofer */}
                <div style={{ padding: '14px 16px', borderRadius: 12, backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
                    <p style={{ fontFamily: F, fontSize: 10, color: TEXT_SUB, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Chofer</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#EC4899,#D8B4FE)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 800, fontFamily: F, flexShrink: 0 }}>
                            {chofer?.initials}
                        </div>
                        <p style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>{chofer?.nombre}</p>
                    </div>
                </div>

                {/* Vehículo */}
                <div style={{ padding: '14px 16px', borderRadius: 12, backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
                    <p style={{ fontFamily: F, fontSize: 10, color: TEXT_SUB, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Vehículo</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Truck size={15} color={PINK} />
                        </div>
                        <div>
                            <p style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: PINK, margin: 0, letterSpacing: '0.06em' }}>{vehiculo?.placa}</p>
                            <p style={{ fontFamily: F, fontSize: 11, color: TEXT_SUB, margin: 0 }}>{vehiculo?.modelo}</p>
                        </div>
                    </div>
                </div>

                {/* Paradas */}
                <div style={{ padding: '14px 16px', borderRadius: 12, backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
                    <p style={{ fontFamily: F, fontSize: 10, color: TEXT_SUB, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Paradas</p>
                    <p style={{ fontFamily: MONO, fontSize: 24, fontWeight: 900, color: PINK, margin: '0 0 2px', lineHeight: 1 }}>{ordenes.length}</p>
                    <p style={{ fontFamily: F, fontSize: 11, color: TEXT_SUB, margin: 0 }}>{pesoTotal.toFixed(1)} kg total</p>
                </div>
            </div>

            {/* Lista de paradas */}
            <div style={{ backgroundColor: CARD, borderRadius: 12, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}` }}>
                    <p style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: TEXT_SUB, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Orden de paradas
                    </p>
                </div>
                <div style={{ maxHeight: 240, overflowY: 'auto' }} className="scrollbar-hide">
                    {ordenes.map((o, i) => (
                        <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < ordenes.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: 'rgba(236,72,153,0.1)', border: `1px solid rgba(236,72,153,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 800, color: PINK }}>{i + 1}</span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontFamily: MONO, fontSize: 11, color: TEXT_SUB }}>{o.tracking}</span>
                                    <span style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: TEXT }}>{o.cliente}</span>
                                </div>
                                <p style={{ fontFamily: F, fontSize: 11, color: TEXT_SUB, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.direccion}</p>
                            </div>
                            <span style={{ fontFamily: MONO, fontSize: 11, color: TEXT_SUB, flexShrink: 0 }}>{o.pesoKg} kg</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Optimizar con IA */}
            <button onClick={onOptimize} disabled={optimizing} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                height: 46, borderRadius: 12, cursor: optimizing ? 'not-allowed' : 'pointer',
                border: `1.5px solid ${optimizing ? 'rgba(216,180,254,0.3)' : LILAC}`,
                backgroundColor: optimizing ? 'rgba(216,180,254,0.05)' : 'rgba(216,180,254,0.06)',
                color: optimizing ? 'rgba(216,180,254,0.4)' : LILAC,
                fontFamily: F, fontSize: 14, fontWeight: 700, transition: 'all 0.2s',
            }}>
                {optimizing
                    ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Optimizando orden de paradas...</>
                    : <><Zap size={15} />Optimizar orden con IA</>
                }
            </button>

            <div style={{ padding: '10px 14px', borderRadius: 10, backgroundColor: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)' }}>
                <p style={{ fontFamily: F, fontSize: 12, color: 'rgba(56,189,248,0.8)', margin: 0, lineHeight: 1.5 }}>
                    La IA reordenará las paradas para minimizar distancia y tiempo. Puedes crear la ruta sin optimizar y hacerlo después.
                </p>
            </div>
        </div>
    )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function NewRoutePage() {
    const navigate = useNavigate()
    const isMobile = useIsMobile()
    const [step, setStep] = useState(0)
    const [choferId, setChoferId] = useState('')
    const [vehiculoId, setVehiculoId] = useState('')
    const [ordenIds, setOrdenIds] = useState<string[]>([])
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [optimizing, setOptimizing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [done, setDone] = useState(false)
    const [visible, setVisible] = useState(false)

    useEffect(() => { setTimeout(() => setVisible(true), 50) }, [])

    const toggleOrden = (id: string) => {
        setOrdenIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
        setErrors(e => ({ ...e, ordenes: '' }))
    }

    const handleNext = () => {
        const errs: Record<string, string> = {}
        if (step === 0) {
            if (!choferId) errs.chofer = 'Selecciona un chofer'
            if (!vehiculoId) errs.vehiculo = 'Selecciona un vehículo'
        }
        if (step === 1) {
            if (ordenIds.length === 0) errs.ordenes = 'Agrega al menos una orden'
            if (ordenIds.length > 20) errs.ordenes = 'Máximo 20 órdenes por ruta'
        }
        if (Object.keys(errs).length > 0) { setErrors(errs); return }
        setErrors({})
        setStep(s => s + 1)
    }

    const handleOptimize = async () => {
        setOptimizing(true)
        // TODO: POST /api/logistics/routes/optimize con ordenIds
        await new Promise(r => setTimeout(r, 2000))
        setOptimizing(false)
    }

    const handleCreate = async () => {
        setSaving(true)
        // TODO: POST /api/logistics/routes con { choferId, vehiculoId, ordenIds }
        await new Promise(r => setTimeout(r, 1400))
        setSaving(false)
        setDone(true)
        setTimeout(() => navigate('/app/routes'), 1800)
    }

    if (done) return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#EC4899,#D8B4FE)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 12px 40px rgba(236,72,153,0.45)', animation: 'pop 0.4s cubic-bezier(0.175,0.885,0.32,1.275)' }}>
                    <Check size={32} color="white" strokeWidth={3} />
                </div>
                <p style={{ fontFamily: F, fontSize: 22, fontWeight: 900, color: TEXT, margin: '0 0 6px' }}>¡Ruta creada!</p>
                <p style={{ fontFamily: F, fontSize: 14, color: TEXT_SUB, margin: 0 }}>Redirigiendo a rutas...</p>
                <style>{`@keyframes pop{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
            </div>
        </div>
    )

    return (
        <div style={{ fontFamily: F, maxWidth: 700, margin: '0 auto', opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(8px)', transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)' }}>

            {/* Back */}
            <button onClick={() => navigate('/app/routes')} style={{
                display: 'flex', alignItems: 'center', gap: 7, marginBottom: 24,
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: F, fontSize: 14, color: TEXT_SUB, padding: 0, transition: 'color 0.15s',
            }}
                onMouseEnter={e => (e.currentTarget.style.color = TEXT)}
                onMouseLeave={e => (e.currentTarget.style.color = TEXT_SUB)}
            >
                <ArrowLeft size={16} /> Volver a rutas
            </button>

            {/* Card */}
            <div style={{
                backgroundColor: CARD, borderRadius: 20,
                border: `1px solid ${BORDER}`,
                boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
                padding: 'clamp(20px,5vw,32px)',
                position: 'relative', overflow: 'hidden',
            }}>
                {/* Deco */}
                <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(236,72,153,0.08),transparent 70%)', pointerEvents: 'none' }} />

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,#EC4899,#D8B4FE)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(236,72,153,0.35)', flexShrink: 0 }}>
                        <MapPin size={17} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontFamily: F, fontSize: 'clamp(17px,3vw,20px)', fontWeight: 900, color: TEXT, margin: 0, letterSpacing: '-0.01em' }}>Nueva ruta</h1>
                        <p style={{ fontFamily: F, fontSize: 12, color: TEXT_SUB, margin: 0 }}>Paso {step + 1} de 3</p>
                    </div>
                </div>

                <StepBar current={step} />

                {/* Content */}
                <div style={{ minHeight: 320 }}>
                    {step === 0 && <Step1 choferId={choferId} vehiculoId={vehiculoId} onChofer={v => { setChoferId(v); setErrors(e => ({ ...e, chofer: '' })) }} onVehiculo={v => { setVehiculoId(v); setErrors(e => ({ ...e, vehiculo: '' })) }} errors={errors} />}
                    {step === 1 && <Step2 ordenIds={ordenIds} onToggle={toggleOrden} errors={errors} />}
                    {step === 2 && <Step3 choferId={choferId} vehiculoId={vehiculoId} ordenIds={ordenIds} optimizing={optimizing} onOptimize={handleOptimize} />}
                </div>

                {/* Nav buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, paddingTop: 20, borderTop: `1px solid ${BORDER}` }}>
                    <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/app/routes')} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '11px 20px', borderRadius: 11,
                        border: `1.5px solid ${BORDER}`, backgroundColor: 'rgba(255,255,255,0.03)',
                        color: TEXT_SUB, fontFamily: F, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                    }}
                        onMouseEnter={e => { (e.currentTarget.style.borderColor = PINK); (e.currentTarget.style.color = PINK) }}
                        onMouseLeave={e => { (e.currentTarget.style.borderColor = BORDER); (e.currentTarget.style.color = TEXT_SUB) }}
                    >
                        <ArrowLeft size={15} />{step === 0 ? 'Cancelar' : 'Anterior'}
                    </button>

                    {/* Dots */}
                    <div style={{ display: 'flex', gap: 6 }}>
                        {[0, 1, 2].map(i => (
                            <div key={i} style={{ width: i === step ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === step ? PINK : i < step ? LILAC : 'rgba(255,255,255,0.12)', transition: 'all 0.3s' }} />
                        ))}
                    </div>

                    {step < 2 ? (
                        <button onClick={handleNext} style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '11px 22px', borderRadius: 11,
                            background: 'linear-gradient(135deg,#EC4899,#D8B4FE)', border: 'none', color: 'white',
                            fontFamily: F, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                            boxShadow: '0 4px 16px rgba(236,72,153,0.35)', transition: 'all 0.15s',
                        }}>
                            Siguiente <ArrowLeft size={15} style={{ transform: 'rotate(180deg)' }} />
                        </button>
                    ) : (
                        <button onClick={handleCreate} disabled={saving} style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 11,
                            background: saving ? 'rgba(236,72,153,0.4)' : 'linear-gradient(135deg,#EC4899,#D8B4FE)',
                            border: 'none', color: 'white', fontFamily: F, fontSize: 14, fontWeight: 700,
                            cursor: saving ? 'not-allowed' : 'pointer',
                            boxShadow: saving ? 'none' : '0 4px 16px rgba(236,72,153,0.35)',
                        }}>
                            {saving
                                ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Creando...</>
                                : <><Check size={15} strokeWidth={3} />Crear ruta</>
                            }
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}