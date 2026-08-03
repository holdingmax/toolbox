import { useState, useEffect } from 'react'
import {
  getProyectosAutomatizacionAdmin,
  createProyectoAutomatizacion,
  updateProyectoAutomatizacion,
  toggleActivoProyectoAutomatizacion,
  updateEtapaProyecto,
  ETAPAS_PIPELINE_PROYECTO,
  ETAPA_LABELS,
  ESTADOS_ETAPA,
  ESTADOS_GENERALES_PROYECTO,
  ESTADO_GENERAL_LABELS,
  type ProyectoAutomatizacion,
} from '../../api/proyectos-automatizacion.api'
import { getNiveles, type NivelAdmin } from '../../api/admin.api'
import ProyectosAutomatizacionMatriz, {
  ProyectosAutomatizacionLeyenda,
} from '../../components/ProyectosAutomatizacionMatriz'

function getDepth(ruta: string): number {
  return ruta.split('/').filter(Boolean).length - 1
}

const ESTADO_ETAPA_LABELS: Record<string, string> = {
  no_alcanzada: 'No alcanzada',
  en_curso: 'En curso',
  completada: 'Completada',
}

// ── Modal proyecto ────────────────────────────────────────────────────────────

interface ProyectoModalProps {
  proyecto: ProyectoAutomatizacion | null
  niveles: NivelAdmin[]
  onClose: () => void
  onSaved: () => void
}

