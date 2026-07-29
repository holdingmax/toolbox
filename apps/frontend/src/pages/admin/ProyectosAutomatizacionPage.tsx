import { useState, useEffect } from 'react'
import {
  getProyectosAutomatizacionAdmin,
  createProyectoAutomatizacion,
  updateProyectoAutomatizacion,
  toggleActivoProyectoAutomatizacion,
  ESTADOS_PROYECTO_AUTOMATIZACION,
  ESTADO_LABELS,
  formatFechaProyecto,
  type ProyectoAutomatizacion,
} from '../../api/proyectos-automatizacion.api'
import { getNiveles, type NivelAdmin } from '../../api/admin.api'

function getDepth(ruta: string): number {
  return ruta.split('/').filter(Boolean).length - 1
}

const ESTADO_BADGE_CLASS: Record<string, string> = {
  pendiente: 'bg-white/10 text-text-secondary',
  iniciado: 'bg-accent/15 text-accent',
  en_proceso: 'bg-accent/25 text-accent',
  testing: 'bg-amber-500/20 text-amber-400',
  finalizado: 'bg-status-active/20 text-status-active',
  pausado: 'bg-status-inactive/20 text-status-inactive',
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
  const [estado, setEstado] = useState(proyecto?.estado ?? 'pendiente')
  const [fechaInicio, setFechaInicio] = useState(proyecto?.fecha_inicio?.slice(0, 10) ?? '')
  const [notas, setNotas] = useState(proyecto?.notas ?? '')
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
        estado,
        fecha_inicio: fechaInicio || undefined,
        notas: notas.trim() || undefined,
      }
      if (isEdit) {
        await updateProyectoAutomatizacion(proyecto.id, payload)
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
      <div className="bg-bg-card border border-border-card rounded-xl w-full max-w-md shadow-2xl">
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
              <label className="block text-text-secondary text-sm mb-1">Estado</label>
              <select value={estado} onChange={(e) => setEstado(e.target.value)} className={inputClass}>
                {ESTADOS_PROYECTO_AUTOMATIZACION.map((v) => (
                  <option key={v} value={v} className="bg-bg-card">{ESTADO_LABELS[v]}</option>
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
            <label className="block text-text-secondary text-sm mb-1">Notas</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className={`${inputClass} min-h-[80px] resize-y`}
              placeholder="Notas opcionales sobre el avance"
            />
          </div>

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

// ── Skeleton ──────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b border-border-card">
          {Array.from({ length: 5 }).map((__, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 bg-white/5 rounded animate-pulse" style={{ width: j === 0 ? '70%' : '60%' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
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
    <div className="p-6 max-w-6xl mx-auto">
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

      <div className="bg-bg-card border border-border-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5 border-b border-border-card">
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Título</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Nivel</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Estado</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium whitespace-nowrap">Inicio</th>
              <th className="text-right px-4 py-3 text-text-secondary font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton />
            ) : proyectos.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-text-secondary">
                  No hay proyectos de automatización registrados
                </td>
              </tr>
            ) : (
              proyectos.map((p) => (
                <tr key={p.id} className="border-b border-border-card hover:bg-white/[0.03] transition-colors">
                  <td className="px-4 py-3 text-text-primary font-medium">{p.titulo}</td>
                  <td className="px-4 py-3 text-text-secondary">{p.nivel.nombre}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${ESTADO_BADGE_CLASS[p.estado] ?? 'bg-white/10 text-text-secondary'}`}>
                      {ESTADO_LABELS[p.estado] ?? p.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                    {p.fecha_inicio ? formatFechaProyecto(p.fecha_inicio) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEditando(p); setModalOpen(true) }}
                        title="Editar"
                        className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded hover:bg-white/5"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleToggle(p)}
                        disabled={togglingId === p.id}
                        title={p.activo ? 'Desactivar' : 'Activar'}
                        className={`text-xs px-2 py-1 rounded transition-colors disabled:opacity-50 ${
                          p.activo
                            ? 'text-status-inactive bg-status-inactive/10 hover:bg-status-inactive/20'
                            : 'text-status-active bg-status-active/10 hover:bg-status-active/20'
                        }`}
                      >
                        {togglingId === p.id ? '…' : p.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
