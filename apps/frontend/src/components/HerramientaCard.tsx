import { useState } from 'react'
import type { HerramientaResumen } from '../api/navegacion.api'
import { registrarAcceso } from '../api/navegacion.api'

interface Props {
  herramienta: HerramientaResumen
}

const INITIALS_COLORS = [
  '#7c3aed', '#2563eb', '#059669',
  '#dc2626', '#d97706', '#0891b2', '#db2777',
]

function getInitials(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean)
  if (palabras.length === 0) return '?'
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase()
  return (palabras[0][0] + palabras[1][0]).toUpperCase()
}

function getInitialsColor(id: string): string {
  const sum = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return INITIALS_COLORS[sum % INITIALS_COLORS.length]
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
      <div className="flex-shrink-0 mt-0.5">
        {herramienta.icono_url ? (
          <img src={herramienta.icono_url} alt="" className="w-10 h-10 object-contain rounded" />
        ) : (
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-semibold"
            style={{ background: getInitialsColor(herramienta.id) }}
          >
            {getInitials(herramienta.nombre)}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-text-primary font-semibold text-base mb-1">{herramienta.nombre}</p>
        {herramienta.descripcion && (
          <p className={`text-text-secondary text-sm line-clamp-2 ${herramienta.soporte ? 'mb-1' : 'mb-3'}`}>
            {herramienta.descripcion}
          </p>
        )}
        {herramienta.soporte && (
          <p className="text-text-secondary/60 text-xs mb-3">Soporte: {herramienta.soporte}</p>
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
