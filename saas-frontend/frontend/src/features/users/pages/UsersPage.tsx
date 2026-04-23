import { useState, useEffect } from 'react'
import {
    Plus, MoreVertical, Users, X, Check,
    Search, ChevronDown, Eye, EyeOff, Mail, Phone, Shield
} from 'lucide-react'
import { Role } from '@/types/enums'
import { usersApi, CreateUserRequest, UpdateUserRequest } from '@/features/users/api/usersApi'
import { UserResponse } from '@/features/auth/api/authApi'

const F = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"

// ── Colores ──────────────────────────────────────────────────────────────────
const BG_CARD = '#211119'
const BORDER = 'rgba(255,255,255,0.07)'
const PINK = '#EC4899'
const LILAC = '#D8B4FE'
const TEXT = '#f1f0ff'
const TEXT_SUB = 'rgba(200,190,255,0.55)'
const INPUT_BG = 'rgba(255,255,255,0.06)'
const INPUT_BD = 'rgba(255,255,255,0.10)'

type User = UserResponse & { telefono?: string; ordenesHoy?: number; activoDesde?: string }
type FilterType = 'TODOS' | Role.DESPACHADOR | Role.CHOFER | 'INACTIVOS'

const EMPTY_FORM = { nombre: '', apellido: '', email: '', telefono: '', role: Role.DESPACHADOR as Role, password: '', activo: true }

// ── Role config ───────────────────────────────────────────────────────────────
const ROLE_CFG = {
    [Role.DESPACHADOR]: { label: 'Despachador', color: LILAC, bg: 'rgba(216,180,254,0.12)', border: 'rgba(216,180,254,0.25)' },
    [Role.CHOFER]: { label: 'Chofer', color: PINK, bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.25)' },
    [Role.ADMIN_PYME]: { label: 'Admin', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.25)' },
}

// ── Validaciones ──────────────────────────────────────────────────────────────
function validateForm(f: typeof EMPTY_FORM, isNew: boolean) {
    const errs: Record<string, string> = {}
    if (!f.nombre.trim()) errs.nombre = 'El nombre es requerido'
    else if (!/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/.test(f.nombre.trim())) errs.nombre = 'Solo letras'
    if (!f.apellido.trim()) errs.apellido = 'El apellido es requerido'
    else if (!/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/.test(f.apellido.trim())) errs.apellido = 'Solo letras'
    if (!f.email.trim()) errs.email = 'El email es requerido'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errs.email = 'Email inválido'
    if (f.telefono && !/^04\d{9}$/.test(f.telefono.replace(/\s/g, ''))) errs.telefono = 'Formato: 04XXXXXXXXX'
    if (isNew) {
        if (!f.password) errs.password = 'La contraseña es requerida'
        else if (f.password.length < 8) errs.password = 'Mínimo 8 caracteres'
        else if (!/[A-Z]/.test(f.password)) errs.password = 'Debe tener al menos una mayúscula'
        else if (!/\d/.test(f.password)) errs.password = 'Debe tener al menos un número'
    }
    return errs
}

