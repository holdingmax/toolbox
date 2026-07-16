import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  getRootNodes,
  getAccesosRecientes,
  getHerramientasDisponibles,
  registrarAcceso,
  type NivelResumen,
  type AccesoReciente,
  type HerramientasDisponibles,
} from '../api/navegacion.api'
import NivelCard from '../components/NivelCard'
import AtajoDirectoCard from '../components/AtajoDirectoCard'

function getFechaActual(): string {
  const f = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
  return f.charAt(0).toUpperCase() + f.slice(1)
}

const TOOL_COLORS = [
  '#7c3aed', '#2563eb', '#059669',
  '#dc2626', '#d97706', '#0891b2', '#db2777',
]

function toolColor(id: string): string {
  const sum = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return TOOL_COLORS[sum % TOOL_COLORS.length]
}

function SkeletonLevelCard() {
  return (
    <div className="relative bg-bg-card border border-border-card rounded-2xl min-h-[200px] overflow-hidden animate-pulse">
      <div className="absolute inset-0 bg-white/5" />
      <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-2">
        <div className="h-4 bg-white/10 rounded-full w-1/4" />
        <div className="h-5 bg-white/10 rounded w-3/5" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { usuario } = useAuth()
  const fecha = getFechaActual()

  const [niveles, setNiveles] = useState<NivelResumen[]>([])
  const [loadingNiveles, setLoadingNiveles] = useState(true)

  const [recientes, setRecientes] = useState<AccesoReciente[]>([])
  const [disponibles, setDisponibles] = useState<HerramientasDisponibles | null>(null)
  const [loadingAccesos, setLoadingAccesos] = useState(true)

  const [openingId, setOpeningId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getRootNodes()
      .then(setNiveles)
      .catch(() => setError('No se pudo cargar la navegación.'))
      .finally(() => setLoadingNiveles(false))

    Promise.all([getAccesosRecientes(3), getHerramientasDisponibles()])
      .then(([r, d]) => {
        setRecientes(r)
        setDisponibles(d)
      })
      .catch(() => {})
      .finally(() => setLoadingAccesos(false))
  }, [])

  const handleAbrir = async (id: string) => {
    if (openingId) return
    setOpeningId(id)
    try {
      const { url } = await registrarAcceso(id)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      // silencioso
    } finally {
      setOpeningId(null)
    }
  }

  const seccionListaLista = !loadingNiveles && !loadingAccesos

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col min-h-full">

      {/* ── Saludo ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            ¡Hola, {usuario?.nombre.split(' ')[0]}!
          </h1>
          <p className="text-text-secondary text-sm mt-1">{fecha}</p>
        </div>

        {/* Contador de herramientas */}
        {!loadingAccesos && disponibles && disponibles.total > 0 && (
          <div className="flex items-center gap-1.5 bg-accent/10 border border-accent/25 rounded-lg px-3.5 py-2 flex-shrink-0">
            <span className="text-text-secondary text-xs leading-none">acceso a</span>
            <span className="text-accent text-base font-bold leading-none">
              {disponibles.total}
            </span>
            <span className="text-text-secondary text-xs leading-none">
              herramienta{disponibles.total !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {usuario?.debe_cambiar_password && (
        <div className="flex items-center justify-between gap-4 bg-accent/10 border border-accent/25 rounded-lg px-4 py-3 mb-6 text-sm">
          <span className="text-text-primary">
            🔑 Estás usando una contraseña temporal — te recomendamos cambiarla.
          </span>
          <Link
            to="/configuracion"
            className="text-accent hover:text-accent-hover font-semibold whitespace-nowrap transition-colors"
          >
            Cambiar ahora →
          </Link>
        </div>
      )}

      {error && (
        <p className="text-status-inactive bg-status-inactive/10 border border-status-inactive/30 rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
        </p>
      )}

      {/* ── Atajo directo (1 sola herramienta) o accesos disponibles (niveles raíz) ── */}
      {seccionListaLista && disponibles?.total === 1 ? (
        <section className="mb-8">
          <h2 className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-4">
            Tu acceso
          </h2>
          <AtajoDirectoCard
            herramienta={disponibles.herramientas[0]}
            onAbrir={() => handleAbrir(disponibles.herramientas[0].id)}
            abriendo={openingId === disponibles.herramientas[0].id}
          />
        </section>
      ) : (
        <section className="flex-1 mb-8">
          <h2 className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-4">
            Accesos disponibles
          </h2>

          {!seccionListaLista ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <SkeletonLevelCard key={i} />)}
            </div>
          ) : niveles.length === 0 ? (
            <div className="bg-bg-card border border-border-card rounded-xl p-10 text-center">
              <p className="text-4xl mb-3">🔒</p>
              <p className="text-text-primary font-medium mb-1">Sin accesos habilitados</p>
              <p className="text-text-secondary text-sm">
                Contactá al administrador para solicitar permisos.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...niveles]
                .sort((a, b) => a.orden - b.orden)
                .map((nivel) => (
                  <NivelCard key={nivel.id} nivel={nivel} />
                ))}
            </div>
          )}
        </section>
      )}

      {/* ── Recientes — lista discreta al pie ──────────────────────── */}
      {!loadingAccesos && recientes.length > 0 && (
        <div className="mt-12 pt-6 border-t border-white/[0.06]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-secondary/85 mb-3">
            Accesos recientes
          </p>
          <div className="flex flex-col gap-0.5">
            {recientes.slice(0, 3).map((acceso) => {
              const tool = acceso.herramienta
              return (
                <div key={tool.id} className="flex items-center justify-between py-1.5 group">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0 opacity-50"
                      style={{ background: toolColor(tool.id) }}
                    />
                    <span className="text-[13px] text-text-secondary/85 truncate leading-none">
                      {tool.nombre}
                    </span>
                  </div>
                  <button
                    onClick={() => handleAbrir(tool.id)}
                    disabled={openingId === tool.id}
                    className="text-[11px] text-accent hover:text-accent-hover hover:underline transition-colors disabled:opacity-40 font-semibold flex-shrink-0 ml-4"
                  >
                    {openingId === tool.id ? '…' : 'Abrir →'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
