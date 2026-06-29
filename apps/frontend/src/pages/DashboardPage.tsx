import { useEffect, useState } from 'react'
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

type ToolInfo = HerramientasDisponibles['herramientas'][number]

function ToolAvatar({ tool }: { tool: ToolInfo | AccesoReciente['herramienta'] }) {
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 select-none"
      style={{ background: toolColor(tool.id) }}
    >
      {tool.icono_url ? (
        <img src={tool.icono_url} alt="" className="w-6 h-6 object-contain" />
      ) : (
        tool.nombre[0].toUpperCase()
      )}
    </div>
  )
}

function SkeletonLevelCard() {
  return (
    <div className="bg-bg-card border border-border-card rounded-xl p-5 flex items-center gap-5 animate-pulse">
      <div className="w-14 h-14 rounded-xl bg-white/10 flex-shrink-0" />
      <div className="flex-1 space-y-2.5">
        <div className="h-5 bg-white/10 rounded w-2/5" />
        <div className="h-4 bg-white/10 rounded w-1/3" />
      </div>
    </div>
  )
}

function SkeletonToolCard() {
  return (
    <div className="bg-bg-card border border-border-card rounded-xl p-4 animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex-shrink-0" />
        <div className="flex-1 space-y-2 min-w-0 pt-0.5">
          <div className="h-4 bg-white/10 rounded w-3/4" />
          <div className="h-3 bg-white/10 rounded w-1/2" />
        </div>
      </div>
      <div className="h-7 bg-white/10 rounded-lg w-full" />
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

    Promise.all([getAccesosRecientes(4), getHerramientasDisponibles()])
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

  // Quick access: historial reciente si hay, sino primeras 4 herramientas disponibles
  const quickTools: (ToolInfo | AccesoReciente['herramienta'])[] =
    recientes.length > 0
      ? recientes.map((a) => a.herramienta)
      : (disponibles?.herramientas.slice(0, 4) ?? [])

  const quickLabel = recientes.length > 0 ? 'Accesos recientes' : 'Accesos rápidos'

  return (
    <div className="p-6 max-w-5xl mx-auto">

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
          <div className="flex items-center gap-2 bg-accent/10 border border-accent/25 rounded-lg px-3.5 py-2 flex-shrink-0">
            <span className="text-accent text-base font-bold leading-none">
              {disponibles.total}
            </span>
            <span className="text-text-secondary text-xs leading-tight">
              herramienta{disponibles.total !== 1 ? 's' : ''}<br />disponible{disponibles.total !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {error && (
        <p className="text-status-inactive bg-status-inactive/10 border border-status-inactive/30 rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
        </p>
      )}

      {/* ── Accesos disponibles (niveles raíz) ─────────────────────── */}
      <section className="mb-8">
        <h2 className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-4">
          Accesos disponibles
        </h2>

        {loadingNiveles ? (
          <div className="space-y-3">
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
          <div className="space-y-3">
            {[...niveles]
              .sort((a, b) => a.orden - b.orden)
              .map((nivel) => (
                <NivelCard key={nivel.id} nivel={nivel} />
              ))}
          </div>
        )}
      </section>

      {/* ── Accesos rápidos / recientes ─────────────────────────────── */}
      {(loadingAccesos || quickTools.length > 0) && (
        <section>
          <h2 className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-4">
            {quickLabel}
          </h2>

          {loadingAccesos ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => <SkeletonToolCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {quickTools.map((tool) => (
                <div
                  key={tool.id}
                  className="bg-bg-card border border-border-card rounded-xl p-4 flex flex-col gap-3
                             transition-all duration-200 hover:border-accent hover:-translate-y-0.5
                             hover:shadow-[0_8px_20px_rgba(124,58,237,0.2)]"
                >
                  <div className="flex items-start gap-3">
                    <ToolAvatar tool={tool} />
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary text-sm font-semibold leading-snug truncate">
                        {tool.nombre}
                      </p>
                      {tool.descripcion && (
                        <p className="text-text-secondary text-xs mt-0.5 line-clamp-2 leading-relaxed">
                          {tool.descripcion}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAbrir(tool.id)}
                    disabled={openingId === tool.id}
                    className="w-full text-center text-xs text-accent border border-accent/30
                               rounded-lg py-1.5 hover:bg-accent/10 transition-colors
                               disabled:opacity-50 font-medium"
                  >
                    {openingId === tool.id ? '…' : 'Abrir →'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

    </div>
  )
}
