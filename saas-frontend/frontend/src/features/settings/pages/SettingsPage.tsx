import { useState } from 'react'
import {
    User, Settings, Camera, Lock, Bell, MapPin, Building2,
    Phone, Shield, Eye, EyeOff, Check, Save,
    Globe, AlertCircle, Zap,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Role } from '@/types/enums'

const F = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

// ── Paletas por rol ───────────────────────────────────────────────────────────
interface RoleTheme {
    primary: string
    sec: string
    card: string
    card2: string
    border: string
    borderFocus: string
    focusShadow: string
    labelColor: string
    gradient: string
    toggleOn: string
    toggleOff: string
    sectionHdr: string
    tabActive: string
    tabActiveTxt: string
    saveBg: string
    saveShadow: string
}

const THEMES: Record<string, RoleTheme> = {
    [Role.ADMIN_PYME]: {
        primary: '#EC4899',
        sec: '#D8B4FE',
        card: '#2d1122',
        card2: '#361428',
        border: 'rgba(236,72,153,0.14)',
        borderFocus: '#EC4899',
        focusShadow: 'rgba(236,72,153,0.15)',
        labelColor: '#D8B4FE',
        gradient: 'linear-gradient(135deg,#EC4899,#D8B4FE)',
        toggleOn: '#EC4899',
        toggleOff: 'rgba(236,72,153,0.15)',
        sectionHdr: 'linear-gradient(135deg,rgba(236,72,153,0.08),rgba(216,180,254,0.05))',
        tabActive: 'rgba(236,72,153,0.2)',
        tabActiveTxt: '#EC4899',
        saveBg: '#EC4899',
        saveShadow: 'rgba(236,72,153,0.3)',
    },
    [Role.DESPACHADOR]: {
        primary: '#EC4899',
        sec: '#D8B4FE',
        card: '#2d1122',
        card2: '#361428',
        border: 'rgba(236,72,153,0.14)',
        borderFocus: '#EC4899',
        focusShadow: 'rgba(236,72,153,0.15)',
        labelColor: '#D8B4FE',
        gradient: 'linear-gradient(135deg,#EC4899,#D8B4FE)',
        toggleOn: '#EC4899',
        toggleOff: 'rgba(236,72,153,0.15)',
        sectionHdr: 'linear-gradient(135deg,rgba(236,72,153,0.08),rgba(216,180,254,0.05))',
        tabActive: 'rgba(236,72,153,0.2)',
        tabActiveTxt: '#EC4899',
        saveBg: '#EC4899',
        saveShadow: 'rgba(236,72,153,0.3)',
    },
    [Role.CHOFER]: {
        primary: '#38BDF8',
        sec: '#7DD3FC',
        card: '#0c2236',
        card2: '#0e2840',
        border: 'rgba(56,189,248,0.14)',
        borderFocus: '#38BDF8',
        focusShadow: 'rgba(56,189,248,0.15)',
        labelColor: '#7DD3FC',
        gradient: 'linear-gradient(135deg,#38BDF8,#7DD3FC)',
        toggleOn: '#38BDF8',
        toggleOff: 'rgba(56,189,248,0.15)',
        sectionHdr: 'linear-gradient(135deg,rgba(56,189,248,0.08),rgba(125,211,252,0.05))',
        tabActive: 'rgba(56,189,248,0.18)',
        tabActiveTxt: '#38BDF8',
        saveBg: '#38BDF8',
        saveShadow: 'rgba(56,189,248,0.3)',
    },
    [Role.SUPER_ADMIN]: {
        primary: '#8B5CF6',
        sec: '#A78BFA',
        card: '#1a1040',
        card2: '#1f1350',
        border: 'rgba(139,92,246,0.15)',
        borderFocus: '#8B5CF6',
        focusShadow: 'rgba(139,92,246,0.18)',
        labelColor: '#A78BFA',
        gradient: 'linear-gradient(135deg,#8B5CF6,#A78BFA)',
        toggleOn: '#8B5CF6',
        toggleOff: 'rgba(139,92,246,0.15)',
        sectionHdr: 'linear-gradient(135deg,rgba(139,92,246,0.1),rgba(167,139,250,0.05))',
        tabActive: 'rgba(139,92,246,0.2)',
        tabActiveTxt: '#A78BFA',
        saveBg: '#8B5CF6',
        saveShadow: 'rgba(139,92,246,0.3)',
    },
}
const DEFAULT_THEME = THEMES[Role.ADMIN_PYME]

