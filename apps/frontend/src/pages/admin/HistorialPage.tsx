import { useState, useEffect } from 'react'
import {
  getHistorial,
  getHistorialUsuarios,
  getHistorialHerramientas,
  type HistorialItem,
} from '../../api/admin.api'

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="border-b border-border-card">
          {Array.from({ length: 5 }).map((__, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 bg-white/5 rounded animate-pulse" style={{ width: j === 0 ? '140px' : '80%' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export default function HistorialPage() {
  const [items, setItems] = useState<HistorialItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 20
  const [loading, setLoading] = useState(true)

  // Filtros aplicados
  const [usuarioId, setUsuarioId] = useState('')
  const [herramientaId, setHerramientaId] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  // Filtros del form (pendientes de aplicar)
  const [fUsuarioId, setFUsuarioId] = useState('')
  const [fHerramientaId, setFHerramientaId] = useState('')
  const [fDesde, setFDesde] = useState('')
  const [fHasta, setFHasta] = useState('')

  const [listaUsuarios, setListaUsuarios] = useState<{ id: string; nombre: string }[]>([])
  const [listaHerramientas, setListaHerramientas] = useState<{ id: string; nombre: string }[]>([])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  useEffect(() => {
    Promise.all([getHistorialUsuarios(), getHistorialHerramientas()]).then(([u, h]) => {
      setListaUsuarios(u)
      setListaHerramientas(h)
    })
  }, [])

  useEffect(() => {
    fetchHistorial()
  }, [page, usuarioId, herramientaId, desde, hasta])

  const fetchHistorial = async () => {
    setLoading(true)
    try {
      const res = await getHistorial({
        page,
        limit,
        usuario_id: usuarioId || undefined,
        herramienta_id: herramientaId || undefined,
        desde: desde || undefined,
        hasta: hasta || undefined,
      })
      setItems(res.data)
      setTotal(res.total)
    } catch {
      // ignorado
    } finally {
      setLoading(false)
    }
  }

  const handleFiltrar = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setUsuarioId(fUsuarioId)
    setHerramientaId(fHerramientaId)
    setDesde(fDesde)
    setHasta(fHasta)
  }

  const handleLimpiar = () => {
    setFUsuarioId('')
    setFHerramientaId('')
    setFDesde('')
    setFHasta('')
    setPage(1)
    setUsuarioId('')
    setHerramientaId('')
    setDesde('')
    setHasta('')
  }

  const selectClass =
    'bg-white/5 border border-border-card text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent'
  const inputClass =
    'bg-white/5 border border-border-card text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent'

  const hasFilters = usuarioId || herramientaId || desde || hasta

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-text-primary text-2xl font-bold">Historial de accesos</h1>
        <p className="text-text-secondary text-sm mt-0.5">
          {total} {total === 1 ? 'registro' : 'registros'}
          {hasFilters ? ' (filtrado)' : ''}
        </p>
      </div>

      {/* Filtros */}
      <form
        onSubmit={handleFiltrar}
        className="bg-bg-card border border-border-card rounded-xl px-4 py-4 mb-4 flex flex-wrap gap-3 items-end"
      >
        <div className="flex flex-col gap-1">
          <label className="text-text-secondary text-xs">Usuario</label>
          <select
            value={fUsuarioId}
            onChange={(e) => setFUsuarioId(e.target.value)}
            className={selectClass}
          >
            <option value="" className="bg-bg-card">Todos</option>
            {listaUsuarios.map((u) => (
              <option key={u.id} value={u.id} className="bg-bg-card">
                {u.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-text-secondary text-xs">Herramienta</label>
          <select
            value={fHerramientaId}
            onChange={(e) => setFHerramientaId(e.target.value)}
            className={selectClass}
          >
            <option value="" className="bg-bg-card">Todas</option>
            {listaHerramientas.map((h) => (
              <option key={h.id} value={h.id} className="bg-bg-card">
                {h.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-text-secondary text-xs">Desde</label>
          <input
            type="date"
            value={fDesde}
            onChange={(e) => setFDesde(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-text-secondary text-xs">Hasta</label>
          <input
            type="date"
            value={fHasta}
            onChange={(e) => setFHasta(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex gap-2 pb-0">
          <button
            type="submit"
            className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Filtrar
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={handleLimpiar}
              className="bg-white/5 hover:bg-white/10 text-text-secondary px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      </form>

      {/* Tabla */}
      <div className="bg-bg-card border border-border-card rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5 border-b border-border-card">
              <th className="text-left px-4 py-3 text-text-secondary font-medium whitespace-nowrap">
                Fecha y hora
              </th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Usuario</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Email</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Herramienta</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">IP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton />
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-14 text-text-secondary">
                  {hasFilters ? 'Sin registros para los filtros aplicados' : 'No hay registros de acceso aún'}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border-card hover:bg-white/[0.03] transition-colors"
                >
                  <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                    {new Date(item.fecha_acceso).toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-3 text-text-primary font-medium">
                    {item.usuario.nombre}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{item.usuario.email}</td>
                  <td className="px-4 py-3 text-text-primary">{item.herramienta.nombre}</td>
                  <td className="px-4 py-3 text-text-secondary font-mono text-xs">
                    {item.ip ?? '—'}
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
    </div>
  )
}
