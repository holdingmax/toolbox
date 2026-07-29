import { useState, useEffect } from 'react'
import {
  getProyectosAutomatizacionVisibles,
  ESTADOS_PROYECTO_AUTOMATIZACION,
  ESTADO_LABELS,
  formatFechaProyecto,
  type ProyectoAutomatizacion,
} from '../api/proyectos-automatizacion.api'

// Un solo mapeo de color por estado, reusado tanto para el borde de la
// tarjeta como para el punto de la columna — mismo criterio visual en los
// dos lugares.
const ESTADO_COLOR: Record<
  string,
  { borde: string; punto: string; fondo: string; chipBorde: string; chipFondo: string }
> = {
  pendiente: {
    borde: 'border-l-slate-400',
    punto: 'bg-slate-400',
    fondo: 'bg-slate-400/[0.06]',
    chipBorde: 'border-slate-400/30',
    chipFondo: 'bg-slate-400/15',
  },
  iniciado: {
    borde: 'border-l-blue-400',
    punto: 'bg-blue-400',
    fondo: 'bg-blue-500/[0.06]',
    chipBorde: 'border-blue-400/30',
    chipFondo: 'bg-blue-500/15',
  },
  en_proceso: {
    borde: 'border-l-amber-400',
    punto: 'bg-amber-400',
    fondo: 'bg-amber-500/[0.06]',
    chipBorde: 'border-amber-400/30',
    chipFondo: 'bg-amber-500/15',
  },
  testing: {
    borde: 'border-l-violet-400',
    punto: 'bg-violet-400',
    fondo: 'bg-violet-500/[0.06]',
    chipBorde: 'border-violet-400/30',
    chipFondo: 'bg-violet-500/15',
  },
  finalizado: {
    borde: 'border-l-status-active',
    punto: 'bg-status-active',
    fondo: 'bg-status-active/[0.06]',
    chipBorde: 'border-status-active/30',
    chipFondo: 'bg-status-active/15',
  },
  pausado: {
    borde: 'border-l-slate-600',
    punto: 'bg-slate-600',
    fondo: 'bg-slate-600/[0.06]',
    chipBorde: 'border-slate-600/30',
    chipFondo: 'bg-slate-600/15',
  },
}

const ESTADO_COLOR_DEFAULT = ESTADO_COLOR.pendiente

function ProyectoCard({ proyecto }: { proyecto: ProyectoAutomatizacion }) {
  const color = ESTADO_COLOR[proyecto.estado] ?? ESTADO_COLOR_DEFAULT

  return (
    <div className={`border border-border-card border-l-4 rounded-xl p-4 ${color.borde} ${color.fondo}`}>
      <p className="text-accent font-bold text-base leading-snug mb-2">{proyecto.titulo}</p>
      <span
        className={`inline-block border rounded-full px-2 py-0.5 text-[11px] text-text-secondary mb-2 ${color.chipBorde} ${color.chipFondo}`}
      >
        {proyecto.nivel.nombre}
      </span>
      {proyecto.fecha_inicio && (
        <p className="text-text-secondary/70 text-xs mb-2">
          Inicio: {formatFechaProyecto(proyecto.fecha_inicio)}
        </p>
      )}
      {proyecto.notas && (
        <p className="text-text-secondary text-xs mt-2 border-t border-border-card pt-2 line-clamp-3 overflow-hidden whitespace-pre-wrap">
          {proyecto.notas}
        </p>
      )}
    </div>
  )
}

function ColumnaSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2].map((i) => (
        <div key={i} className="bg-bg-card border border-border-card rounded-xl h-24 animate-pulse" />
      ))}
    </div>
  )
}

export default function ProyectosAutomatizacionTableroPage() {
  const [proyectos, setProyectos] = useState<ProyectoAutomatizacion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProyectosAutomatizacionVisibles()
      .then(setProyectos)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-text-primary text-2xl font-bold">Proyectos de automatización</h1>
        <p className="text-text-secondary text-sm mt-0.5">
          Seguimiento de las áreas a las que tenés acceso
        </p>
      </div>

      {!loading && proyectos.length === 0 ? (
        <div className="bg-bg-card border border-border-card rounded-xl p-10 text-center">
          <p className="text-4xl mb-3">🤖</p>
          <p className="text-text-secondary text-sm">No hay proyectos de automatización en seguimiento para tus áreas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {ESTADOS_PROYECTO_AUTOMATIZACION.map((estado) => {
            const items = proyectos.filter((p) => p.estado === estado)
            const color = ESTADO_COLOR[estado] ?? ESTADO_COLOR_DEFAULT
            return (
              <div key={estado} className="flex flex-col gap-3">
                <h2 className="flex items-center gap-1.5 text-text-secondary text-xs font-semibold uppercase tracking-wider">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${color.punto}`} />
                  {ESTADO_LABELS[estado]}
                  {items.length > 0 && (
                    <span className="inline-flex items-center justify-center bg-white/10 text-text-secondary text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] px-1">
                      {items.length}
                    </span>
                  )}
                </h2>
                {loading ? (
                  <ColumnaSkeleton />
                ) : items.length === 0 ? (
                  <p className="text-text-secondary/30 text-[11px]">Sin proyectos</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {items.map((p) => (
                      <ProyectoCard key={p.id} proyecto={p} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