// ── Validation helpers ────────────────────────────────────────────────────────
const sanitizeName = (v: string) => v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚàèìòùÂÊÎÔÛäëïöüÄËÏÖÜãõÃÕñÑçÇ\s\-']/g, '').slice(0, 30)
const sanitizePhone = (v: string) => v.replace(/\D/g, '').slice(0, 11)
const sanitizeRif = (v: string) => { let r = v.toUpperCase().replace(/[^JVEGC0-9\-]/g, ''); if (r.length > 0 && !/^[JVEGC]/.test(r)) r = ''; return r.slice(0, 12) }
const sanitizeNumbers = (v: string) => v.replace(/\D/g, '')

function validateName(v: string) { if (!v.trim()) return 'El nombre es obligatorio.'; if (v.trim().length < 2) return 'Mínimo 2 caracteres.'; return '' }
function validatePhone(v: string) { if (v && v.length < 7) return 'Mínimo 7 dígitos.'; return '' }
function validatePass(v: string) { if (!v) return 'Obligatorio.'; if (v.length < 8) return 'Mínimo 8 caracteres.'; return '' }
function validateNewPass(p: string, c: string) { if (p !== c) return 'Las contraseñas no coinciden.'; return '' }

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ value, onChange, theme }: { value: boolean; onChange: (v: boolean) => void; theme: RoleTheme }) {
    return (
        <button
            onClick={() => onChange(!value)}
            aria-checked={value}
            role="switch"
            style={{
                width: 44, height: 24, borderRadius: 12,
                backgroundColor: value ? theme.toggleOn : theme.toggleOff,
                border: 'none', cursor: 'pointer', padding: 0,
                position: 'relative', transition: 'background-color 0.2s',
                flexShrink: 0,
            }}
        >
            <span style={{
                position: 'absolute', top: 2,
                left: value ? 22 : 2,
                width: 20, height: 20, borderRadius: '50%',
                backgroundColor: value ? 'white' : `${theme.primary}66`,
                transition: 'left 0.2s',
                boxShadow: value ? `0 2px 6px ${theme.saveShadow}` : 'none',
            }} />
        </button>
    )
}

// ── FieldError ────────────────────────────────────────────────────────────────
function FieldError({ msg }: { msg: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
            <AlertCircle size={11} color="#ef4444" style={{ flexShrink: 0 }} />
            <p style={{ fontFamily: F, fontSize: 11, color: '#ef4444', margin: 0 }}>{msg}</p>
        </div>
    )
}

// ── StyledInput ───────────────────────────────────────────────────────────────
function StyledInput({
    label, value, onChange, onBlur, placeholder = '', readOnly = false,
    hint, suffix, prefix, maxLength, type = 'text',
    inputMode, error, touched, counter,
    theme,
}: {
    label: string; value: string
    onChange?: (v: string) => void
    onBlur?: () => void
    placeholder?: string; readOnly?: boolean; hint?: string
    suffix?: React.ReactNode; prefix?: React.ReactNode
    maxLength?: number; type?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
    error?: string; touched?: boolean; counter?: boolean; theme: RoleTheme
}) {
    const [focused, setFocused] = useState(false)
    const showErr = touched && !!error
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: theme.labelColor }}>
                    {label}
                </label>
                {counter && maxLength && !readOnly && (
                    <span style={{ fontFamily: MONO, fontSize: 10, color: value.length > maxLength - 5 ? '#f59e0b' : 'rgba(255,255,255,0.25)' }}>
                        {value.length}/{maxLength}
                    </span>
                )}
            </div>
            <div style={{
                display: 'flex', alignItems: 'center',
                border: `1.5px solid ${showErr ? '#ef4444' : focused ? theme.borderFocus : theme.border}`,
                borderRadius: 12, overflow: 'hidden',
                backgroundColor: readOnly ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)',
                boxShadow: focused ? `0 0 0 3px ${showErr ? 'rgba(239,68,68,0.12)' : theme.focusShadow}` : 'none',
                transition: 'all 0.15s',
            }}>
                {prefix}
                <input
                    type={type} value={value} readOnly={readOnly}
                    placeholder={placeholder} maxLength={maxLength}
                    inputMode={inputMode}
                    onChange={e => onChange?.(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => { setFocused(false); onBlur?.() }}
                    style={{
                        flex: 1, border: 'none', outline: 'none',
                        padding: '11px 14px', fontFamily: F, fontSize: 14,
                        color: readOnly ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.9)',
                        backgroundColor: 'transparent',
                    }}
                />
                {suffix}
            </div>
            {showErr && <FieldError msg={error} />}
            {hint && !showErr && <p style={{ fontFamily: F, fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{hint}</p>}
        </div>
    )
}

