import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const LIMITE_INACTIVIDAD_MS = 30 * 60 * 1000 // 30 minutos
const AVISO_ANTES_MS = 60 * 1000 // avisar 1 minuto antes de cerrar sesión
const EVENTOS_ACTIVIDAD = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const

export default function InactivityGuard() {
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const ultimaActividad = useRef(Date.now())
  const [mostrarAviso, setMostrarAviso] = useState(false)
  const [segundosRestantes, setSegundosRestantes] = useState(60)
  const mostrarAvisoRef = useRef(false)

  // Mientras el aviso esté visible, la actividad "pasiva" (mouse/teclado/
  // scroll/click en cualquier lado) ya no cuenta — a partir de ahí, la
  // única forma de extender la sesión es el clic explícito en "Seguir
  // conectado". Se usa un ref (no el state) para poder leer el valor
  // actual desde el listener sin tener que reinstalarlo en cada cambio.
  useEffect(() => {
    mostrarAvisoRef.current = mostrarAviso
  }, [mostrarAviso])

  const registrarActividadPasiva = useCallback(() => {
    if (mostrarAvisoRef.current) return
    ultimaActividad.current = Date.now()
  }, [])

  const seguirConectado = useCallback(() => {
    ultimaActividad.current = Date.now()
    setMostrarAviso(false)
  }, [])

  // Si la sesión termina por cualquier motivo mientras el aviso está en
  // pantalla (logout manual, este mismo guard, u otro guard de la app), no
  // debe quedar colgado — se oculta apenas isAuthenticated pasa a false.
  useEffect(() => {
    if (!isAuthenticated) setMostrarAviso(false)
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return

    // Arrancar el contador desde el momento real del login, no desde que
    // cargó la página — sin esto, si tardás más que el límite en completar
    // el formulario de login, el primer chequeo ya encuentra el límite
    // superado y desconecta al instante.
    ultimaActividad.current = Date.now()

    for (const evento of EVENTOS_ACTIVIDAD) {
      window.addEventListener(evento, registrarActividadPasiva)
    }

    const intervalo = setInterval(() => {
      const restante = LIMITE_INACTIVIDAD_MS - (Date.now() - ultimaActividad.current)

      if (restante <= 0) {
        clearInterval(intervalo)
        // Se pasa el motivo por sessionStorage en vez de state de react-router:
        // AppLayout también redirige a /login (sin state) apenas isAuthenticated
        // pasa a false, y esa carrera pisaba el state que este navigate() seteaba.
        sessionStorage.setItem('toolbox_logout_motivo', 'inactividad')
        logout()
        navigate('/login')
        return
      }

      if (restante <= AVISO_ANTES_MS) {
        setMostrarAviso(true)
        setSegundosRestantes(Math.ceil(restante / 1000))
      }
    }, 1000)

    return () => {
      for (const evento of EVENTOS_ACTIVIDAD) {
        window.removeEventListener(evento, registrarActividadPasiva)
      }
      clearInterval(intervalo)
    }
  }, [isAuthenticated, logout, navigate, registrarActividadPasiva])

  if (!mostrarAviso) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div
        className="bg-[#2a1f45] rounded-2xl w-full max-w-md p-8 text-center"
        style={{
          border: '1px solid #7c3aed',
          boxShadow: '0 0 40px rgba(124,58,237,0.3), 0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <h2 className="text-text-primary text-xl font-bold mb-2">¿Seguís ahí?</h2>
        <p className="text-text-secondary text-sm mb-6">
          Tu sesión se va a cerrar por inactividad en{' '}
          <span className="text-accent font-semibold">{segundosRestantes}s</span>.
        </p>
        <button
          type="button"
          onClick={seguirConectado}
          className="w-full bg-gradient-to-r from-[#7c3aed] to-[#5b21b6] hover:from-[#8b5cf6] hover:to-[#6d28d9] text-white font-semibold py-3 rounded-lg transition-all text-sm"
        >
          Seguir conectado
        </button>
      </div>
    </div>
  )
}
