import { useState, useEffect } from 'react'
import {
  getNiveles,
  createNivel,
  updateNivel,
  toggleEstadoNivel,
  type NivelAdmin,
  type CreateNivelPayload,
} from '../../api/admin.api'

function getDepth(ruta: string): number {
  return ruta.split('/').filter(Boolean).length - 1
}

// ── Modal ─────────────────────────────────────────────────────────────────────

interface ModalProps {
  nivel: NivelAdmin | null
  defaultParentId: string | null
  niveles: NivelAdmin[]
  onClose: () => void
  onSaved: () => void
}

function NivelModal({ nivel, defaultParentId, niveles, onClose, onSaved }: ModalProps) {
  const isEdit = !!nivel
  const [nombre, setNombre] = useState(nivel?.nombre ?? '')
  const [tipo, setTipo] = useState(nivel?.tipo ?? '')
  const [descripcion, setDescripcion] = useState(nivel?.descripcion ?? '')
  const [parent_id, setParentId] = useState<string>(
    nivel?.parent_id ?? defaultParentId ?? ''
  )
  const [orden, setOrden] = useState<string>(String(nivel?.orden ?? ''))
  const [icono_url, setIconoUrl] = useState(nivel?.icono_url ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!nombre.trim() || !tipo.trim()) {
      setError('Nombre y Tipo son obligatorios.')
      return
    }
    setSaving(true)
    try {
      const payload: CreateNivelPayload & { activo?: boolean } = {
        nombre: nombre.trim(),
        tipo: tipo.trim(),
        descripcion: descripcion.trim() || undefined,
        parent_id: parent_id || undefined,
        orden: orden !== '' ? Number(orden) : undefined,
        icono_url: icono_url.trim() || undefined,
      }
      if (isEdit) {
        await updateNivel(nivel.id, payload)
      } else {
        await createNivel(payload)
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-card sticky top-0 bg-bg-card">
          <h2 className="text-text-primary font-semibold text-lg">
            {isEdit ? 'Editar nivel' : 'Nuevo nivel'}
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
              Nombre <span className="text-status-inactive">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={inputClass}
              placeholder="Ej: Recursos Humanos"
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-1">
              Tipo <span className="text-status-inactive">*</span>
            </label>
            <input
              type="text"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className={inputClass}
              placeholder="Ej: empresa, area, sector, departamento"
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-1">Descripción</label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className={inputClass}
              placeholder="Descripción opcional"
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-1">Nivel padre</label>
            <select
              value={parent_id}
              onChange={(e) => setParentId(e.target.value)}
              className={inputClass}
            >
              <option value="" className="bg-bg-card">
                — Sin padre (nodo raíz) —
              </option>
              {niveles
                .filter((n) => !isEdit || n.id !== nivel?.id)
                .map((n) => {
                  const depth = getDepth(n.ruta)
                  const indent = '    '.repeat(depth)
                  return (
                    <option key={n.id} value={n.id} className="bg-bg-card">
                      {indent}📁 {n.nombre} ({n.tipo})
                    </option>
                  )
                })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-text-secondary text-sm mb-1">Orden</label>
              <input
                type="number"
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
                className={inputClass}
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="block text-text-secondary text-sm mb-1">Icono URL</label>
              <input
                type="text"
                value={icono_url}
                onChange={(e) => setIconoUrl(e.target.value)}
                className={inputClass}
                placeholder="https://…"
              />
            </div>
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

function TreeSkeleton() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3 border-b border-border-card"
          style={{ paddingLeft: (i % 3) * 24 + 16 + 'px' }}
        >
          <div className="h-4 w-4 bg-white/5 rounded animate-pulse" />
          <div className="h-4 bg-white/5 rounded animate-pulse" style={{ width: 120 + i * 20 + 'px' }} />
          <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
        </div>
      ))}
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NivelesPage() {
  const [niveles, setNiveles] = useState<NivelAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<NivelAdmin | null>(null)
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchNiveles = async () => {
    setLoading(true)
    try {
      const data = await getNiveles()
      setNiveles(data)
    } catch {
      // manejado por interceptor
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNiveles()
  }, [])

  const openCreate = (parentId: string | null = null) => {
    setEditando(null)
    setDefaultParentId(parentId)
    setModalOpen(true)
  }

  const openEdit = (n: NivelAdmin) => {
    setEditando(n)
    setDefaultParentId(null)
    setModalOpen(true)
  }

  const handleToggle = async (n: NivelAdmin) => {
    setTogglingId(n.id)
    try {
      const updated = await toggleEstadoNivel(n.id)
      setNiveles((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
    } catch {
      // error
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-text-primary text-2xl font-bold">Árbol de niveles</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            {niveles.length} {niveles.length === 1 ? 'nivel' : 'niveles'} en total
          </p>
        </div>
        <button
          onClick={() => openCreate(null)}
          className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <span>+</span>
          <span>Nuevo nivel raíz</span>
        </button>
      </div>

      {/* Árbol */}
      <div className="bg-bg-card border border-border-card rounded-xl overflow-hidden">
        {loading ? (
          <TreeSkeleton />
        ) : niveles.length === 0 ? (
          <div className="text-center py-16 text-text-secondary">
            <p className="text-4xl mb-3">🏢</p>
            <p>No hay niveles aún. Creá el primero.</p>
          </div>
        ) : (
          niveles.map((n) => {
            const depth = getDepth(n.ruta)
            return (
              <div
                key={n.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-border-card hover:bg-white/[0.03] transition-colors group"
                style={{ paddingLeft: depth * 24 + 16 + 'px' }}
              >
                {/* Conector vertical */}
                {depth > 0 && (
                  <span className="text-white/20 select-none text-xs">└</span>
                )}

                <span className="text-base">📁</span>

                <span className="text-text-primary text-sm font-medium flex-1 min-w-0 truncate">
                  {n.nombre}
                </span>

                <span className="text-xs bg-white/10 text-text-secondary px-2 py-0.5 rounded flex-shrink-0">
                  {n.tipo}
                </span>

                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                    n.activo
                      ? 'bg-status-active/20 text-status-active'
                      : 'bg-status-inactive/20 text-status-inactive'
                  }`}
                >
                  {n.activo ? 'Activo' : 'Inactivo'}
                </span>

                {/* Acciones — visibles en hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={() => openCreate(n.id)}
                    title="Agregar hijo"
                    className="text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors"
                  >
                    + Hijo
                  </button>
                  <button
                    onClick={() => openEdit(n)}
                    title="Editar"
                    className="p-1 rounded hover:bg-white/5 text-text-secondary hover:text-text-primary transition-colors"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleToggle(n)}
                    disabled={togglingId === n.id}
                    title={n.activo ? 'Desactivar' : 'Activar'}
                    className={`text-xs px-2 py-1 rounded transition-colors disabled:opacity-50 ${
                      n.activo
                        ? 'text-status-inactive bg-status-inactive/10 hover:bg-status-inactive/20'
                        : 'text-status-active bg-status-active/10 hover:bg-status-active/20'
                    }`}
                  >
                    {togglingId === n.id ? '…' : n.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <NivelModal
          nivel={editando}
          defaultParentId={defaultParentId}
          niveles={niveles}
          onClose={() => setModalOpen(false)}
          onSaved={fetchNiveles}
        />
      )}
    </div>
  )
}