// ── PasswordInput ─────────────────────────────────────────────────────────────
function PasswordInput({
    label, value, onChange, onBlur, placeholder, maxLength = 64, error, touched, theme,
}: {
    label: string; value: string; onChange: (v: string) => void
    onBlur?: () => void
    placeholder?: string; maxLength?: number; error?: string; touched?: boolean; theme: RoleTheme
}) {
    const [show, setShow] = useState(false)
    const [focused, setFocused] = useState(false)
    const showErr = touched && !!error
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: theme.labelColor }}>{label}</label>
                <span style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{value.length}/{maxLength}</span>
            </div>
            <div style={{
                display: 'flex', alignItems: 'center',
                border: `1.5px solid ${showErr ? '#ef4444' : focused ? theme.borderFocus : theme.border}`,
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.05)',
                boxShadow: focused ? `0 0 0 3px ${showErr ? 'rgba(239,68,68,0.12)' : theme.focusShadow}` : 'none',
                transition: 'all 0.15s',
            }}>
                <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={e => onChange(e.target.value.slice(0, maxLength))}
                    onFocus={() => setFocused(true)}
                    onBlur={() => { setFocused(false); onBlur?.() }}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    style={{
                        flex: 1, border: 'none', outline: 'none',
                        padding: '11px 14px', fontFamily: F, fontSize: 14,
                        color: 'rgba(255,255,255,0.9)', backgroundColor: 'transparent',
                    }}
                />
                <button
                    onClick={() => setShow(s => !s)}
                    style={{ padding: '0 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center' }}
                >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
            {showErr && <FieldError msg={error} />}
        </div>
    )
}

// ── SectionCard ───────────────────────────────────────────────────────────────
function SectionCard({ title, icon, children, theme }: { title: string; icon: React.ReactNode; children: React.ReactNode; theme: RoleTheme }) {
    return (
        <div style={{
            backgroundColor: theme.card, borderRadius: 18,
            border: `1px solid ${theme.border}`,
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            overflow: 'hidden',
        }}>
            <div style={{
                padding: '15px 22px',
                background: theme.sectionHdr,
                borderBottom: `1px solid ${theme.border}`,
                display: 'flex', alignItems: 'center', gap: 10,
            }}>
                <div style={{
                    width: 32, height: 32, borderRadius: 9,
                    background: theme.gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', flexShrink: 0,
                }}>
                    {icon}
                </div>
                <h3 style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: 0 }}>{title}</h3>
            </div>
            <div style={{ padding: '20px 22px' }}>{children}</div>
        </div>
    )
}

// ── SaveButton ────────────────────────────────────────────────────────────────
function SaveButton({ saved, onClick, disabled = false, theme, label = 'Guardar cambios', savedLabel = 'Guardado' }: {
    saved: boolean; onClick: () => void; disabled?: boolean; theme: RoleTheme; label?: string; savedLabel?: string
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 20px', borderRadius: 12,
                backgroundColor: saved ? '#10b981' : theme.saveBg,
                color: 'white', border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontFamily: F, fontSize: 14, fontWeight: 600,
                opacity: disabled ? 0.45 : 1,
                transition: 'all 0.2s',
                boxShadow: disabled ? 'none' : saved ? '0 4px 14px rgba(16,185,129,0.3)' : `0 4px 14px ${theme.saveShadow}`,
            }}
        >
            {saved ? <Check size={14} /> : <Save size={14} />}
            {saved ? savedLabel : label}
        </button>
    )
}

