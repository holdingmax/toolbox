import { useState, useEffect, useRef } from 'react'
import {
  getHerramientas,
  createHerramienta,
  updateHerramienta,
  toggleEstadoHerramienta,
  getPublicaciones,
  createPublicacion,
  togglePublicacion,
  getNiveles,
  verificarSaludHerramientas,
  type HerramientaAdmin,
  type PublicacionAdmin,
  type NivelAdmin,
} from '../../api/admin.api'

// ── Indicador de salud ────────────────────────────────────────────────────────

function EstadoServicioDot({ herramienta }: { herramienta: HerramientaAdmin }) {
  const color =
    herramienta.estado_servicio === 'ok'
      ? 'bg-status-active'
      : herramienta.estado_servicio === 'error'
        ? 'bg-status-inactive'
        : 'bg-text-secondary/40'

  const tooltip = herramienta.ultima_verificacion
    ? `Estado: ${herramienta.estado_servicio} · Última verificación: ${new Date(herramienta.ultima_verificacion).toLocaleString('es-AR')}`
    : 'Sin verificar aún'

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${color}`}
      title={tooltip}
    />
  )
}

// ── Modal herramienta ─────────────────────────────────────────────────────────

interface HerramientaModalProps {
  herramienta: HerramientaAdmin | null
  onClose: () => void
  onSaved: () => void
}

function HerramientaModal({ herramienta, onClose, onSaved }: HerramientaModalProps) {
  const isEdit = !!herramienta
  const [nombre, setNombre] = useState(herramienta?.nombre ?? '')
  const [url, setUrl] = useState(herramienta?.url ?? '')
  const [descripcion, setDescripcion] = useState(herramienta?.descripcion ?? '')
  const [icono_url, setIconoUrl] = useState(herramienta?.icono_url ?? '')
  const [soporte, setSoporte] = useState(herramienta?.soporte ?? '')
  const [orden, setOrden] = useState<string>(String(herramienta?.orden ?? ''))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!nombre.trim() || !url.trim()) {
      setError('Nombre y URL son obligatorios.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        nombre: nombre.trim(),
        url: url.trim(),
        descripcion: descripcion.trim() || undefined,
        icono_url: icono_url.trim() || undefined,
        soporte: soporte.trim() || undefined,
        orden: orden !== '' ? Number(orden) : undefined,
      }
      if (isEdit) {
        await updateHerramienta(herramienta.id, payload)
      } else {
        await createHerramienta(payload)
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
            {isEdit ? 'Editar herramienta' : 'Nueva herramienta'}
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
              placeholder="Ej: Sistema de RRHH"
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-1">
              URL <span className="text-status-inactive">*</span>
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={inputClass}
              placeholder="https://rrhh.empresa.com"
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
            <label className="block text-text-secondary text-sm mb-1">Soporte</label>
            <input
              type="text"
              value={soporte}
              onChange={(e) => setSoporte(e.target.value)}
              className={inputClass}
              placeholder="Nombre y apellido de quien da soporte"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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

// ── Modal publicaciones ───────────────────────────────────────────────────────

interface PublicacionesModalProps {
  herramienta: HerramientaAdmin
  onClose: () => void
}

function getDepth(ruta: string): number {
  return ruta.split('/').filter(Boolean).length - 1
}

function PublicacionesModal({ herramienta, onClose }: PublicacionesModalProps) {
  const [publicaciones, setPublicaciones] = useState<PublicacionAdmin[]>([])
  const [niveles, setNiveles] = useState<NivelAdmin[]>([])
  const [selectedNivelId, setSelectedNivelId] = useState('')
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [pubs, nivs] = await Promise.all([
        getPublicaciones(herramienta.id),
        getNiveles(),
      ])
      setPublicaciones(pubs)
      setNiveles(nivs)
    } catch {
      // manejado por interceptor
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const handleToggle = async (pub: PublicacionAdmin) => {
    setTogglingId(pub.id)
    try {
      const updated = await togglePublicacion(herramienta.id, pub.id)
      setPublicaciones((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    } catch {
      // error
    } finally {
      setTogglingId(null)
    }
  }

  const handleAdd = async () => {
    if (!selectedNivelId) return
    setError(null)
    // si ya existe (aunque inactiva), togglear en vez de crear
    const existing = publicaciones.find((p) => p.nivel_id === selectedNivelId)
    setAdding(true)
    try {
      if (existing) {
        if (!existing.activo) {
          const updated = await togglePublicacion(herramienta.id, existing.id)
          setPublicaciones((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
        }
      } else {
        const nueva = await createPublicacion(herramienta.id, selectedNivelId)
        setPublicaciones((prev) => [...prev, nueva])
      }
      setSelectedNivelId('')
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Ocurrió un error.'
      setError(Array.isArray(msg) ? msg.join(' · ') : msg)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-bg-card border border-border-card rounded-xl w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-card flex-shrink-0">
          <div>
            <h2 className="text-text-primary font-semibold text-lg">Publicaciones</h2>
            <p className="text-text-secondary text-xs mt-0.5 truncate max-w-xs">{herramienta.nombre}</p>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Lista publicaciones */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-text-secondary text-sm">
              Cargando…
            </div>
          ) : publicaciones.length === 0 ? (
            <div className="text-center py-10 text-text-secondary text-sm">
              Sin publicaciones aún
            </div>
          ) : (
            publicaciones.map((pub) => (
              <div
                key={pub.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-border-card hover:bg-white/[0.03]"
              >
                <span className="text-sm">📁</span>
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary text-sm truncate">{pub.nivel.nombre}</p>
                  <p className="text-text-secondary text-xs">{pub.nivel.tipo}</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                    pub.activo
                      ? 'bg-status-active/20 text-status-active'
                      : 'bg-status-inactive/20 text-status-inactive'
                  }`}
                >
                  {pub.activo ? 'Activo' : 'Inactivo'}
                </span>
                <button
                  onClick={() => handleToggle(pub)}
                  disabled={togglingId === pub.id}
                  className={`text-xs px-2 py-1 rounded transition-colors disabled:opacity-50 flex-shrink-0 ${
                    pub.activo
                      ? 'text-status-inactive bg-status-inactive/10 hover:bg-status-inactive/20'
                      : 'text-status-active bg-status-active/10 hover:bg-status-active/20'
                  }`}
                >
                  {togglingId === pub.id ? '…' : pub.activo ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Agregar publicación */}
        <div className="px-4 py-4 border-t border-border-card flex-shrink-0">
          {error && (
            <p className="text-xs text-status-inactive mb-2">{error}</p>
          )}
          <div className="flex gap-2">
            <select
              value={selectedNivelId}
              onChange={(e) => setSelectedNivelId(e.target.value)}
              className="flex-1 bg-white/5 border border-border-card text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            >
              <option value="" className="bg-bg-card">
                Seleccioná un nivel…
              </option>
              {niveles.map((n) => {
                const depth = getDepth(n.ruta)
                const indent = '    '.repeat(depth)
                return (
                  <option key={n.id} value={n.id} className="bg-bg-card">
                    {indent}{n.nombre} ({n.tipo})
                  </option>
                )
              })}
            </select>
            <button
              onClick={handleAdd}
              disabled={!selectedNivelId || adding}
              className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex-shrink-0"
            >
              {adding ? '…' : 'Publicar'}
            </button>
          </div>
        </div>
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
              <div
                className="h-4 bg-white/5 rounded animate-pulse"
                style={{ width: j === 1 ? '70%' : '60%' }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HerramientasPage() {
  const [herramientas, setHerramientas] = useState<HerramientaAdmin[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 20
  const [buscar, setBuscar] = useState('')
  const [inputBuscar, setInputBuscar] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<HerramientaAdmin | null>(null)
  const [pubHerramienta, setPubHerramienta] = useState<HerramientaAdmin | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [verificando, setVerificando] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const fetchHerramientas = async () => {
    setLoading(true)
    try {
      const res = await getHerramientas({ page, limit, buscar: buscar || undefined })
      setHerramientas(res.data)
      setTotal(res.total)
    } catch {
      // manejado por interceptor
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHerramientas()
  }, [page, buscar])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setBuscar(inputBuscar.trim())
  }

  const handleClearSearch = () => {
    setInputBuscar('')
    setBuscar('')
    setPage(1)
    searchRef.current?.focus()
  }

  const handleToggle = async (h: HerramientaAdmin) => {
    setTogglingId(h.id)
    try {
      const updated = await toggleEstadoHerramienta(h.id)
      setHerramientas((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
    } catch {
      // error
    } finally {
      setTogglingId(null)
    }
  }

  const handleVerificarSalud = async () => {
    setVerificando(true)
    try {
      await verificarSaludHerramientas()
      await fetchHerramientas()
    } catch {
      // manejado por interceptor
    } finally {
      setVerificando(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-text-primary text-2xl font-bold">Herramientas</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            {total} {total === 1 ? 'herramienta registrada' : 'herramientas registradas'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleVerificarSalud}
            disabled={verificando}
            className="bg-white/5 hover:bg-white/10 text-text-secondary px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {verificando ? 'Verificando…' : 'Verificar salud'}
          </button>
          <button
            onClick={() => { setEditando(null); setModalOpen(true) }}
            className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <span>+</span>
            <span>Nueva herramienta</span>
          </button>
        </div>
      </div>

      {/* Buscador */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <input
            ref={searchRef}
            type="text"
            value={inputBuscar}
            onChange={(e) => setInputBuscar(e.target.value)}
            placeholder="Buscar por nombre…"
            className="w-full bg-white/5 border border-border-card text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent pr-8"
          />
          {inputBuscar && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>
        <button
          type="submit"
          className="bg-white/5 hover:bg-white/10 text-text-secondary px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Buscar
        </button>
      </form>

      {/* Tabla */}
      <div className="bg-bg-card border border-border-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5 border-b border-border-card">
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Nombre</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">URL</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Estado</th>
              <th className="text-right px-4 py-3 text-text-secondary font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton />
            ) : herramientas.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-text-secondary">
                  {buscar ? `Sin resultados para "${buscar}"` : 'No hay herramientas registradas'}
                </td>
              </tr>
            ) : (
              herramientas.map((h) => (
                <tr
                  key={h.id}
                  className="border-b border-border-card hover:bg-white/[0.03] transition-colors"
                >
                  <td className="px-4 py-3 text-text-primary font-medium">
                    <span className="inline-flex items-center gap-2">
                      <EstadoServicioDot herramienta={h} />
                      {h.nombre}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary max-w-xs">
                    <a
                      href={h.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-accent transition-colors truncate block max-w-[200px]"
                      title={h.url}
                    >
                      {h.url}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        h.activo
                          ? 'bg-status-active/20 text-status-active'
                          : 'bg-status-inactive/20 text-status-inactive'
                      }`}
                    >
                      {h.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setPubHerramienta(h)}
                        title="Publicaciones"
                        className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded hover:bg-white/5 text-base"
                      >
                        📌
                      </button>
                      <button
                        onClick={() => { setEditando(h); setModalOpen(true) }}
                        title="Editar"
                        className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded hover:bg-white/5"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleToggle(h)}
                        disabled={togglingId === h.id}
                        title={h.activo ? 'Desactivar' : 'Activar'}
                        className={`text-xs px-2 py-1 rounded transition-colors disabled:opacity-50 ${
                          h.activo
                            ? 'text-status-inactive bg-status-inactive/10 hover:bg-status-inactive/20'
                            : 'text-status-active bg-status-active/10 hover:bg-status-active/20'
                        }`}
                      >
                        {togglingId === h.id ? '…' : h.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-text-secondary">
          <span>
            Página {page} de {totalPages} · {total} registros
          </span>
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

      {/* Modales */}
      {modalOpen && (
        <HerramientaModal
          herramienta={editando}
          onClose={() => setModalOpen(false)}
          onSaved={fetchHerramientas}
        />
      )}
      {pubHerramienta && (
        <PublicacionesModal
          herramienta={pubHerramienta}
          onClose={() => setPubHerramienta(null)}
        />
      )}
    </div>
  )
}
