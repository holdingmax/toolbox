import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMiHistorial } from '../api/auth.api'

export default function MiHistorialPage() {
  const [page, setPage] = useState(1)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const limit = 20

  const { data, isLoading } = useQuery({
    queryKey: ['mi-historial', page, desde, hasta],
    queryFn: () => getMiHistorial({ page, limit, desde: desde || undefined, hasta: hasta || undefined }),
  })

  const totalPages = data ? Math.ceil(data.total / limit) : 1

  const inputClass =
    'bg-bg-card border border-border-card rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent'

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Mi historial de accesos</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-secondary">Desde</label>
          <input
            type="date"
            value={desde}
            onChange={(e) => { setDesde(e.target.value); setPage(1) }}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-secondary">Hasta</label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => { setHasta(e.target.value); setPage(1) }}
            className={inputClass}
          />
        </div>
        {(desde || hasta) && (
          <button
            onClick={() => { setDesde(''); setHasta(''); setPage(1) }}
            className="self-end text-xs text-text-secondary hover:text-text-primary transition-colors px-2 py-2"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-bg-card border border-border-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-card">
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Fecha y hora</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Herramienta</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">IP</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-text-secondary">
                  Cargando...
                </td>
              </tr>
            )}
            {!isLoading && data?.data.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-text-secondary">
                  Sin registros
                </td>
              </tr>
            )}
            {data?.data.map((item) => (
              <tr key={item.id} className="border-b border-border-card/50 hover:bg-white/2 transition-colors">
                <td className="px-4 py-3 text-text-secondary">
                  {new Date(item.fecha_acceso).toLocaleString('es-AR')}
                </td>
                <td className="px-4 py-3 text-text-primary font-medium">
                  {item.herramienta.nombre}
                </td>
                <td className="px-4 py-3 text-text-secondary font-mono text-xs">
                  {item.ip ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-text-secondary">
            {data?.total ?? 0} registros · página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-sm border border-border-card text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg text-sm border border-border-card text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
