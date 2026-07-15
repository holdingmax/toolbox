import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { changePassword } from '../api/auth.api'
import CubeIcon from '../components/CubeIcon'

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

export default function CambioPasswordObligatorioPage() {
  const { isAuthenticated, actualizarUsuario, logout } = useAuth()
  const navigate = useNavigate()

  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [showActual, setShowActual] = useState(false)
  const [showNueva, setShowNueva] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!isAuthenticated) return <Navigate to="/login" replace />

  const inputClass =
    'w-full bg-[#160e28] border border-[rgba(124,58,237,0.25)] rounded-lg px-4 py-2.5 text-text-primary placeholder-text-secondary/40 focus:outline-none focus:border-accent transition-colors text-sm'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (nueva.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (nueva !== confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setSaving(true)
    try {
      await changePassword(actual, nueva)
      actualizarUsuario({ debe_cambiar_password: false })
      navigate('/dashboard')
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Ocurrió un error. Intentá de nuevo.'
      setError(Array.isArray(msg) ? msg.join(' · ') : msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1e1530] px-8">
      <div className="w-full max-w-[420px]">
        <div className="flex items-center justify-center gap-3 mb-8">
          <CubeIcon className="w-10 h-10" />
          <h1 className="text-2xl font-bold text-text-primary tracking-wide">TOOLBOX</h1>
        </div>

        <div
          className="bg-[#2a1f45] rounded-2xl p-8"
          style={{
            border: '1px solid #7c3aed',
            boxShadow: '0 0 40px rgba(124,58,237,0.3), 0 20px 60px rgba(0,0,0,0.5)',
          }}
        >
          <div className="mb-7">
            <h2 className="text-text-primary text-2xl font-bold mb-1">Cambio de contraseña obligatorio</h2>
            <p className="text-text-secondary text-sm">
              Por seguridad, necesitás elegir una contraseña nueva antes de poder seguir
              usando Toolbox. La contraseña actual te la asignó un administrador.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-1.5">Contraseña actual</label>
              <div className="relative">
                <input
                  type={showActual ? 'text' : 'password'}
                  value={actual}
                  onChange={(e) => setActual(e.target.value)}
                  required
                  placeholder="La que te asignaron"
                  autoComplete="current-password"
                  className={`${inputClass} pr-10`}
                />
                <button type="button" onClick={() => setShowActual((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors">
                  {showActual ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-text-secondary text-sm font-medium mb-1.5">Nueva contraseña</label>
              <div className="relative">
                <input
                  type={showNueva ? 'text' : 'password'}
                  value={nueva}
                  onChange={(e) => setNueva(e.target.value)}
                  required
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  className={`${inputClass} pr-10`}
                />
                <button type="button" onClick={() => setShowNueva((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors">
                  {showNueva ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-text-secondary text-sm font-medium mb-1.5">Confirmar nueva contraseña</label>
              <div className="relative">
                <input
                  type={showConfirmar ? 'text' : 'password'}
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  required
                  placeholder="Repetí la nueva contraseña"
                  autoComplete="new-password"
                  className={`${inputClass} pr-10`}
                />
                <button type="button" onClick={() => setShowConfirmar((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors">
                  {showConfirmar ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {confirmar.length > 0 && (
                <p className={`text-xs mt-1.5 ${nueva === confirmar ? 'text-status-active' : 'text-status-inactive'}`}>
                  {nueva === confirmar ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
                </p>
              )}
            </div>

            {error && (
              <div className="text-status-inactive text-sm bg-status-inactive/10 border border-status-inactive/30 rounded-lg px-3 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-[#7c3aed] to-[#5b21b6] hover:from-[#8b5cf6] hover:to-[#6d28d9] disabled:opacity-60 text-white font-semibold py-3.5 rounded-lg transition-all text-sm mt-1"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Actualizando…
                </span>
              ) : (
                'Cambiar contraseña →'
              )}
            </button>
          </form>

          <button
            type="button"
            onClick={() => { logout(); navigate('/login') }}
            className="w-full text-center text-text-secondary hover:text-text-primary text-xs mt-4 transition-colors"
          >
            ¿No recordás tu contraseña temporal? Cerrá sesión y volvé al login — desde ahí podés pedir un link de recupero
          </button>
        </div>
      </div>
    </div>
  )
}