// ── DarkInput ─────────────────────────────────────────────────────────────────
function DarkInput({ label, value, onChange, placeholder = '', error, type = 'text', hint, required = false, suffix, maxLength }: {
    label: string; value: string; onChange: (v: string) => void
    placeholder?: string; error?: string; type?: string
    hint?: string; required?: boolean; suffix?: React.ReactNode; maxLength?: number
}) {
    const [focused, setFocused] = useState(false)
    return (
        <div>
            <label style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: TEXT_SUB, display: 'block', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {label} {required && <span style={{ color: PINK }}>*</span>}
                {maxLength && <span style={{ fontWeight: 400, color: 'rgba(167,139,250,0.5)', marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>({value.length}/{maxLength})</span>}
            </label>
            <div style={{ position: 'relative' }}>
                <input
                    type={type}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    style={{
                        width: '100%', height: 42, borderRadius: 10,
                        border: `1.5px solid ${error ? '#ef4444' : focused ? PINK : INPUT_BD}`,
                        backgroundColor: focused ? 'rgba(255,255,255,0.08)' : INPUT_BG,
                        padding: suffix ? '0 40px 0 14px' : '0 14px',
                        fontFamily: F, fontSize: 14, color: TEXT, outline: 'none',
                        boxSizing: 'border-box',
                        boxShadow: focused ? `0 0 0 3px ${error ? 'rgba(239,68,68,0.15)' : 'rgba(236,72,153,0.12)'}` : 'none',
                        transition: 'all 0.15s',
                    }}
                />
                {suffix && <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>{suffix}</div>}
            </div>
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
                <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    style={{
                        width: '100%', height: 42, borderRadius: 10,
                        border: `1.5px solid ${focused ? PINK : INPUT_BD}`,
                        backgroundColor: focused ? 'rgba(255,255,255,0.08)' : INPUT_BG,
                        padding: '0 36px 0 14px', fontFamily: F,
                        fontSize: 14, color: TEXT, outline: 'none',
                        boxSizing: 'border-box', appearance: 'none',
                        boxShadow: focused ? '0 0 0 3px rgba(236,72,153,0.12)' : 'none',
                        transition: 'all 0.15s', cursor: 'pointer',
                    }}
                >
                    {options.map(o => <option key={o.value} value={o.value} style={{ backgroundColor: '#211119' }}>{o.label}</option>)}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: TEXT_SUB, pointerEvents: 'none' }} />
            </div>
        </div>
    )
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ nombre, apellido, size = 42, role }: { nombre: string; apellido: string; size?: number; role?: Role }) {
    const initials = `${nombre?.[0] ?? ''}${apellido?.[0] ?? ''}`.toUpperCase()
    const gradient = role === Role.CHOFER
        ? 'linear-gradient(135deg, #EC4899, #f97316)'
        : 'linear-gradient(135deg, #8b5cf6, #D8B4FE)'
    return (
        <div style={{
            width: size, height: size, borderRadius: size * 0.28,
            background: gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: size * 0.34, fontWeight: 800,
            fontFamily: F, flexShrink: 0,
            boxShadow: role === Role.CHOFER ? '0 4px 12px rgba(236,72,153,0.3)' : '0 4px 12px rgba(139,92,246,0.3)',
        }}>
            {initials}
        </div>
    )
}