function ProyectoModal({ proyecto, niveles, onClose, onSaved }: ProyectoModalProps) {
  const isEdit = !!proyecto
  const [titulo, setTitulo] = useState(proyecto?.titulo ?? '')
  const [nivelId, setNivelId] = useState(proyecto?.nivel_id ?? '')
  const [estadoGeneral, setEstadoGeneral] = useState(proyecto?.estado_general ?? 'normal')
  const [fechaInicio, setFechaInicio] = useState(proyecto?.fecha_inicio?.slice(0, 10) ?? '')
  const [observaciones, setObservaciones] = useState(proyecto?.observaciones ?? '')
  const [etapas, setEtapas] = useState<Record<string, string>>(() => {
    const inicial: Record<string, string> = {}
    for (const etapa of ETAPAS_PIPELINE_PROYECTO) {
      inicial[etapa] = proyecto?.etapas.find((e) => e.etapa === etapa)?.estado ?? 'no_alcanzada'
    }
    return inicial
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!titulo.trim() || !nivelId) {
      setError('Título y nivel son obligatorios.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        titulo: titulo.trim(),
        nivel_id: nivelId,
        estado_general: estadoGeneral,
        fecha_inicio: fechaInicio || undefined,
        observaciones: observaciones.trim() || undefined,
      }
      if (isEdit) {
        await updateProyectoAutomatizacion(proyecto.id, payload)
        // Solo se mandan las etapas que cambiaron respecto al valor original.
        const cambios = ETAPAS_PIPELINE_PROYECTO.filter(
          (etapa) => etapas[etapa] !== (proyecto.etapas.find((e) => e.etapa === etapa)?.estado ?? 'no_alcanzada'),
        )
        for (const etapa of cambios) {
          await updateEtapaProyecto(proyecto.id, etapa, etapas[etapa])
        }
      } else {
        await createProyectoAutomatizacion(payload)
      }
      onSaved()
      onClose()
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Ocurrió un error. Intentá de nuevo.'
      setError(Array.isArray(msg) ? msg.join(' · ') : msg)
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full bg-white/5 border border-border-card text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent'

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-bg-card border border-border-card rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-card">
          <h2 className="text-text-primary font-semibold text-lg">
            {isEdit ? 'Editar proyecto' : 'Nuevo proyecto de automatización'}
          </h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <p className="text-sm text-status-inactive bg-status-inactive/10 border border-status-inactive/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div>
            <label className="block text-text-secondary text-sm mb-1">
              Título <span className="text-status-inactive">*</span>
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className={inputClass}
              placeholder="Ej: Automatizar carga de remitos"
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-1">
              Nivel (área) <span className="text-status-inactive">*</span>
            </label>
            <select value={nivelId} onChange={(e) => setNivelId(e.target.value)} className={inputClass}>
              <option value="" className="bg-bg-card">Seleccioná un nivel…</option>
              {niveles.map((n) => {
                const indent = '    '.repeat(getDepth(n.ruta))
                return (
                  <option key={n.id} value={n.id} className="bg-bg-card">
                    {indent}{n.nombre} ({n.tipo})
                  </option>
                )
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-text-secondary text-sm mb-1">Estado general</label>
              <select value={estadoGeneral} onChange={(e) => setEstadoGeneral(e.target.value)} className={inputClass}>
                {ESTADOS_GENERALES_PROYECTO.map((v) => (
                  <option key={v} value={v} className="bg-bg-card">{ESTADO_GENERAL_LABELS[v]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-text-secondary text-sm mb-1">Fecha de inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-1">Observaciones</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className={`${inputClass} min-h-[80px] resize-y`}
              placeholder="Ej: pausado porque el banco no entregó el reporte"
            />
          </div>

          {isEdit && (
            <div>
              <label className="block text-text-secondary text-sm mb-2">Avance por etapa</label>
              <div className="space-y-2 bg-white/[0.02] border border-border-card rounded-lg p-3">
                {ETAPAS_PIPELINE_PROYECTO.map((etapa) => (
                  <div key={etapa} className="flex items-center justify-between gap-3">
                    <span className="text-text-secondary text-sm">{ETAPA_LABELS[etapa]}</span>
                    <select
                      value={etapas[etapa]}
                      onChange={(e) => setEtapas((prev) => ({ ...prev, [etapa]: e.target.value }))}
                      className="bg-white/5 border border-border-card text-text-primary rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-accent"
                    >
                      {ESTADOS_ETAPA.map((v) => (
                        <option key={v} value={v} className="bg-bg-card">{ESTADO_ETAPA_LABELS[v]}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-accent hover:bg-accent-hover text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/5 hover:bg-white/10 text-text-secondary rounded-lg py-2 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProyectosAutomatizacionPage() {
  const [proyectos, setProyectos] = useState<ProyectoAutomatizacion[]>([])
  const [niveles, setNiveles] = useState<NivelAdmin[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 20
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<ProyectoAutomatizacion | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const fetchProyectos = async () => {
    setLoading(true)
    try {
      const res = await getProyectosAutomatizacionAdmin({ page, limit })
      setProyectos(res.data)
      setTotal(res.total)
    } catch {
      // manejado por interceptor
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProyectos()
  }, [page])

  useEffect(() => {
    getNiveles().then(setNiveles)
  }, [])

  const handleToggle = async (p: ProyectoAutomatizacion) => {
    setTogglingId(p.id)
    try {
      const updated = await toggleActivoProyectoAutomatizacion(p.id)
      setProyectos((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
    } catch {
      // error
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-text-primary text-2xl font-bold">Proyectos de automatización</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            {total} {total === 1 ? 'proyecto registrado' : 'proyectos registrados'}
          </p>
        </div>
        <button
          onClick={() => { setEditando(null); setModalOpen(true) }}
          className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <span>+</span>
          <span>Nuevo proyecto</span>
        </button>
      </div>

      <ProyectosAutomatizacionLeyenda />

      {loading ? (
        <div className="bg-bg-card border border-border-card rounded-xl h-64 animate-pulse" />
      ) : (
        <ProyectosAutomatizacionMatriz
          proyectos={proyectos}
          mostrarAcciones
          onEditar={(p) => { setEditando(p); setModalOpen(true) }}
          onToggleActivo={handleToggle}
          togglingId={togglingId}
        />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-text-secondary">
          <span>Página {page} de {totalPages} · {total} registros</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {modalOpen && (
        <ProyectoModal
          proyecto={editando}
          niveles={niveles}
          onClose={() => setModalOpen(false)}
          onSaved={fetchProyectos}
        />
      )}
    </div>
  )
}
