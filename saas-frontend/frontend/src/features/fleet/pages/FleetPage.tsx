import { useState } from 'react'
import {
    Plus, MoreVertical, Truck, X, Check,
    MapPin, Wrench, BarChart2, Search, ChevronDown, Package
} from 'lucide-react'
import { VehicleStatus } from '@/types/enums'

const F = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

const BG_CARD = '#211119'
const BORDER = 'rgba(255,255,255,0.07)'
const PINK = '#EC4899'
const TEXT = '#f1f0ff'
const TEXT_SUB = 'rgba(200,190,255,0.55)'
const INPUT_BG = 'rgba(255,255,255,0.06)'
const INPUT_BD = 'rgba(255,255,255,0.10)'

const MOCK_VEHICLES = [
    { id: '1', placa: 'ABC-1234', marca: 'Toyota', modelo: 'Hiace', anio: 2023, color: 'Blanco', estado: VehicleStatus.DISPONIBLE, pesoKg: 1500, volumenM3: 12, chofer: 'Luis Ramos', choferId: 'CHO-0042' },
    { id: '2', placa: 'XYZ-5678', marca: 'Mercedes', modelo: 'Sprinter', anio: 2022, color: 'Gris', estado: VehicleStatus.EN_RUTA, pesoKg: 2000, volumenM3: 15, chofer: 'Pedro Méndez', choferId: 'CHO-0018' },
    { id: '3', placa: 'GHI-9012', marca: 'Ford', modelo: 'Transit', anio: 2021, color: 'Azul', estado: VehicleStatus.MANTENIMIENTO, pesoKg: 3500, volumenM3: 20, chofer: 'Carlos Suárez', choferId: 'CHO-0031' },
    { id: '4', placa: 'JKL-3456', marca: 'Isuzu', modelo: 'NPR', anio: 2023, color: 'Blanco', estado: VehicleStatus.DISPONIBLE, pesoKg: 4000, volumenM3: 22, chofer: null, choferId: null },
    { id: '5', placa: 'MNO-7890', marca: 'Hino', modelo: '300 Series', anio: 2022, color: 'Plata', estado: VehicleStatus.EN_RUTA, pesoKg: 1500, volumenM3: 10, chofer: 'Ana Rodríguez', choferId: 'CHO-0027' },
    { id: '6', placa: 'PQR-1122', marca: 'VW', modelo: 'Crafter', anio: 2021, color: 'Negro', estado: VehicleStatus.DISPONIBLE, pesoKg: 2500, volumenM3: 18, chofer: null, choferId: null },
]

const MOCK_CHOFERES = [
    { id: 'CHO-0042', nombre: 'Luis Ramos' },
    { id: 'CHO-0018', nombre: 'Pedro Méndez' },
    { id: 'CHO-0031', nombre: 'Carlos Suárez' },
    { id: 'CHO-0027', nombre: 'Ana Rodríguez' },
]

type Vehicle = typeof MOCK_VEHICLES[0]
type FilterType = 'TODOS' | VehicleStatus

const EMPTY_FORM = { placa: '', marca: '', modelo: '', anio: '', color: '', estado: VehicleStatus.DISPONIBLE, pesoKg: '', volumenM3: '', choferId: '' }

