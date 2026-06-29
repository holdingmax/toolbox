import { useState } from 'react'
import type { HerramientaResumen } from '../api/navegacion.api'
import { registrarAcceso } from '../api/navegacion.api'

interface Props {
  herramienta: HerramientaResumen
}

export default function HerramientaCard({ herramienta }: Props) {
  const [loading, setLoading] = useState(false)

  const handleAbrir = async () => {
    if (loading) return
    setLoading(true)
    try {
      const { url } = await registrarAcceso(herramienta.id)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      window.open(herramienta.url, '_blank', 'noopener,noreferrer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-bg-card border border-border-card rounded-xl p-5 flex items-start gap-4 hover:border-accent/50 transition-colors duration-200">
      <div className="text-3xl flex-shrink-0 mt-0.5">
        {herramienta.icono_url ? (
          <img src={herramienta.icono_url} alt="" className="w-10 h-10 object-contain rounded" />
        ) : (
          <span>🔧</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-text-primary font-semibold text-base mb-1">{herramienta.nombre}</p>
        {herramienta.descripcion && (
          <p className="text-text-secondary text-sm mb-3 line-clamp-2">{herramienta.descripcion}</p>
        )}
        <button
          onClick={handleAbrir}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-60"
        >
          {loading ? 'Abriendo...' : 'Abrir →'}
        </button>
      </div>
    </div>
  )
}
