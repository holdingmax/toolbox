import { useState, useEffect, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { changePassword } from '../api/auth.api'
import { getRootNodes, type NivelResumen } from '../api/navegacion.api'

function getInitials(nombre: string): string {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function EyeIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

export default function ConfiguracionPage() {
  const { usuario } = useAuth()

  // ── Nivel raíz para mostrar organizaciones con acceso ────────────────────────
  const [niveles, setNiveles] = useState<NivelResumen[]>([])
  const [loadingNiveles, setLoadingNiveles] = useState(true)

  useEffect(() => {
    getRootNodes()
      .then((data) => setNiveles(data.sort((a, b) => a.orden - b.orden)))
      .catch(() => setNiveles([]))
      .finally(() => setLoadingNiveles(false))
  }, [])

  // ── Cambio de contraseña ─────────────────────────────────────────────────────
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [showActual, setShowActual] = useState(false)
  const [showNueva, setShowNueva] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)
  const [saving, setSaving] = useState(false)
  const [passError, setPassError] = useState<string | null>(null)
  const [passOk, setPassOk] = useState(false)

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    setPassError(null)
    setPassOk(false)

    if (nueva.length < 6) {
      setPassError('La nueva contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (nueva !== confirmar) {
      setPassError('La nueva contraseña y la confirmación no coinciden.')
      return
    }

    setSaving(true)
    try {
      await changePassword(actual, nueva)
      setPassOk(true)
      setActual('')
      setNueva('')
      setConfirmar('')
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Ocurrió un error. Intentá de nuevo.'
      setPassError(Array.isArray(msg) ? msg.join(' · ') : msg)
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full bg-white/5 border border-border-card text-text-primary rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors'

  const sectionClass =
    'bg-bg-card border border-border-card rounded-xl overflow-hidden'

  const sectionHeaderClass =
    'px-6 py-4 border-b border-border-card'

  if (!usuario) return null

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-text-primary text-2xl font-bold">Configuración</h1>
        <p className="text-text-secondary text-sm mt-0.5">Perfil y seguridad de tu cuenta</p>
      </div>

      {/* ── Información personal ──────────────────────────────────────────────── */}
      <div className={`${sectionClass} mb-5`}>
        <div className={sectionHeaderClass}>
          <h2 className="text-text-primary font-semibold">Información personal</h2>
        </div>

        <div className="px-6 py-6">
          {/* Avatar + nombre/email/rol */}
          <div className="flex items-center gap-5 mb-6">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 select-none"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}
            >
              {getInitials(usuario.nombre)}
            </div>
            <div>
              <p className="text-text-primary text-xl font-bold leading-snug">{usuario.nombre}</p>
              <p className="text-text-secondary text-sm mt-0.5">{usuario.email}</p>
              <span className="inline-block mt-2 text-xs px-2.5 py-1 rounded-full bg-accent/20 text-accent font-medium">
                {usuario.rol.nombre}
              </span>
            </div>
          </div>

          {/* Campos de solo lectura */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-text-secondary text-xs font-medium uppercase tracking-wider mb-1.5">
                  Nombre completo
                </label>
                <div className="bg-white/[0.03] border border-border-card rounded-lg px-3 py-2.5 text-text-primary text-sm">
                  {usuario.nombre}
                </div>
              </div>
              <div>
                <label className="block text-text-secondary text-xs font-medium uppercase tracking-wider mb-1.5">
                  Correo electrónico
                </label>
                <div className="bg-white/[0.03] border border-border-card rounded-lg px-3 py-2.5 text-text-primary text-sm">
                  {usuario.email}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-text-secondary text-xs font-medium uppercase tracking-wider mb-1.5">
                Rol
              </label>
              <div className="bg-white/[0.03] border border-border-card rounded-lg px-3 py-2.5 text-text-primary text-sm">
                {usuario.rol.nombre}
              </div>
            </div>

            {/* Organizaciones con acceso */}
            <div>
              <label className="block text-text-secondary text-xs font-medium uppercase tracking-wider mb-1.5">
                Organizaciones con acceso
              </label>
              {loadingNiveles ? (
                <div className="flex gap-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-7 w-24 rounded-full bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : niveles.length === 0 ? (
                <p className="text-text-secondary text-sm">Sin accesos asignados</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {niveles.map((n) => (
                    <span
                      key={n.id}
                      className="inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full bg-white/5 border border-border-card text-text-primary"
                    >
                      <span className="text-base leading-none">🏢</span>
                      {n.nombre}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Cambiar contraseña ────────────────────────────────────────────────── */}
      <div className={sectionClass}>
        <div className={sectionHeaderClass}>
          <h2 className="text-text-primary font-semibold">Cambiar contraseña</h2>
          <p className="text-text-secondary text-xs mt-0.5">La nueva contraseña debe tener al menos 6 caracteres</p>
        </div>

        <form onSubmit={handleChangePassword} className="px-6 py-6 space-y-4">
          {passError && (
            <div className="text-sm text-status-inactive bg-status-inactive/10 border border-status-inactive/30 rounded-lg px-3 py-2.5">
              {passError}
            </div>
          )}
          {passOk && (
            <div className="text-sm text-status-active bg-status-active/10 border border-status-active/30 rounded-lg px-3 py-2.5">
              Contraseña actualizada correctamente.
            </div>
          )}

          {/* Contraseña actual */}
          <div>
            <label className="block text-text-secondary text-sm font-medium mb-1.5">
              Contraseña actual
            </label>
            <div className="relative">
              <input
                type={showActual ? 'text' : 'password'}
                value={actual}
                onChange={(e) => setActual(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowActual((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
              >
                {showActual ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Nueva contraseña */}
          <div>
            <label className="block text-text-secondary text-sm font-medium mb-1.5">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                type={showNueva ? 'text' : 'password'}
                value={nueva}
                onChange={(e) => { setNueva(e.target.value); setPassOk(false) }}
                required
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowNueva((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
              >
                {showNueva ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Confirmar nueva contraseña */}
          <div>
            <label className="block text-text-secondary text-sm font-medium mb-1.5">
              Confirmar nueva contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirmar ? 'text' : 'password'}
                value={confirmar}
                onChange={(e) => { setConfirmar(e.target.value); setPassOk(false) }}
                required
                placeholder="Repetí la nueva contraseña"
                autoComplete="new-password"
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmar((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
              >
                {showConfirmar ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {/* Indicador de coincidencia en vivo */}
            {confirmar.length > 0 && (
              <p className={`text-xs mt-1.5 ${nueva === confirmar ? 'text-status-active' : 'text-status-inactive'}`}>
                {nueva === confirmar ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
              </p>
            )}
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={saving || !actual || !nueva || !confirmar}
              className="bg-gradient-to-r from-[#7c3aed] to-[#5b21b6] hover:from-[#8b5cf6] hover:to-[#6d28d9]
                         disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg
                         transition-all text-sm"
            >
              {saving ? 'Actualizando…' : 'Actualizar contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