const STATUS_CFG = {
    [VehicleStatus.DISPONIBLE]: { label: 'Disponible', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', icon: <Check size={11} strokeWidth={3} />, accent: '#10b981' },
    [VehicleStatus.EN_RUTA]: { label: 'En Ruta', color: PINK, bg: 'rgba(236,72,153,0.1)', border: 'rgba(236,72,153,0.25)', icon: <MapPin size={11} />, accent: PINK },
    [VehicleStatus.MANTENIMIENTO]: { label: 'Mantenimiento', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', icon: <Wrench size={11} />, accent: '#f59e0b' },
}

function validateForm(f: typeof EMPTY_FORM) {
    const errs: Record<string, string> = {}
    const placa = f.placa.trim().toUpperCase()
    if (!placa) errs.placa = 'La placa es requerida'
    else if (!/^[A-Z0-9]{2,4}-\d{3,4}$/.test(placa)) errs.placa = 'Formato inválido. Ej: ABC-1234'
    if (!f.marca.trim()) errs.marca = 'La marca es requerida'
    if (!f.modelo.trim()) errs.modelo = 'El modelo es requerido'
    const anio = Number(f.anio)
    if (!f.anio) errs.anio = 'El año es requerido'
    else if (isNaN(anio) || anio < 1990 || anio > new Date().getFullYear() + 1) errs.anio = 'Año inválido'
    if (f.pesoKg && (isNaN(Number(f.pesoKg)) || Number(f.pesoKg) <= 0)) errs.pesoKg = 'Debe ser mayor a 0'
    if (f.volumenM3 && (isNaN(Number(f.volumenM3)) || Number(f.volumenM3) <= 0)) errs.volumenM3 = 'Debe ser mayor a 0'
    return errs
}

// ── DarkInput ─────────────────────────────────────────────────────────────────
function DarkInput({ label, value, onChange, placeholder = '', error, hint, required = false, mono = false, maxLength }: {
    label: string; value: string; onChange: (v: string) => void
    placeholder?: string; error?: string; hint?: string; required?: boolean; mono?: boolean; maxLength?: number
}) {
    const [focused, setFocused] = useState(false)
    return (
        <div>
            <label style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: TEXT_SUB, display: 'block', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {label} {required && <span style={{ color: PINK }}>*</span>}
                {maxLength && <span style={{ fontWeight: 400, color: 'rgba(167,139,250,0.5)', marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>({value.length}/{maxLength})</span>}
            </label>
            <input
                value={value} onChange={e => onChange(e.target.value)}
                onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                placeholder={placeholder}
                maxLength={maxLength}
                style={{
                    width: '100%', height: 42, borderRadius: 10, boxSizing: 'border-box',
                    border: `1.5px solid ${error ? '#ef4444' : focused ? PINK : INPUT_BD}`,
                    backgroundColor: focused ? 'rgba(255,255,255,0.08)' : INPUT_BG,
                    padding: '0 14px', fontFamily: mono ? MONO : F, fontSize: 14, color: TEXT, outline: 'none',
                    boxShadow: focused ? `0 0 0 3px ${error ? 'rgba(239,68,68,0.15)' : 'rgba(236,72,153,0.12)'}` : 'none',
                    transition: 'all 0.15s',
                }}
            />
            {error && <p style={{ fontFamily: F, fontSize: 11, color: '#ef4444', margin: '4px 0 0 2px' }}>{error}</p>}
            {hint && !error && <p style={{ fontFamily: F, fontSize: 11, color: TEXT_SUB, margin: '4px 0 0 2px' }}>{hint}</p>}
        </div>
    )
}

function DarkSelect({ label, value, onChange, options, required = false }: {
    label: string; value: string; onChange: (v: string) => void
    options: { value: string; label: string }[]; required?: boolean
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
                        width: '100%', height: 42, borderRadius: 10, boxSizing: 'border-box', appearance: 'none',
                        border: `1.5px solid ${focused ? PINK : INPUT_BD}`,
                        backgroundColor: focused ? 'rgba(255,255,255,0.08)' : INPUT_BG,
                        padding: '0 36px 0 14px', fontFamily: F, fontSize: 14, color: TEXT, outline: 'none',
                        boxShadow: focused ? '0 0 0 3px rgba(236,72,153,0.12)' : 'none',
                        transition: 'all 0.15s', cursor: 'pointer',
                    }}>
                    {options.map(o => <option key={o.value} value={o.value} style={{ backgroundColor: '#211119' }}>{o.label}</option>)}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: TEXT_SUB, pointerEvents: 'none' }} />
            </div>
        </div>
    )
}

function Avatar({ name, size = 32 }: { name: string | null; size?: number }) {
    const initials = name ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?'
    return (
        <div style={{
            width: size, height: size, borderRadius: size * 0.3, flexShrink: 0,
            background: name ? 'linear-gradient(135deg,#EC4899,#D8B4FE)' : 'rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: size * 0.35, fontWeight: 800, fontFamily: F,
        }}>{initials}</div>
    )
}