// ── Tab: Perfil ───────────────────────────────────────────────────────────────
function TabPerfil({ theme }: { theme: RoleTheme }) {
    const { user } = useAuthStore()

    // ── Datos personales ──
    const [nombre, setNombre] = useState(user?.nombre ?? '')
    const [apellido, setApellido] = useState(user?.apellido ?? '')
    const [telefono, setTelefono] = useState('04121234567')
    const [tNombre, setTNombre] = useState(false)
    const [tApellido, setTApellido] = useState(false)
    const [tTelefono, setTTelefono] = useState(false)
    const [saved, setSaved] = useState(false)

    const errNombre = validateName(nombre)
    const errApellido = validateName(apellido)
    const errTelefono = validatePhone(telefono)

    const canSaveProfile = !errNombre && !errApellido && !errTelefono

    const handleSavePerfil = () => {
        setTNombre(true); setTApellido(true); setTTelefono(true)
        if (!canSaveProfile) return
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
    }

    // ── Contraseña ──
    const [currentPass, setCurrentPass] = useState('')
    const [newPass, setNewPass] = useState('')
    const [confirmPass, setConfirmPass] = useState('')
    const [tCurrent, setTCurrent] = useState(false)
    const [tNew, setTNew] = useState(false)
    const [tConfirm, setTConfirm] = useState(false)
    const [passSaved, setPassSaved] = useState(false)

    const errCurrent = tCurrent && !currentPass ? 'Introduce tu contraseña actual.' : ''
    const errNew = validatePass(newPass)
    const errConfirm = tConfirm ? validateNewPass(newPass, confirmPass) : ''

    const passMin8 = newPass.length >= 8
    const passMatch = newPass === confirmPass && confirmPass.length > 0
    const passHasUpper = /[A-Z]/.test(newPass)
    const passHasNum = /[0-9]/.test(newPass)
    const canSavePass = !!currentPass && passMin8 && passMatch

    const handleSavePass = () => {
        setTCurrent(true); setTNew(true); setTConfirm(true)
        if (!canSavePass) return
        setPassSaved(true)
        setCurrentPass(''); setNewPass(''); setConfirmPass('')
        setTCurrent(false); setTNew(false); setTConfirm(false)
        setTimeout(() => setPassSaved(false), 2500)
    }

    const initials = `${nombre?.[0] ?? ''}${apellido?.[0] ?? ''}`.toUpperCase() || '?'

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Avatar */}
            <SectionCard title="Foto de perfil" icon={<Camera size={15} />} theme={theme}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{
                            width: 76, height: 76, borderRadius: 20,
                            background: theme.gradient,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: 24, fontWeight: 900, fontFamily: F,
                            boxShadow: `0 8px 24px ${theme.saveShadow}`,
                        }}>{initials}</div>
                        <button
                            onClick={() => { }}
                            title="Cambiar foto"
                            style={{
                                position: 'absolute', bottom: -4, right: -4,
                                width: 26, height: 26, borderRadius: 7,
                                backgroundColor: theme.primary, border: '2.5px solid #1a0a14',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', boxShadow: `0 2px 8px ${theme.saveShadow}`,
                            }}
                        >
                            <Camera size={12} color="white" />
                        </button>
                    </div>
                    <div>
                        <p style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: '0 0 3px' }}>
                            {nombre} {apellido}
                        </p>
                        <p style={{ fontFamily: F, fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: '0 0 10px' }}>{user?.email}</p>
                        <button
                            onClick={() => { }}
                            style={{
                                fontFamily: F, fontSize: 12, fontWeight: 600,
                                color: theme.primary, border: `1.5px solid ${theme.primary}`,
                                backgroundColor: `${theme.primary}10`,
                                padding: '6px 13px', borderRadius: 8, cursor: 'pointer',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = `${theme.primary}22`)}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = `${theme.primary}10`)}
                        >
                            Cambiar foto
                        </button>
                    </div>
                </div>
            </SectionCard>

            {/* Datos personales */}
            <SectionCard title="Datos personales" icon={<User size={15} />} theme={theme}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="settings-grid">
                    <StyledInput
                        label="Nombre" value={nombre} theme={theme} counter maxLength={30}
                        placeholder="Tu nombre" error={errNombre} touched={tNombre}
                        onChange={v => setNombre(sanitizeName(v))}
                        onBlur={() => setTNombre(true)}
                    />
                    <StyledInput
                        label="Apellido" value={apellido} theme={theme} counter maxLength={30}
                        placeholder="Tu apellido" error={errApellido} touched={tApellido}
                        onChange={v => setApellido(sanitizeName(v))}
                        onBlur={() => setTApellido(true)}
                    />
                    <StyledInput
                        label="Email" value={user?.email ?? ''} theme={theme} readOnly
                        hint="El email no se puede cambiar"
                        suffix={
                            <div style={{ paddingRight: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16,185,129,0.12)', padding: '3px 8px', borderRadius: 6 }}>
                                    <Shield size={10} color="#10b981" />
                                    <span style={{ fontFamily: F, fontSize: 10, color: '#10b981', fontWeight: 600 }}>Verificado</span>
                                </div>
                            </div>
                        }
                    />
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <label style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: theme.labelColor }}>Teléfono</label>
                            <span style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{telefono.length}/11</span>
                        </div>
                        <div style={{
                            display: 'flex', gap: 8,
                        }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '11px 11px', borderRadius: 12,
                                border: `1.5px solid ${theme.border}`,
                                backgroundColor: 'rgba(255,255,255,0.04)',
                                flexShrink: 0,
                            }}>
                                <span style={{ fontSize: 14 }}>🇻🇪</span>
                                <span style={{ fontFamily: F, fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>+58</span>
                            </div>
                            <div style={{ flex: 1 }}>
                                <input
                                    value={telefono}
                                    onChange={e => setTelefono(sanitizePhone(e.target.value))}
                                    placeholder="04121234567"
                                    inputMode="numeric"
                                    maxLength={11}
                                    style={{
                                        width: '100%', border: `1.5px solid ${tTelefono && errTelefono ? '#ef4444' : theme.border}`,
                                        borderRadius: 12, padding: '11px 13px', fontFamily: MONO, fontSize: 13,
                                        color: 'rgba(255,255,255,0.9)', outline: 'none', boxSizing: 'border-box',
                                        backgroundColor: 'rgba(255,255,255,0.05)', transition: 'border-color 0.15s',
                                    }}
                                    onFocus={e => { e.currentTarget.style.borderColor = theme.borderFocus; e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.focusShadow}` }}
                                    onBlur={e => { e.currentTarget.style.borderColor = tTelefono && errTelefono ? '#ef4444' : theme.border; e.currentTarget.style.boxShadow = 'none'; setTTelefono(true) }}
                                />
                                {tTelefono && errTelefono && <FieldError msg={errTelefono} />}
                                <p style={{ fontFamily: F, fontSize: 10, color: 'rgba(255,255,255,0.28)', margin: '4px 0 0' }}>Solo dígitos, sin espacios ni signos</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
                    <SaveButton saved={saved} onClick={handleSavePerfil} theme={theme} />
                </div>
            </SectionCard>

            {/* Contraseña */}
            <SectionCard title="Cambiar contraseña" icon={<Lock size={15} />} theme={theme}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 480 }}>
                    <PasswordInput
                        label="Contraseña actual" value={currentPass}
                        onChange={v => setCurrentPass(v)}
                        placeholder="••••••••" error={errCurrent} touched={tCurrent}
                        theme={theme}
                        onBlur={() => setTCurrent(true)}
                    />
                    <PasswordInput
                        label="Nueva contraseña" value={newPass}
                        onChange={v => setNewPass(v)} maxLength={30}
                        placeholder="Mínimo 8 caracteres"
                        error={tNew ? errNew : ''} touched={tNew}
                        theme={theme}
                        onBlur={() => setTNew(true)}
                    />
                    <PasswordInput
                        label="Confirmar nueva contraseña" value={confirmPass}
                        onChange={v => setConfirmPass(v)} maxLength={30}
                        placeholder="Repite la nueva contraseña"
                        error={tConfirm ? validateNewPass(newPass, confirmPass) : ''} touched={tConfirm}
                        theme={theme}
                        onBlur={() => setTConfirm(true)}
                    />

                    {/* Checklist de validaciones */}
                    {(newPass.length > 0 || confirmPass.length > 0) && (
                        <div style={{
                            backgroundColor: 'rgba(255,255,255,0.04)',
                            border: `1px solid rgba(255,255,255,0.07)`,
                            borderRadius: 10, padding: '10px 14px',
                            display: 'flex', flexDirection: 'column', gap: 6,
                        }}>
                            {[
                                { ok: passMin8, text: 'Al menos 8 caracteres' },
                                { ok: passHasUpper, text: 'Al menos una mayúscula' },
                                { ok: passHasNum, text: 'Al menos un número' },
                                { ok: passMatch, text: 'Las contraseñas coinciden' },
                            ].map(v => (
                                <div key={v.text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{
                                        width: 15, height: 15, borderRadius: '50%',
                                        backgroundColor: v.ok ? '#10b981' : `${theme.primary}20`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    }}>
                                        {v.ok && <Check size={8} color="white" strokeWidth={3} />}
                                    </div>
                                    <span style={{ fontFamily: F, fontSize: 12, color: v.ok ? '#10b981' : 'rgba(255,255,255,0.3)' }}>{v.text}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <SaveButton
                            saved={passSaved} onClick={handleSavePass}
                            disabled={!canSavePass} theme={theme}
                            label="Actualizar contraseña"
                            savedLabel="Contraseña actualizada"
                        />
                    </div>
                </div>
            </SectionCard>
        </div>
    )
}

// ── Tab: Configuración ────────────────────────────────────────────────────────
function TabConfiguracion({ theme, role }: { theme: RoleTheme; role: string }) {
    const isSuperAdmin = role === Role.SUPER_ADMIN

    // Datos empresa / sistema
    const [negocio, setNegocio] = useState(isSuperAdmin ? 'LogiPyme HQ' : 'Distribuidora Pérez')
    const [rif, setRif] = useState('J-12345678-9')
    const [direccion, setDireccion] = useState('Av. Libertador, Caracas')
    const [telNegocio, setTelNeg] = useState('02121234567')
    const [ciudad, setCiudad] = useState('caracas')
    const [saved, setSaved] = useState(false)
    const [tRif, setTRif] = useState(false)

    const errRif = tRif && rif.length < 5 ? 'RIF inválido (ej: J-12345678-9).' : ''

    const handleSave = () => {
        setTRif(true)
        if (errRif) return
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
    }

    // Notificaciones
    const [notifs, setNotifs] = useState({
        ordenEntregada: true,
        rutaCompletada: true,
        ordenFallida: true,
        nuevaOrden: false,
        choferesSinRuta: false,
        ...(isSuperAdmin ? {
            nuevoTenant: true,
            pagoRecibido: true,
            tenantSuspendido: false,
        } : {}),
    })

    type NotifKey = keyof typeof notifs
    const baseNotifs = [
        { key: 'ordenEntregada' as NotifKey, label: 'Orden entregada', desc: 'Notificar cuando una orden sea marcada como entregada' },
        { key: 'rutaCompletada' as NotifKey, label: 'Ruta completada', desc: 'Notificar cuando un chofer complete su ruta del día' },
        { key: 'ordenFallida' as NotifKey, label: 'Orden fallida', desc: 'Alerta inmediata cuando una entrega falle' },
        { key: 'nuevaOrden' as NotifKey, label: 'Nueva orden creada', desc: 'Notificar cada vez que se registre una nueva orden' },
        { key: 'choferesSinRuta' as NotifKey, label: 'Choferes sin ruta', desc: 'Alertar si hay choferes disponibles sin ruta asignada' },
    ]
    const superNotifs = [
        { key: 'nuevoTenant' as NotifKey, label: 'Nuevo tenant registrado', desc: 'Notificar cuando una nueva PYME se registre en el sistema' },
        { key: 'pagoRecibido' as NotifKey, label: 'Pago recibido', desc: 'Notificar cuando un tenant envíe un comprobante de pago' },
        { key: 'tenantSuspendido' as NotifKey, label: 'Tenant suspendido', desc: 'Notificar cuando se suspenda manualmente un tenant' },
    ]
    const notifItems = isSuperAdmin ? [...superNotifs, ...baseNotifs] : baseNotifs

    // Zona de operación
    const ciudades = [
        { value: 'caracas', label: 'Caracas' },
        { value: 'maracaibo', label: 'Maracaibo' },
        { value: 'valencia', label: 'Valencia' },
        { value: 'barquisimeto', label: 'Barquisimeto' },
        { value: 'maracay', label: 'Maracay' },
        { value: 'barcelona', label: 'Barcelona' },
    ]

    // Idioma
    const [idioma, setIdioma] = useState('es')
    const idiomas = [
        { value: 'es', label: 'Español' },
        { value: 'en', label: 'English' },
    ]

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Datos del negocio / sistema */}
            <SectionCard
                title={isSuperAdmin ? 'Configuración del sistema' : 'Datos del negocio'}
                icon={isSuperAdmin ? <Zap size={15} /> : <Building2 size={15} />}
                theme={theme}
            >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="settings-grid">
                    <div style={{ gridColumn: '1 / -1' }}>
                        <StyledInput
                            label={isSuperAdmin ? 'Nombre del sistema' : 'Nombre del negocio'}
                            value={negocio} onChange={v => setNegocio(v.slice(0, 60))}
                            placeholder={isSuperAdmin ? 'LogiPyme' : 'Mi negocio'}
                            maxLength={60} counter theme={theme}
                        />
                    </div>
                    <StyledInput
                        label="RIF" value={rif}
                        onChange={v => setRif(sanitizeRif(v))}
                        onBlur={() => setTRif(true)}
                        placeholder="J-00000000-0"
                        maxLength={12} error={errRif} touched={tRif} theme={theme}
                    />
                    <div>
                        <label style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: theme.labelColor, display: 'block', marginBottom: 6 }}>
                            Teléfono de contacto
                        </label>
                        <input
                            value={telNegocio}
                            onChange={e => setTelNeg(sanitizeNumbers(e.target.value).slice(0, 11))}
                            placeholder="04120000000"
                            inputMode="numeric"
                            maxLength={11}
                            style={{
                                width: '100%', border: `1.5px solid ${theme.border}`, borderRadius: 12,
                                padding: '11px 13px', fontFamily: MONO, fontSize: 13,
                                color: 'rgba(255,255,255,0.9)', outline: 'none', boxSizing: 'border-box',
                                backgroundColor: 'rgba(255,255,255,0.05)', transition: 'all 0.15s',
                            }}
                            onFocus={e => { e.currentTarget.style.borderColor = theme.borderFocus; e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.focusShadow}` }}
                            onBlur={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.boxShadow = 'none' }}
                        />
                        <p style={{ fontFamily: F, fontSize: 10, color: 'rgba(255,255,255,0.28)', margin: '4px 0 0' }}>Solo dígitos, sin signos</p>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <StyledInput
                            label="Dirección" value={direccion}
                            onChange={v => setDireccion(v.slice(0, 150))}
                            placeholder="Dirección de tu negocio"
                            maxLength={150} counter theme={theme}
                        />
                    </div>
                </div>
                <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
                    <SaveButton saved={saved} onClick={handleSave} theme={theme} />
                </div>
            </SectionCard>

            {/* Zona de operación */}
            <SectionCard title="Zona de operación" icon={<MapPin size={15} />} theme={theme}>
                <p style={{ fontFamily: F, fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '0 0 14px' }}>
                    La ciudad principal determina el centro del mapa en tu dashboard.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }} className="cities-grid">
                    {ciudades.map(c => (
                        <button
                            key={c.value}
                            onClick={() => setCiudad(c.value)}
                            style={{
                                padding: '11px 14px', borderRadius: 11, cursor: 'pointer',
                                border: `1.5px solid ${ciudad === c.value ? theme.primary : theme.border}`,
                                backgroundColor: ciudad === c.value ? `${theme.primary}18` : 'rgba(255,255,255,0.04)',
                                fontFamily: F, fontSize: 13,
                                fontWeight: ciudad === c.value ? 700 : 500,
                                color: ciudad === c.value ? theme.primary : 'rgba(255,255,255,0.45)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                transition: 'all 0.15s',
                            }}
                        >
                            {ciudad === c.value && <Check size={12} strokeWidth={3} />}
                            {c.label}
                        </button>
                    ))}
                </div>
            </SectionCard>

            {/* Idioma */}
            <SectionCard title="Idioma del sistema" icon={<Globe size={15} />} theme={theme}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {idiomas.map(i => (
                        <button
                            key={i.value}
                            onClick={() => setIdioma(i.value)}
                            style={{
                                padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
                                border: `1.5px solid ${idioma === i.value ? theme.primary : theme.border}`,
                                backgroundColor: idioma === i.value ? `${theme.primary}18` : 'rgba(255,255,255,0.04)',
                                fontFamily: F, fontSize: 13,
                                fontWeight: idioma === i.value ? 700 : 500,
                                color: idioma === i.value ? theme.primary : 'rgba(255,255,255,0.45)',
                                display: 'flex', alignItems: 'center', gap: 6,
                                transition: 'all 0.15s',
                            }}
                        >
                            {idioma === i.value && <Check size={12} strokeWidth={3} />}
                            {i.label}
                        </button>
                    ))}
                </div>
            </SectionCard>

            {/* Notificaciones */}
            <SectionCard title="Notificaciones" icon={<Bell size={15} />} theme={theme}>
                <p style={{ fontFamily: F, fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '0 0 16px' }}>
                    Elige qué eventos generan una notificación en el sistema.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {notifItems.map((item, i) => (
                        <div
                            key={item.key}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                gap: 14, padding: '13px 0',
                                borderBottom: i < notifItems.length - 1 ? `1px solid ${theme.border}` : 'none',
                            }}
                        >
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)', margin: '0 0 2px' }}>
                                    {item.label}
                                </p>
                                <p style={{ fontFamily: F, fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                                    {item.desc}
                                </p>
                            </div>
                            <Toggle
                                value={notifs[item.key] ?? false}
                                onChange={v => setNotifs(prev => ({ ...prev, [item.key]: v }))}
                                theme={theme}
                            />
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* Zona peligrosa — solo SuperAdmin */}
            {isSuperAdmin && (
                <SectionCard title="Zona de riesgo" icon={<Shield size={15} />} theme={theme}>
                    <p style={{ fontFamily: F, fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '0 0 16px' }}>
                        Estas acciones tienen impacto global en todo el sistema.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[
                            { label: 'Exportar todos los datos', desc: 'Genera un CSV con todos los tenants, pagos y métricas.', color: theme.primary },
                            { label: 'Forzar sincronización de tenants', desc: 'Recalcula fechas de corte y estados de suscripción.', color: '#f59e0b' },
                            { label: 'Modo mantenimiento', desc: 'Deshabilita el acceso de todos los tenants temporalmente.', color: '#ef4444' },
                        ].map(action => (
                            <div
                                key={action.label}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    gap: 14, padding: '13px 14px', borderRadius: 12,
                                    backgroundColor: 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${action.color}20`,
                                }}
                            >
                                <div>
                                    <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: action.color, margin: '0 0 2px' }}>{action.label}</p>
                                    <p style={{ fontFamily: F, fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{action.desc}</p>
                                </div>
                                <button
                                    onClick={() => { }}
                                    style={{
                                        padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${action.color}40`,
                                        backgroundColor: `${action.color}12`, color: action.color,
                                        fontFamily: F, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                        flexShrink: 0, transition: 'all 0.15s', whiteSpace: 'nowrap',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = `${action.color}22`)}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = `${action.color}12`)}
                                >
                                    Ejecutar
                                </button>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            )}
        </div>
    )
}

