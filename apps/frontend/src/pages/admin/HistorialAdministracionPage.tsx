import { useState, useEffect } from 'react'
import {
  getHistorialAdministracion,
  getHistorialUsuarios,
  type HistorialAdministracionItem,
} from '../../api/admin.api'

const ENTIDAD_LABELS: Record<string, string> = {
  usuario: 'usuario',
  nivel: 'nivel',
  herramienta: 'herramienta',
  permiso: 'permiso',
  publicacion: 'publicación',
}

function accionTexto(item: HistorialAdministracionItem): string {
  const entidadLabel = ENTIDAD_LABELS[item.entidad] ?? item.entidad
  if (item.accion === 'crear') return `Creó ${entidadLabel}`
  if (item.accion === 'toggle') {
    const desactivo =
      (item.cambios as Record<string, { despues?: unknown }> | null)?.activo?.despues === false
    return `${desactivo ? 'Desactivó' : 'Activó'} ${entidadLabel}`
  }
  return `Editó ${entidadLabel}`
}

function formatValor(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'object') {
    const obj = v as Record<string, unknown>
    return (obj.nombre as string | undefined) ?? (obj.id as string | undefined) ?? '[objeto]'
  }
  return String(v)
}

function CambiosCelda({ item }: { item: HistorialAdministracionItem }) {
  const cambios = item.cambios
  if (!cambios || Object.keys(cambios).length === 0) {
    return <span className="text-text-secondary/60 italic">Sin cambios registrados</span>
  }

  const formatLinea = ([campo, valor]: [string, unknown]): string => {
    if (item.accion === 'crear') return `${campo}: ${formatValor(valor)}`
    const { antes, despues } = valor as { antes: unknown; despues: unknown }
    return `${campo}: ${formatValor(antes)} → ${formatValor(despues)}`
  }

  const entries = Object.entries(cambios)
  const visibles = entries.slice(0, 3)
  const resto = entries.length - visibles.length
  const tituloCompleto = resto > 0 ? entries.map(formatLinea).join('\n') : undefined

  return (
    <div className="flex flex-col gap-0.5" title={tituloCompleto}>
      {visibles.map((entry, i) => (
        <span key={i} className="text-xs text-text-secondary font-mono">
          {formatLinea(entry)}
        </span>
      ))}
      {resto > 0 && <span className="text-xs text-accent">+{resto} más</span>}
    </div>
  )
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="border-b border-border-card">
          {Array.from({ length: 4 }).map((__, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 bg-white/5 rounded animate-pulse" style={{ width: j === 0 ? '140px' : '80%' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export default function HistorialAdministracionPage() {
  const [items, setItems] = useState<HistorialAdministracionItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 20
  const [loading, setLoading] = useState(true)

  const [usuarioId, setUsuarioId] = useState('')
  const [entidad, setEntidad] = useState('')
  const [accion, setAccion] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const [fUsuarioId, setFUsuarioId] = useState('')
  const [fEntidad, setFEntidad] = useState('')
  const [fAccion, setFAccion] = useState('')
  const [fDesde, setFDesde] = useState('')
  const [fHasta, setFHasta] = useState('')

  const [listaUsuarios, setListaUsuarios] = useState<{ id: string; nombre: string }[]>([])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  useEffect(() => {
    getHistorialUsuarios().then(setListaUsuarios)
  }, [])

  useEffect(() => {
    fetchHistorial()
  }, [page, usuarioId, entidad, accion, desde, hasta])

  const fetchHistorial = async () => {
    setLoading(true)
    try {
      const res = await getHistorialAdministracion({
        page,
        limit,
        usuario_id: usuarioId || undefined,
        entidad: entidad || undefined,
        accion: accion || undefined,
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
    setEntidad(fEntidad)
    setAccion(fAccion)
    setDesde(fDesde)
    setHasta(fHasta)
  }

  const handleLimpiar = () => {
    setFUsuarioId('')
    setFEntidad('')
    setFAccion('')
    setFDesde('')
    setFHasta('')
    setPage(1)
    setUsuarioId('')
    setEntidad('')
    setAccion('')
    setDesde('')
    setHasta('')
  }

  const selectClass =
    'bg-white/5 border border-border-card text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent'
  const inputClass =
    'bg-white/5 border border-border-card text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent'

  const hasFilters = usuarioId || entidad || accion || desde || hasta

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-text-primary text-2xl font-bold">Historial de administración</h1>
        <p className="text-text-secondary text-sm mt-0.5">
          {total} {total === 1 ? 'registro' : 'registros'}
          {hasFilters ? ' (filtrado)' : ''}
        </p>
      </div>

      <form
        onSubmit={handleFiltrar}
        className="bg-bg-card border border-border-card rounded-xl px-4 py-4 mb-4 flex flex-wrap gap-3 items-end"
      >
        <div className="flex flex-col gap-1">
          <label className="text-text-secondary text-xs">Usuario</label>
          <select value={fUsuarioId} onChange={(e) => setFUsuarioId(e.target.value)} className={selectClass}>
            <option value="" className="bg-bg-card">Todos</option>
            {listaUsuarios.map((u) => (
              <option key={u.id} value={u.id} className="bg-bg-card">{u.nombre}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-text-secondary text-xs">Entidad</label>
          <select value={fEntidad} onChange={(e) => setFEntidad(e.target.value)} className={selectClass}>
            <option value="" className="bg-bg-card">Todas</option>
            {Object.entries(ENTIDAD_LABELS).map(([valor, label]) => (
              <option key={valor} value={valor} className="bg-bg-card capitalize">{label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-text-secondary text-xs">Acción</label>
          <select value={fAccion} onChange={(e) => setFAccion(e.target.value)} className={selectClass}>
            <option value="" className="bg-bg-card">Todas</option>
            <option value="crear" className="bg-bg-card">Crear</option>
            <option value="editar" className="bg-bg-card">Editar</option>
            <option value="toggle" className="bg-bg-card">Activar/Desactivar</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-text-secondary text-xs">Desde</label>
          <input type="date" value={fDesde} onChange={(e) => setFDesde(e.target.value)} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-text-secondary text-xs">Hasta</label>
          <input type="date" value={fHasta} onChange={(e) => setFHasta(e.target.value)} className={inputClass} />
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

      <div className="bg-bg-card border border-border-card rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5 border-b border-border-card">
              <th className="text-left px-4 py-3 text-text-secondary font-medium whitespace-nowrap">
                Fecha y hora
              </th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Usuario</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Acción</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Cambios</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton />
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-14 text-text-secondary">
                  {hasFilters ? 'Sin registros para los filtros aplicados' : 'No hay registros de administración aún'}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border-card hover:bg-white/[0.03] transition-colors"
                >
                  <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                    {new Date(item.fecha).toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-3 text-text-primary font-medium">{item.usuario.nombre}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {accionTexto(item)}:{' '}
                    <span className="text-text-primary font-medium">
                      {item.entidad_nombre ?? `(registro eliminado: ${item.entidad_id})`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <CambiosCelda item={item} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
