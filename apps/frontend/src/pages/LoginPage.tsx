import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { login as loginApi, forgotPassword as forgotPasswordApi } from '../api/auth.api'
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

const FEATURES = [
  { icon: '⚡', text: 'Acceso centralizado a todas las herramientas' },
  { icon: '🔒', text: 'Control de acceso por niveles organizacionales' },
  { icon: '📊', text: 'Auditoría y registro de accesos en tiempo real' },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [recordarme, setRecordarme] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await loginApi({ email, password })
      login(data.access_token, data.usuario)
      navigate('/dashboard')
    } catch {
      setError('Credenciales inválidas. Verificá tu email y contraseña.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full bg-[#160e28] border border-[rgba(124,58,237,0.25)] rounded-lg px-4 py-2.5 text-text-primary placeholder-text-secondary/40 focus:outline-none focus:border-accent transition-colors text-sm'

  return (
    <>
    <div className="min-h-screen flex">

      {/* ── Panel izquierdo — branding ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-1/2 relative overflow-hidden">

        <div className="absolute inset-0 bg-[#0a0a0f]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-violet-600/20 blur-[140px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-r from-transparent to-[#1e1530] z-20 pointer-events-none" />

        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(124,58,237,1) 1px, transparent 1px), linear-gradient(to right, rgba(124,58,237,1) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />

        <svg
          className="absolute bottom-0 left-0 w-[58%] pointer-events-none"
          viewBox="0 0 520 180"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0,90 C70,45 180,130 300,85 C400,50 480,100 520,70 L520,180 L0,180 Z" fill="rgba(124,58,237,0.10)" />
          <path d="M0,130 C90,100 200,155 340,125 C440,103 500,135 520,118 L520,180 L0,180 Z" fill="rgba(109,40,217,0.07)" />
          <path d="M0,160 C110,148 240,168 380,158 L380,180 L0,180 Z" fill="rgba(124,58,237,0.04)" />
        </svg>

        <div className="relative z-10 flex flex-col w-full">
          <div className="flex-1 flex flex-col items-center justify-center px-12 py-16 text-center">

            {/* Cubo + nombre */}
            <div className="flex items-center gap-5 mb-7">
              <CubeIcon className="w-24 h-24" />
              <span className="text-[2.8rem] font-bold text-white tracking-[0.18em] leading-none">
                TOOLBOX
              </span>
            </div>

            <p className="text-purple-300/70 text-[1.05rem] font-light leading-relaxed max-w-[18rem] mb-12">
              Portal central de herramientas corporativas
            </p>

            <div className="space-y-4 text-left w-full max-w-[22rem]">
              {FEATURES.map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/8 text-sm flex-shrink-0">
                    {item.icon}
                  </span>
                  <span className="text-white/38 text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="px-12 py-6 border-t border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-accent/30 flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 rounded-sm bg-accent/70" />
              </div>
              <span className="text-white/20 text-xs font-medium tracking-wide">HoldingMax</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Panel derecho — formulario ──────────────────────────────────── */}
      <div className="flex-1 min-h-screen flex flex-col bg-[#1e1530]">
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="w-full max-w-[390px]">

            {/* Logo móvil */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
              <CubeIcon className="w-10 h-10" />
              <div>
                <h1 className="text-2xl font-bold text-text-primary tracking-wide">TOOLBOX</h1>
                <p className="text-text-secondary text-xs mt-0.5">Portal de herramientas corporativas</p>
              </div>
            </div>

            <div
              className="bg-[#2a1f45] rounded-2xl p-8"
              style={{
                border: '1px solid #7c3aed',
                boxShadow: '0 0 40px rgba(124,58,237,0.3), 0 20px 60px rgba(0,0,0,0.5)',
              }}
            >
              <div className="mb-7">
                <h2 className="text-text-primary text-2xl font-bold mb-1">Bienvenido</h2>
                <p className="text-text-secondary text-sm">
                  Ingresá tus credenciales para acceder al portal
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">

                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tu@email.com"
                    autoComplete="email"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-text-secondary text-sm font-medium mb-1.5">Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                    >
                      {showPass ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={recordarme}
                      onChange={(e) => setRecordarme(e.target.checked)}
                      className="w-4 h-4 rounded border-border-card bg-bg-base cursor-pointer accent-accent"
                    />
                    <span className="text-text-secondary text-sm">Recordarme</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-accent hover:text-accent-hover text-sm transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                {error && (
                  <div className="text-status-inactive text-sm bg-status-inactive/10 border border-status-inactive/30 rounded-lg px-3 py-2.5">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#7c3aed] to-[#5b21b6] hover:from-[#8b5cf6] hover:to-[#6d28d9] disabled:opacity-60 text-white font-semibold py-3.5 rounded-lg transition-all text-sm mt-1"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Ingresando…
                    </span>
                  ) : (
                    'Ingresar →'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="px-8 py-4 border-t border-white/[0.07]">
          <p className="text-white/20 text-xs text-center">HoldingMax © 2026</p>
        </div>
      </div>

    </div>
    {showForgotModal && (
      <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />
    )}
    </>
  )
}

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  const inputClass =
    'w-full bg-[#160e28] border border-[rgba(124,58,237,0.25)] rounded-lg px-4 py-2.5 text-text-primary placeholder-text-secondary/40 focus:outline-none focus:border-accent transition-colors text-sm'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      await forgotPasswordApi(email)
      setEnviado(true)
    } catch (err: any) {
      if (err?.response) {
        // Respuesta del backend (400 validación, 429 rate limit, etc.) — no
        // revela si el email existe, se puede mostrar tal cual.
        const msg = err.response.data?.message ?? 'Ocurrió un error. Intentá de nuevo.'
        setError(Array.isArray(msg) ? msg.join(' · ') : msg)
      } else {
        // Sin respuesta del backend: falla de red real, no un resultado de
        // negocio — no corresponde fingir éxito.
        setError('No se pudo conectar. Revisá tu conexión e intentá de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div
        className="bg-[#2a1f45] rounded-2xl w-full max-w-md p-8"
        style={{
          border: '1px solid #7c3aed',
          boxShadow: '0 0 40px rgba(124,58,237,0.3), 0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-text-primary text-xl font-bold">Recuperar contraseña</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="text-text-secondary hover:text-text-primary transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {enviado ? (
          <>
            <p className="text-text-secondary text-sm mt-4 mb-6">
              Si el email existe, te enviamos un link para recuperar tu contraseña. Revisá tu casilla.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-white/5 hover:bg-white/10 text-text-secondary rounded-lg py-2.5 text-sm font-medium transition-colors"
            >
              Cerrar
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4">
            <p className="text-text-secondary text-sm mb-4">
              Ingresá tu email y te enviamos un link para recuperar tu contraseña.
            </p>

            {error && (
              <div className="text-status-inactive text-sm bg-status-inactive/10 border border-status-inactive/30 rounded-lg px-3 py-2.5 mb-4">
                {error}
              </div>
            )}

            <label className="block text-text-secondary text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
              autoComplete="email"
              className={inputClass}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#7c3aed] to-[#5b21b6] hover:from-[#8b5cf6] hover:to-[#6d28d9] disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-all text-sm mt-5"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando…
                </span>
              ) : (
                'Enviar link de recuperación'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