// ── User Card ─────────────────────────────────────────────────────────────────
function UserCard({ u, onEdit, onToggle, onDelete }: {
    u: User
    onEdit: (u: User) => void
    onToggle: (id: string) => void
    onDelete: (id: string) => void
}) {
    const [menuOpen, setMenuOpen] = useState(false)
    const roleCfg = ROLE_CFG[u.role as keyof typeof ROLE_CFG]

    return (
        <div style={{
            backgroundColor: BG_CARD,
            borderRadius: 16,
            border: `1px solid ${BORDER}`,
            borderLeft: `3px solid ${u.activo ? (u.role === Role.CHOFER ? PINK : LILAC) : 'rgba(255,255,255,0.15)'}`,
            padding: '18px 20px',
            position: 'relative',
            opacity: u.activo ? 1 : 0.6,
            transition: 'all 0.2s',
            boxShadow: 'inset 0 0 30px rgba(139,92,246,0.02)',
        }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'inset 0 0 30px rgba(139,92,246,0.05), 0 8px 32px rgba(0,0,0,0.3)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'inset 0 0 30px rgba(139,92,246,0.02)' }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar nombre={u.nombre} apellido={u.apellido} size={44} role={u.role} />
                    <div>
                        <p style={{ fontFamily: F, fontSize: 15, fontWeight: 800, color: TEXT, margin: '0 0 4px 0' }}>
                            {u.nombre} {u.apellido}
                        </p>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 10px', borderRadius: 20,
                            border: `1px solid ${roleCfg?.border}`,
                            backgroundColor: roleCfg?.bg,
                            color: roleCfg?.color,
                            fontFamily: F, fontSize: 10, fontWeight: 800,
                            letterSpacing: '0.06em', textTransform: 'uppercase',
                        }}>
                            <Shield size={9} strokeWidth={3} />
                            {roleCfg?.label ?? u.role}
                        </span>
                    </div>
                </div>
                {/* Menu */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: TEXT_SUB, borderRadius: 6, display: 'flex' }}
                        onMouseEnter={e => (e.currentTarget.style.color = TEXT)}
                        onMouseLeave={e => (e.currentTarget.style.color = TEXT_SUB)}
                    >
                        <MoreVertical size={16} />
                    </button>
                    {menuOpen && (
                        <div style={{
                            position: 'absolute', right: 0, top: 28, zIndex: 50,
                            backgroundColor: '#2d1520', border: `1px solid ${BORDER}`,
                            borderRadius: 10, overflow: 'hidden', minWidth: 160,
                            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                        }}>
                            <button onClick={() => { onEdit(u); setMenuOpen(false) }}
                                style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: TEXT, fontFamily: F, fontSize: 13, textAlign: 'left', cursor: 'pointer' }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >✏️ Editar</button>
                            <button onClick={() => { onToggle(u.id); setMenuOpen(false) }}
                                style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: u.activo ? '#f59e0b' : '#10b981', fontFamily: F, fontSize: 13, textAlign: 'left', cursor: 'pointer' }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >{u.activo ? '⏸️ Desactivar' : '▶️ Activar'}</button>
                            <button onClick={() => { onDelete(u.id); setMenuOpen(false) }}
                                style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: '#ef4444', fontFamily: F, fontSize: 13, textAlign: 'left', cursor: 'pointer' }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >🗑️ Eliminar</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Email */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Mail size={12} color={TEXT_SUB} />
                <span style={{ fontFamily: F, fontSize: 12, color: TEXT_SUB }}>{u.email}</span>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div style={{ padding: '8px 12px', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
                    <p style={{ fontFamily: F, fontSize: 10, color: TEXT_SUB, margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Órdenes hoy</p>
                    <p style={{ fontFamily: F, fontSize: 18, fontWeight: 800, color: (u.ordenesHoy ?? 0) > 0 ? PINK : TEXT_SUB, margin: 0 }}>{u.ordenesHoy ?? 0}</p>
                </div>
                <div style={{ padding: '8px 12px', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
                    <p style={{ fontFamily: F, fontSize: 10, color: TEXT_SUB, margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Activo desde</p>
                    <p style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>{u.activoDesde}</p>
                </div>
            </div>

            {/* Footer */}
            <div style={{ paddingTop: 12, borderTop: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: u.activo ? '#10b981' : '#ef4444', display: 'inline-block', boxShadow: u.activo ? '0 0 6px rgba(16,185,129,0.8)' : 'none' }} />
                    <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: u.activo ? '#10b981' : '#ef4444' }}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </div>
                <button
                    onClick={() => onEdit(u)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 12, fontWeight: 700, color: PINK, padding: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                >
                    Ver perfil
                </button>
            </div>
        </div>
    )
}

// ── Sheet ─────────────────────────────────────────────────────────────────────
function UserSheet({ user, onClose, onSave }: {
    user: User | 'new' | null
    onClose: () => void
    onSave: (data: any) => void
}) {
    // ✅ Hooks SIEMPRE primero — nunca return ni lógica condicional antes de hooks
    const [formEdits, setFormEdits] = useState<Partial<typeof EMPTY_FORM>>({})
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)
    const [showPass, setShowPass] = useState(false)
    const [prevUser, setPrevUser] = useState<User | 'new' | null>(null)

    if (user !== prevUser) {
        setPrevUser(user)
        setFormEdits({})
        setErrors({})
        setShowPass(false)
    }

    // ✅ Guard DESPUÉS de todos los hooks
    if (!user) return null

    const isNew = user === 'new'
    const u = isNew ? null : user as User

    const get = (key: keyof typeof EMPTY_FORM): any => {
        if (formEdits[key] !== undefined) return formEdits[key]
        if (isNew) return EMPTY_FORM[key]
        if (key === 'activo') return u?.activo ?? true
        if (key === 'role') return u?.role ?? Role.DESPACHADOR
        return (u as any)?.[key] ?? ''
    }

    const set = (k: string, v: any) => {
        setFormEdits(f => ({ ...f, [k]: v }))
        setErrors(e => ({ ...e, [k]: '' }))
    }

    const buildPayload = () => isNew ? { ...EMPTY_FORM, ...formEdits } : {
        nombre: u?.nombre ?? '',
        apellido: u?.apellido ?? '',
        email: u?.email ?? '',
        telefono: u?.telefono ?? '',
        role: u?.role ?? Role.DESPACHADOR,
        activo: u?.activo ?? true,
        password: formEdits.password || '',
        ...formEdits,
    }

    const handleSave = async () => {
        const payload = buildPayload()
        const errs = validateForm(payload as any, isNew)
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
                position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(420px, 100vw)',
                backgroundColor: '#1c0f16',
                borderLeft: `1px solid rgba(139,92,246,0.2)`,
                zIndex: 50, overflowY: 'auto', padding: 'clamp(16px, 5vw, 28px)',
                boxShadow: '-20px 0 60px rgba(0,0,0,0.6)',
                display: 'flex', flexDirection: 'column', gap: 20,
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #8b5cf6, #D8B4FE)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(139,92,246,0.35)' }}>
                            <Users size={16} color="white" />
                        </div>
                        <div>
                            <h3 style={{ fontFamily: F, fontSize: 16, fontWeight: 800, color: TEXT, margin: 0 }}>
                                {isNew ? 'Nuevo Usuario' : 'Editar Usuario'}
                            </h3>
                            <p style={{ fontFamily: F, fontSize: 12, color: TEXT_SUB, margin: 0 }}>
                                {isNew ? 'Completa los datos del usuario' : `${u?.nombre ?? ''} ${u?.apellido ?? ''}`}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SUB, display: 'flex', borderRadius: 8, padding: 4 }}
                        onMouseEnter={e => (e.currentTarget.style.color = TEXT)}
                        onMouseLeave={e => (e.currentTarget.style.color = TEXT_SUB)}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div style={{ height: 1, backgroundColor: BORDER }} />

                {/* Form */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14 }}>
                    <DarkInput label="Nombre" value={get('nombre')} onChange={v => set('nombre', v.replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]/g, '').slice(0, 30))} placeholder="Ej: Juan" error={errors.nombre} required maxLength={30} />
                    <DarkInput label="Apellido" value={get('apellido')} onChange={v => set('apellido', v.replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]/g, '').slice(0, 30))} placeholder="Ej: Pérez" error={errors.apellido} required maxLength={30} />
                </div>

                <DarkInput
                    label="Email"
                    value={get('email')}
                    onChange={v => set('email', v.replace(/[^a-zA-Z0-9@._+\-]/g, '').slice(0, 50))}
                    placeholder="juan.p@empresa.com"
                    type="email"
                    error={errors.email}
                    required
                    maxLength={50}
                />

                <div style={{ position: 'relative' }}>
                    <label style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: TEXT_SUB, display: 'block', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Teléfono
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', height: 42, borderRadius: 10, border: `1.5px solid ${INPUT_BD}`, backgroundColor: INPUT_BG, flexShrink: 0 }}>
                            <span>🇻🇪</span>
                            <span style={{ fontFamily: F, fontSize: 13, color: LILAC, fontWeight: 600 }}>+58</span>
                        </div>
                        <input
                            value={get('telefono')}
                            onChange={e => set('telefono', e.target.value.replace(/\D/g, '').slice(0, 11))}
                            placeholder="04121234567"
                            inputMode="numeric"
                            style={{
                                flex: 1, height: 42, borderRadius: 10,
                                border: `1.5px solid ${errors.telefono ? '#ef4444' : INPUT_BD}`,
                                backgroundColor: INPUT_BG, padding: '0 14px',
                                fontFamily: F, fontSize: 14, color: TEXT, outline: 'none',
                            }}
                            onFocus={e => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(236,72,153,0.12)' }}
                            onBlur={e => { e.currentTarget.style.borderColor = errors.telefono ? '#ef4444' : INPUT_BD; e.currentTarget.style.boxShadow = 'none' }}
                        />
                    </div>
                    {errors.telefono && <p style={{ fontFamily: F, fontSize: 11, color: '#ef4444', margin: '4px 0 0 2px' }}>{errors.telefono}</p>}
                </div>

                <DarkSelect label="Rol operativo" value={get('role')} onChange={v => set('role', v)} required options={[
                    { value: Role.DESPACHADOR, label: '📋 Despachador' },
                    { value: Role.CHOFER, label: '🚛 Chofer' },
                ]} />

                {/* Contraseña — solo en creación */}
                {isNew && (
                    <DarkInput
                        label="Contraseña provisional"
                        value={get('password')}
                        onChange={v => set('password', v.replace(/[¿¡<>{}|]/g, '').slice(0, 32))}
                        placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número"
                        type={showPass ? 'text' : 'password'}
                        error={errors.password}
                        required
                        hint="El usuario deberá cambiarla en su primer inicio de sesión"
                        suffix={
                            <button type="button" onClick={() => setShowPass(!showPass)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_SUB, display: 'flex', padding: 0 }}>
                                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        }
                    />
                )}

                {/* Aviso seguridad */}
                {isNew && (
                    <div style={{ padding: '12px 14px', borderRadius: 10, border: `1px solid rgba(216,180,254,0.2)`, backgroundColor: 'rgba(216,180,254,0.06)' }}>
                        <p style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: LILAC, margin: '0 0 4px 0' }}>🔒 Privacidad y Seguridad</p>
                        <p style={{ fontFamily: F, fontSize: 12, color: TEXT_SUB, margin: 0, lineHeight: 1.5 }}>
                            Al registrar un nuevo usuario, se le notificará vía email con sus credenciales de acceso.
                        </p>
                    </div>
                )}

                {/* Botones */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                            height: 46, borderRadius: 12, border: 'none',
                            background: saving ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg, #8b5cf6, #D8B4FE)',
                            color: 'white', fontFamily: F, fontSize: 15, fontWeight: 700,
                            cursor: saving ? 'not-allowed' : 'pointer',
                            boxShadow: saving ? 'none' : '0 4px 18px rgba(139,92,246,0.4)',
                            transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}
                    >
                        {saving ? (
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                        ) : <Check size={16} strokeWidth={3} />}
                        {saving ? 'Guardando...' : isNew ? 'Confirmar Registro' : 'Guardar Cambios'}
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            height: 42, borderRadius: 12,
                            border: `1.5px solid ${BORDER}`,
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            color: TEXT_SUB, fontFamily: F, fontSize: 14, fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget.style.borderColor = LILAC); (e.currentTarget.style.color = TEXT) }}
                        onMouseLeave={e => { (e.currentTarget.style.borderColor = BORDER); (e.currentTarget.style.color = TEXT_SUB) }}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </>
    )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<FilterType>('TODOS')
    const [search, setSearch] = useState('')
    const [sheet, setSheet] = useState<User | 'new' | null>(null)

    useEffect(() => {
        loadUsers()
    }, [])

    const loadUsers = async () => {
        try {
            setLoading(true)
            const data = await usersApi.getAll()
            setUsers(data.map(u => ({ ...u, ordenesHoy: 0, activoDesde: '-' })))
        } catch (e) {
            console.error('Error loading users:', e)
        } finally {
            setLoading(false)
        }
    }

    const filtered = users.filter(u => {
        const matchFilter =
            filter === 'TODOS' ? true :
                filter === 'INACTIVOS' ? !u.activo :
                    u.role === filter
        const q = search.toLowerCase()
        const matchSearch = !q ||
            u.nombre.toLowerCase().includes(q) ||
            u.apellido.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q)
        return matchFilter && matchSearch
    })

    const counts = {
        total: users.length,
        activos: users.filter(u => u.activo).length,
        despachadores: users.filter(u => u.role === Role.DESPACHADOR).length,
        choferes: users.filter(u => u.role === Role.CHOFER).length,
        inactivos: users.filter(u => !u.activo).length,
    }

    const handleSave = async (data: any) => {
        try {
            if (sheet === 'new') {
                const createData: CreateUserRequest = {
                    email: data.email,
                    password: data.password,
                    nombre: data.nombre,
                    apellido: data.apellido,
                    role: data.role,
                    phone: data.telefono,
                }
                await usersApi.create(createData)
            } else {
                const updateData: UpdateUserRequest = {
                    nombre: data.nombre,
                    apellido: data.apellido,
                    email: data.email,
                    activo: data.activo,
                }
                await usersApi.update((sheet as User).id, updateData)
            }
            await loadUsers()
            setSheet(null)
        } catch (e) {
            console.error('Error saving user:', e)
        }
    }

    const handleToggle = async (id: string) => {
        const user = users.find(u => u.id === id)
        if (!user) return
        try {
            await usersApi.update(id, { activo: !user.activo })
            setUsers(prev => prev.map(u => u.id === id ? { ...u, activo: !u.activo } : u))
        } catch (e) {
            console.error('Error toggling user:', e)
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm('¿Eliminar este usuario?')) {
            try {
                await usersApi.delete(id)
                setUsers(prev => prev.filter(u => u.id !== id))
            } catch (e) {
                console.error('Error deleting user:', e)
            }
        }
    }

    const FILTERS: { key: FilterType; label: string; count: number; color: string }[] = [
        { key: 'TODOS', label: 'Todos', count: counts.total, color: TEXT_SUB },
        { key: Role.DESPACHADOR, label: 'Despachadores', count: counts.despachadores, color: LILAC },
        { key: Role.CHOFER, label: 'Choferes', count: counts.choferes, color: PINK },
        { key: 'INACTIVOS', label: 'Inactivos', count: counts.inactivos, color: '#ef4444' },
    ]

    return (
        <div style={{ fontFamily: F }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontFamily: F, fontSize: 28, fontWeight: 900, color: TEXT, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                        Usuarios
                    </h1>
                    <p style={{ fontFamily: F, fontSize: 14, color: TEXT_SUB, margin: 0 }}>
                        Gestiona los accesos y roles de tu personal logístico
                    </p>
                </div>
                <button
                    onClick={() => setSheet('new')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '11px 20px', borderRadius: 12,
                        background: 'linear-gradient(135deg, #8b5cf6, #D8B4FE)',
                        border: 'none', color: 'white',
                        fontFamily: F, fontSize: 14, fontWeight: 700,
                        cursor: 'pointer', boxShadow: '0 4px 18px rgba(139,92,246,0.4)',
                        transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 6px 24px rgba(139,92,246,0.55)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 18px rgba(139,92,246,0.4)')}
                >
                    <Plus size={16} strokeWidth={3} />
                    Nuevo Usuario
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 1, marginBottom: 28, borderRadius: 16, overflow: 'hidden', border: `1px solid ${BORDER}` }}>

                {/* Total */}
                <div style={{ padding: '20px 22px', backgroundColor: BG_CARD, borderRight: `1px solid ${BORDER}` }}>
                    <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: TEXT_SUB, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total</p>
                    <p style={{ fontFamily: F, fontSize: 36, fontWeight: 900, color: TEXT, margin: '0 0 2px', lineHeight: 1 }}>{counts.total}</p>
                    <div style={{ marginTop: 14, height: 2, borderRadius: 1, background: 'linear-gradient(90deg, #EC4899, #D8B4FE, transparent)' }} />
                </div>

                {/* Activos */}
                <div style={{ padding: '20px 22px', backgroundColor: BG_CARD, borderRight: `1px solid ${BORDER}`, position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: TEXT_SUB, margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Activos</p>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', boxShadow: '0 0 6px rgba(16,185,129,0.9)', flexShrink: 0 }} />
                    </div>
                    <p style={{ fontFamily: F, fontSize: 36, fontWeight: 900, color: '#10b981', margin: '0 0 2px', lineHeight: 1 }}>{counts.activos}</p>
                    <div style={{ marginTop: 14, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.06)' }}>
                        <div style={{ height: '100%', borderRadius: 1, width: `${counts.total > 0 ? (counts.activos / counts.total) * 100 : 0}%`, backgroundColor: '#10b981', transition: 'width 0.4s ease' }} />
                    </div>
                </div>

                {/* Despachadores */}
                <div style={{ padding: '20px 22px', backgroundColor: BG_CARD, borderRight: `1px solid ${BORDER}` }}>
                    <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: TEXT_SUB, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Despachadores</p>
                    <p style={{ fontFamily: F, fontSize: 36, fontWeight: 900, color: LILAC, margin: '0 0 2px', lineHeight: 1 }}>{counts.despachadores}</p>
                    <div style={{ marginTop: 14, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.06)' }}>
                        <div style={{ height: '100%', borderRadius: 1, width: `${counts.total > 0 ? (counts.despachadores / counts.total) * 100 : 0}%`, backgroundColor: LILAC, transition: 'width 0.4s ease' }} />
                    </div>
                </div>

                {/* Choferes */}
                <div style={{ padding: '20px 22px', backgroundColor: BG_CARD }}>
                    <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: TEXT_SUB, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Choferes</p>
                    <p style={{ fontFamily: F, fontSize: 36, fontWeight: 900, color: PINK, margin: '0 0 2px', lineHeight: 1 }}>{counts.choferes}</p>
                    <div style={{ marginTop: 14, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.06)' }}>
                        <div style={{ height: '100%', borderRadius: 1, width: `${counts.total > 0 ? (counts.choferes / counts.total) * 100 : 0}%`, backgroundColor: PINK, transition: 'width 0.4s ease' }} />
                    </div>
                </div>

            </div>

            {/* Filtros + Search */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {FILTERS.map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 7,
                                padding: '7px 14px', borderRadius: 20,
                                border: `1.5px solid ${filter === f.key ? f.color : BORDER}`,
                                backgroundColor: filter === f.key ? `${f.color}18` : 'rgba(255,255,255,0.03)',
                                color: filter === f.key ? f.color : TEXT_SUB,
                                fontFamily: F, fontSize: 13, fontWeight: filter === f.key ? 700 : 500,
                                cursor: 'pointer', transition: 'all 0.15s',
                            }}
                        >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: f.color, display: 'inline-block' }} />
                            {f.label} ({f.count})
                        </button>
                    ))}
                </div>
                <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: TEXT_SUB }} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nombre o email..."
                        style={{
                            height: 38, width: 240, borderRadius: 10,
                            border: `1.5px solid ${BORDER}`,
                            backgroundColor: INPUT_BG,
                            padding: '0 14px 0 36px',
                            fontFamily: F, fontSize: 13, color: TEXT, outline: 'none',
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = LILAC; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(216,180,254,0.12)' }}
                        onBlur={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = 'none' }}
                    />
                </div>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                    <div style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: 'rgba(139,92,246,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <Users size={28} color={LILAC} />
                    </div>
                    <p style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: TEXT, margin: '0 0 6px' }}>Sin usuarios</p>
                    <p style={{ fontFamily: F, fontSize: 14, color: TEXT_SUB, margin: '0 0 20px' }}>
                        {search ? 'No coincide ningún usuario con tu búsqueda' : 'No hay usuarios registrados aún'}
                    </p>
                    {!search && (
                        <button onClick={() => setSheet('new')} style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#8b5cf6,#D8B4FE)', border: 'none', color: 'white', fontFamily: F, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                            Agregar primer usuario
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
                    {filtered.map(u => (
                        <UserCard key={u.id} u={u} onEdit={setSheet} onToggle={handleToggle} onDelete={handleDelete} />
                    ))}
                </div>
            )}

            <UserSheet user={sheet} onClose={() => setSheet(null)} onSave={handleSave} />
        </div>
    )
}