// ── VehicleCard ───────────────────────────────────────────────────────────────
function VehicleCard({ v, onEdit, onDelete }: { v: Vehicle; onEdit: (v: Vehicle) => void; onDelete: (id: string) => void }) {
    const [menuOpen, setMenuOpen] = useState(false)
    const cfg = STATUS_CFG[v.estado]
    return (
        <div style={{ backgroundColor: BG_CARD, borderRadius: 16, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${cfg.accent}`, padding: '18px 20px', position: 'relative', transition: 'box-shadow 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                    <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, letterSpacing: '0.1em', color: v.estado === VehicleStatus.MANTENIMIENTO ? '#f59e0b' : PINK, marginBottom: 4 }}>{v.placa}</div>
                    <p style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>{v.marca} {v.modelo}</p>
                    <p style={{ fontFamily: F, fontSize: 12, color: TEXT_SUB, margin: '2px 0 0 0' }}>Año {v.anio} · {v.color}</p>
                </div>
                <div style={{ position: 'relative' }}>
                    <button onClick={() => setMenuOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: TEXT_SUB, borderRadius: 6, display: 'flex' }}>
                        <MoreVertical size={16} />
                    </button>
                    {menuOpen && (
                        <>
                            <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
                            <div style={{ position: 'absolute', right: 0, top: 28, zIndex: 20, backgroundColor: '#2d1520', border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden', minWidth: 140, boxShadow: '0 12px 32px rgba(0,0,0,0.5)' }}>
                                <button onClick={() => { onEdit(v); setMenuOpen(false) }} style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: TEXT, fontFamily: F, fontSize: 13, textAlign: 'left', cursor: 'pointer' }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>✏️ Editar</button>
                                <button onClick={() => { onDelete(v.id); setMenuOpen(false) }} style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: '#ef4444', fontFamily: F, fontSize: 13, textAlign: 'left', cursor: 'pointer' }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)')}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>🗑️ Eliminar</button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, border: `1px solid ${cfg.border}`, backgroundColor: cfg.bg, color: cfg.color, fontFamily: F, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {cfg.icon}{cfg.label}
                </span>
                {v.pesoKg > 0 && <span style={{ padding: '4px 10px', borderRadius: 20, border: `1px solid ${BORDER}`, backgroundColor: 'rgba(255,255,255,0.04)', color: TEXT_SUB, fontFamily: MONO, fontSize: 10, fontWeight: 700 }}>{v.pesoKg.toLocaleString()}kg</span>}
                {v.volumenM3 > 0 && <span style={{ padding: '4px 10px', borderRadius: 20, border: `1px solid ${BORDER}`, backgroundColor: 'rgba(255,255,255,0.04)', color: TEXT_SUB, fontFamily: MONO, fontSize: 10, fontWeight: 700 }}>{v.volumenM3}m³</span>}
            </div>

            <div style={{ paddingTop: 12, borderTop: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={v.chofer} size={30} />
                    <div>
                        <p style={{ fontFamily: F, fontSize: 10, color: TEXT_SUB, margin: 0 }}>Chofer asignado</p>
                        <p style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: v.chofer ? TEXT : TEXT_SUB, margin: 0 }}>{v.chofer ?? 'Sin asignar'}</p>
                    </div>
                </div>
                {v.estado === VehicleStatus.EN_RUTA && <MapPin size={16} color={PINK} />}
                {v.estado === VehicleStatus.MANTENIMIENTO && <Wrench size={16} color="#f59e0b" />}
                {v.estado === VehicleStatus.DISPONIBLE && <BarChart2 size={16} color={TEXT_SUB} />}
            </div>
        </div>
    )
}

// ── VehicleSheet ──────────────────────────────────────────────────────────────
// REGLA: todos los useState PRIMERO, guard DESPUÉS
function VehicleSheet({ vehicle, onClose, onSave }: { vehicle: Vehicle | 'new' | null; onClose: () => void; onSave: (data: any) => void }) {
    // ✅ Hooks siempre primero
    const [formEdits, setFormEdits] = useState<Partial<typeof EMPTY_FORM>>({})
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)
    const [prevVehicle, setPrevVehicle] = useState<Vehicle | 'new' | null>(null)

    if (vehicle !== prevVehicle) {
        setPrevVehicle(vehicle)
        setFormEdits({})
        setErrors({})
    }

    // ✅ Guard después de hooks
    if (!vehicle) return null

    const isNew = vehicle === 'new'
    const v = isNew ? null : vehicle as Vehicle

    // Leer valores: si es edición, leer del vehículo; si es nuevo, del estado local
    const get = (key: keyof typeof EMPTY_FORM): string => {
        if (formEdits[key] !== undefined) return formEdits[key] as string
        if (isNew) return EMPTY_FORM[key] as string
        if (key === 'anio') return String(v?.anio ?? '')
        if (key === 'pesoKg') return String(v?.pesoKg ?? '')
        if (key === 'volumenM3') return String(v?.volumenM3 ?? '')
        if (key === 'choferId') return v?.choferId ?? ''
        if (key === 'estado') return v?.estado ?? VehicleStatus.DISPONIBLE
        return (v as any)?.[key] ?? ''
    }

    const set = (k: string, val: string) => {
        setFormEdits(f => ({ ...f, [k]: val }))
        setErrors(e => ({ ...e, [k]: '' }))
    }

    const buildPayload = () => isNew ? { ...EMPTY_FORM, ...formEdits } : {
        placa: v?.placa ?? '', marca: v?.marca ?? '', modelo: v?.modelo ?? '',
        anio: String(v?.anio ?? ''), color: v?.color ?? '',
        estado: v?.estado ?? VehicleStatus.DISPONIBLE,
        pesoKg: String(v?.pesoKg ?? ''), volumenM3: String(v?.volumenM3 ?? ''),
        choferId: v?.choferId ?? '',
        ...formEdits,  // aplica solo los campos editados en modo edición
    }

    const handleSave = async () => {
        const payload = buildPayload()
        const errs = validateForm(payload as any)
        if (Object.keys(errs).length > 0) { setErrors(errs); return }
        setSaving(true)
        await new Promise(r => setTimeout(r, 800))
        onSave(payload)
        setSaving(false)
        setFormEdits({})
    }

    return (
        <>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 40, backdropFilter: 'blur(2px)' }} />
            <div style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: 'min(420px, 100vw)',  // ✅ responsive
                backgroundColor: '#1c0f16',
                borderLeft: `1px solid rgba(236,72,153,0.2)`,
                zIndex: 50, overflowY: 'auto',
                padding: 'clamp(16px, 5vw, 28px)',
                boxShadow: '-20px 0 60px rgba(0,0,0,0.6)',
                display: 'flex', flexDirection: 'column', gap: 18,
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#EC4899,#D8B4FE)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Truck size={16} color="white" />
                        </div>
                        <div>
                            <h3 style={{ fontFamily: F, fontSize: 16, fontWeight: 800, color: TEXT, margin: 0 }}>{isNew ? 'Nuevo Vehículo' : 'Editar Vehículo'}</h3>
                            <p style={{ fontFamily: F, fontSize: 12, color: TEXT_SUB, margin: 0 }}>{isNew ? 'Completa los datos' : v?.placa}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SUB, display: 'flex', borderRadius: 8, padding: 4, flexShrink: 0 }}>
                        <X size={18} />
                    </button>
                </div>

                <div style={{ height: 1, backgroundColor: BORDER }} />

                <DarkInput label="Placa" value={get('placa')} onChange={v => set('placa', v.replace(/[^A-Za-z0-9-]/g, '').toUpperCase().slice(0, 8))} placeholder="ABC-1234" error={errors.placa} required mono hint="Formato: letras-números (ej: ABC-1234)" maxLength={8} />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14 }}>
                    <DarkInput label="Marca" value={get('marca')} onChange={v => set('marca', v.replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ0-9\s]/g, '').slice(0, 20))} placeholder="Toyota" error={errors.marca} required maxLength={20} />
                    <DarkInput label="Modelo" value={get('modelo')} onChange={v => set('modelo', v.replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ0-9\s]/g, '').slice(0, 20))} placeholder="Hiace" error={errors.modelo} required maxLength={20} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14 }}>
                    <DarkInput label="Año" value={get('anio')} onChange={v => set('anio', v.replace(/\D/g, '').slice(0, 4))} placeholder="2023" error={errors.anio} required />
                    <DarkInput label="Color" value={get('color')} onChange={v => set('color', v.replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]/g, '').slice(0, 15))} placeholder="Blanco" maxLength={15} />
                </div>

                <DarkSelect label="Estado" value={get('estado')} onChange={v => set('estado', v)} required options={[
                    { value: VehicleStatus.DISPONIBLE, label: '✅ Disponible' },
                    { value: VehicleStatus.EN_RUTA, label: '🚛 En Ruta' },
                    { value: VehicleStatus.MANTENIMIENTO, label: '🔧 Mantenimiento' },
                ]} />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14 }}>
                    <DarkInput label="Capacidad (kg)" value={get('pesoKg')} onChange={v => set('pesoKg', v.replace(/[^\d.]/g, '').slice(0, 7))} placeholder="1500" error={errors.pesoKg} hint="Opcional" maxLength={7} />
                    <DarkInput label="Capacidad (m³)" value={get('volumenM3')} onChange={v => set('volumenM3', v.replace(/[^\d.]/g, '').slice(0, 5))} placeholder="12" error={errors.volumenM3} hint="Opcional" maxLength={5} />
                </div>

                <DarkSelect label="Chofer asignado" value={get('choferId')} onChange={v => set('choferId', v)} options={[
                    { value: '', label: 'Sin asignar' },
                    ...MOCK_CHOFERES.map(c => ({ value: c.id, label: c.nombre }))
                ]} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
                    <button onClick={handleSave} disabled={saving} style={{
                        height: 46, borderRadius: 12, border: 'none',
                        background: saving ? 'rgba(236,72,153,0.4)' : 'linear-gradient(135deg,#EC4899,#D8B4FE)',
                        color: 'white', fontFamily: F, fontSize: 15, fontWeight: 700,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        boxShadow: saving ? 'none' : '0 4px 18px rgba(236,72,153,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                        {saving
                            ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                            : <Check size={16} strokeWidth={3} />}
                        {saving ? 'Guardando...' : isNew ? 'Agregar Vehículo' : 'Guardar Cambios'}
                    </button>
                    <button onClick={onClose} style={{
                        height: 42, borderRadius: 12, border: `1.5px solid ${BORDER}`,
                        backgroundColor: 'rgba(255,255,255,0.03)', color: TEXT_SUB,
                        fontFamily: F, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                    }}
                        onMouseEnter={e => { (e.currentTarget.style.borderColor = PINK); (e.currentTarget.style.color = TEXT) }}
                        onMouseLeave={e => { (e.currentTarget.style.borderColor = BORDER); (e.currentTarget.style.color = TEXT_SUB) }}
                    >Cancelar</button>
                </div>
            </div>
        </>
    )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function FleetPage() {
    const [vehicles, setVehicles] = useState(MOCK_VEHICLES)
    const [filter, setFilter] = useState<FilterType>('TODOS')
    const [search, setSearch] = useState('')
    const [sheet, setSheet] = useState<Vehicle | 'new' | null>(null)

    const filtered = vehicles.filter(v => {
        const matchFilter = filter === 'TODOS' || v.estado === filter
        const q = search.toLowerCase()
        const matchSearch = !q || v.placa.toLowerCase().includes(q) || v.marca.toLowerCase().includes(q) || v.modelo.toLowerCase().includes(q) || (v.chofer?.toLowerCase().includes(q) ?? false)
        return matchFilter && matchSearch
    })

    const counts = {
        total: vehicles.length,
        disponibles: vehicles.filter(v => v.estado === VehicleStatus.DISPONIBLE).length,
        enRuta: vehicles.filter(v => v.estado === VehicleStatus.EN_RUTA).length,
        mantenimiento: vehicles.filter(v => v.estado === VehicleStatus.MANTENIMIENTO).length,
    }

    const handleSave = (data: any) => {
        if (sheet === 'new') {
            setVehicles(prev => [...prev, {
                ...data, id: Date.now().toString(),
                anio: Number(data.anio), pesoKg: Number(data.pesoKg) || 0, volumenM3: Number(data.volumenM3) || 0,
                chofer: MOCK_CHOFERES.find(c => c.id === data.choferId)?.nombre ?? null,
            }])
        } else {
            setVehicles(prev => prev.map(v => v.id === (sheet as Vehicle).id ? {
                ...v, ...data,
                anio: Number(data.anio), pesoKg: Number(data.pesoKg) || 0, volumenM3: Number(data.volumenM3) || 0,
                chofer: MOCK_CHOFERES.find(c => c.id === data.choferId)?.nombre ?? null,
            } : v))
        }
        setSheet(null)
    }

    const handleDelete = (id: string) => {
        if (confirm('¿Eliminar este vehículo?')) setVehicles(prev => prev.filter(v => v.id !== id))
    }

    const FILTERS: { key: FilterType; label: string; count: number; color: string }[] = [
        { key: 'TODOS', label: 'Todos', count: counts.total, color: TEXT_SUB },
        { key: VehicleStatus.DISPONIBLE, label: 'Disponibles', count: counts.disponibles, color: '#10b981' },
        { key: VehicleStatus.EN_RUTA, label: 'En Ruta', count: counts.enRuta, color: PINK },
        { key: VehicleStatus.MANTENIMIENTO, label: 'Mantenimiento', count: counts.mantenimiento, color: '#f59e0b' },
    ]

    return (
        <div style={{ fontFamily: F }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontFamily: F, fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 900, color: TEXT, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>Flota de Vehículos</h1>
                    <p style={{ fontFamily: F, fontSize: 14, color: TEXT_SUB, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: PINK, display: 'inline-block', boxShadow: `0 0 8px ${PINK}` }} />
                        {counts.total} vehículos registrados
                    </p>
                </div>
                <button onClick={() => setSheet('new')} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 12,
                    background: 'linear-gradient(135deg,#EC4899,#D8B4FE)', border: 'none', color: 'white',
                    fontFamily: F, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 18px rgba(236,72,153,0.4)', whiteSpace: 'nowrap',
                }}>
                    <Plus size={16} strokeWidth={3} />Agregar Vehículo
                </button>
            </div>

            {/* Filtros + Search */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {FILTERS.map(f => (
                        <button key={f.key} onClick={() => setFilter(f.key)} style={{
                            display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 20,
                            border: `1.5px solid ${filter === f.key ? f.color : BORDER}`,
                            backgroundColor: filter === f.key ? `${f.color}18` : 'rgba(255,255,255,0.03)',
                            color: filter === f.key ? f.color : TEXT_SUB,
                            fontFamily: F, fontSize: 13, fontWeight: filter === f.key ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s',
                        }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: f.color, display: 'inline-block' }} />
                            {f.label} ({f.count})
                        </button>
                    ))}
                </div>
                <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: TEXT_SUB }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar placa, marca..."
                        style={{ height: 38, width: 'clamp(160px, 30vw, 240px)', borderRadius: 10, border: `1.5px solid ${BORDER}`, backgroundColor: INPUT_BG, padding: '0 14px 0 36px', fontFamily: F, fontSize: 13, color: TEXT, outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(236,72,153,0.12)' }}
                        onBlur={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = 'none' }}
                    />
                </div>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                    <div style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: 'rgba(236,72,153,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <Package size={28} color={PINK} />
                    </div>
                    <p style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: TEXT, margin: '0 0 6px' }}>Sin vehículos</p>
                    <p style={{ fontFamily: F, fontSize: 14, color: TEXT_SUB, margin: '0 0 20px' }}>
                        {search ? 'No hay coincidencias para tu búsqueda' : 'No hay vehículos registrados aún'}
                    </p>
                    {!search && (
                        <button onClick={() => setSheet('new')} style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#EC4899,#D8B4FE)', border: 'none', color: 'white', fontFamily: F, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                            Agregar primer vehículo
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
                    {filtered.map(v => <VehicleCard key={v.id} v={v} onEdit={setSheet} onDelete={handleDelete} />)}
                </div>
            )}

            <VehicleSheet vehicle={sheet} onClose={() => setSheet(null)} onSave={handleSave} />
        </div>
    )
}