// ── Page ──────────────────────────────────────────────────────────────────────
type Tab = 'perfil' | 'configuracion'

export default function SettingsPage() {
    const [tab, setTab] = useState<Tab>('perfil')
    const { user } = useAuthStore()

    const theme = THEMES[user?.role ?? ''] ?? DEFAULT_THEME
    const role = user?.role ?? ''

    // Breadcrumb label por rol
    const sectionLabel = role === Role.SUPER_ADMIN ? 'SuperAdmin' : role === Role.CHOFER ? 'Chofer' : 'Mi cuenta'

    return (
        <div style={{ fontFamily: F, maxWidth: 720, margin: '0 auto', width: '100%' }}>
            <style>{`
                @media(max-width:560px){
                    .settings-grid{grid-template-columns:1fr!important;}
                    .cities-grid{grid-template-columns:1fr 1fr!important;}
                }
            `}</style>

            {/* Header */}
            <div style={{ marginBottom: 22 }}>
                <p style={{
                    fontFamily: F, fontSize: 12, fontWeight: 700, margin: '0 0 3px',
                    background: theme.gradient,
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                    {sectionLabel}
                </p>
                <h1 style={{ fontFamily: F, fontSize: 'clamp(22px,4vw,28px)', fontWeight: 900, color: 'rgba(255,255,255,0.92)', margin: '0 0 2px', letterSpacing: '-0.02em' }}>
                    Perfil y Configuración
                </h1>
                <p style={{ fontFamily: F, fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                    {user?.email}
                </p>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex', gap: 3, marginBottom: 22,
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: `1px solid ${theme.border}`,
                borderRadius: 13, padding: 3,
                width: 'fit-content',
            }}>
                {([
                    { key: 'perfil', label: 'Mi Perfil', icon: <User size={14} /> },
                    { key: 'configuracion', label: 'Configuración', icon: <Settings size={14} /> },
                ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 18px', borderRadius: 10,
                            border: 'none', cursor: 'pointer',
                            fontFamily: F, fontSize: 13, fontWeight: 600,
                            transition: 'all 0.2s',
                            backgroundColor: tab === t.key ? theme.tabActive : 'transparent',
                            color: tab === t.key ? theme.tabActiveTxt : 'rgba(255,255,255,0.4)',
                            boxShadow: tab === t.key ? `0 2px 10px ${theme.saveShadow}` : 'none',
                        }}
                    >
                        <span style={{ color: tab === t.key ? theme.tabActiveTxt : 'rgba(255,255,255,0.3)' }}>{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Contenido */}
            {tab === 'perfil' && <TabPerfil theme={theme} />}
            {tab === 'configuracion' && <TabConfiguracion theme={theme} role={role} />}
        </div>
    )
}