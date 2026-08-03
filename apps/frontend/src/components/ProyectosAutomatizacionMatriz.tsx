import {
  ETAPAS_PIPELINE_PROYECTO,
  ETAPA_LABELS,
  formatFechaProyecto,
  indiceAvance,
  type ProyectoAutomatizacion,
} from '../api/proyectos-automatizacion.api'

const CIRCULO_POR_ESTADO: Record<string, string> = {
  completada: 'bg-status-active',
  en_curso: 'bg-amber-400',
  no_alcanzada: 'bg-white/10 border border-white/20',
}

function Circulo({ estado }: { estado: string | undefined }) {
  const clase = CIRCULO_POR_ESTADO[estado ?? 'no_alcanzada'] ?? CIRCULO_POR_ESTADO.no_alcanzada
  return <span className={`inline-block w-3.5 h-3.5 rounded-full ${clase}`} />
}

function OverlayEstadoGeneral({ estadoGeneral }: { estadoGeneral: string }) {
  if (estadoGeneral === 'pausado') {
    return <span title="Pausado" className="text-amber-400">⏸</span>
  }
  if (estadoGeneral === 'rechazado') {
    return <span title="Rechazado" className="text-status-inactive">✕</span>
  }
  return null
}

// Separada del componente de la tabla a propósito: se renderiza arriba,
// justo debajo del título/subtítulo de cada página, no adentro de la tarjeta
// de la tabla -- así queda visible siempre, sin depender de scrollear hasta
// el final.
export function ProyectosAutomatizacionLeyenda() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-[11px] text-text-secondary mb-4">
      <span className="flex items-center gap-1.5"><Circulo estado="completada" /> Completada</span>
      <span className="flex items-center gap-1.5"><Circulo estado="en_curso" /> En curso</span>
      <span className="flex items-center gap-1.5"><Circulo estado="no_alcanzada" /> No alcanzada</span>
      <span className="flex items-center gap-1.5"><span className="text-amber-400">⏸</span> Pausado</span>
      <span className="flex items-center gap-1.5"><span className="text-status-inactive">✕</span> Rechazado</span>
    </div>
  )
}

interface Props {
  proyectos: ProyectoAutomatizacion[]
  mostrarAcciones?: boolean
  onEditar?: (proyecto: ProyectoAutomatizacion) => void
  onToggleActivo?: (proyecto: ProyectoAutomatizacion) => void
  togglingId?: string | null
}

export default function ProyectosAutomatizacionMatriz({
  proyectos,
  mostrarAcciones = false,
  onEditar,
  onToggleActivo,
  togglingId,
}: Props) {
  const ordenados = [...proyectos].sort((a, b) => indiceAvance(b) - indiceAvance(a))

  // bg-bg-sidebar (no bg-white/5, que es semitransparente): el header queda
  // sticky sobre filas que hacen scroll debajo, necesita un color opaco para
  // no dejarlas transparentar. Borde inferior en el color de marca (no el
  // gris genérico de las filas) + mayúsculas/tracking para separarlo con
  // claridad de las filas de datos.
  const thClass =
    'sticky top-0 z-10 bg-bg-sidebar border-b-2 border-border-active text-text-secondary font-semibold uppercase tracking-wider'

  return (
    <div className="bg-bg-card border border-border-card rounded-xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className={`${thClass} text-left px-4 py-3 text-xs whitespace-nowrap`}>Proyecto</th>
            <th className={`${thClass} text-left px-3 py-3 text-xs whitespace-nowrap`}>Área</th>
            {ETAPAS_PIPELINE_PROYECTO.map((etapa) => (
              <th key={etapa} className={`${thClass} px-2 py-3 text-[10px] text-center w-16`}>
                {ETAPA_LABELS[etapa]}
              </th>
            ))}
            <th className={`${thClass} text-left px-4 py-3 text-xs`}>Observaciones</th>
            {mostrarAcciones && <th className={`${thClass} text-right px-4 py-3 text-xs`}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {ordenados.length === 0 ? (
            <tr>
              <td
                colSpan={ETAPAS_PIPELINE_PROYECTO.length + 3 + (mostrarAcciones ? 1 : 0)}
                className="text-center py-12 text-text-secondary"
              >
                No hay proyectos de automatización registrados
              </td>
            </tr>
          ) : (
            ordenados.map((p) => (
              <tr key={p.id} className="border-b border-border-card hover:bg-white/[0.03] transition-colors">
                <td className="px-4 py-3 text-text-primary font-medium whitespace-nowrap">
                  <span className="flex items-center gap-1.5">
                    <OverlayEstadoGeneral estadoGeneral={p.estado_general} />
                    {p.titulo}
                  </span>
                  {p.fecha_inicio && (
                    <span className="block text-text-secondary/70 text-[11px] mt-0.5">
                      Inicio: {formatFechaProyecto(p.fecha_inicio)}
                    </span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <span className="inline-block border border-border-card bg-white/5 rounded-full px-2 py-0.5 text-[11px] text-text-secondary whitespace-nowrap">
                    {p.nivel.nombre}
                  </span>
                </td>
                {ETAPAS_PIPELINE_PROYECTO.map((etapa) => (
                  <td key={etapa} className="px-2 py-3 text-center">
                    <Circulo estado={p.etapas.find((e) => e.etapa === etapa)?.estado} />
                  </td>
                ))}
                <td className="px-4 py-3 text-text-secondary text-xs max-w-[220px]">
                  <span className="line-clamp-2" title={p.observaciones ?? undefined}>
                    {p.observaciones || '—'}
                  </span>
                </td>
                {mostrarAcciones && (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEditar?.(p)}
                        title="Editar"
                        className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded hover:bg-white/5"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onToggleActivo?.(p)}
                        disabled={togglingId === p.id}
                        title={p.activo ? 'Desactivar' : 'Activar'}
                        className={`text-xs px-2 py-1 rounded transition-colors disabled:opacity-50 whitespace-nowrap ${
                          p.activo
                            ? 'text-status-inactive bg-status-inactive/10 hover:bg-status-inactive/20'
                            : 'text-status-active bg-status-active/10 hover:bg-status-active/20'
                        }`}
                      >
                        {togglingId === p.id ? '…' : p.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
