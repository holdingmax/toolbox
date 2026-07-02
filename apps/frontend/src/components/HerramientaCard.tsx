import { useState } from 'react'
import type { HerramientaResumen } from '../api/navegacion.api'
import { registrarAcceso } from '../api/navegacion.api'
import { getPaletteColor } from '../utils/colorPalette'

interface Props {
  herramienta: HerramientaResumen
}

function getInitials(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean)
  if (palabras.length === 0) return '?'
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase()
  return (palabras[0][0] + palabras[1][0]).toUpperCase()
}

export default function HerramientaCard({ herramienta }: Props) {
  const [loading, setLoading] = useState(false)
  const palette = getPaletteColor(herramienta.nombre)

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
    <div className="bg-bg-card border border-border-card rounded-xl p-5 flex items-start gap-4 cursor-pointer transition-all duration-200 hover:border-accent/50 hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(124,58,237,0.25)]">
      <div className="flex-shrink-0 mt-0.5">
        {herramienta.icono_url ? (
          <img src={herramienta.icono_url} alt="" className="w-10 h-10 object-contain rounded" />
        ) : (
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-semibold"
            style={{ background: palette.bg, color: palette.text }}
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
          <p className="text-text-secondary/85 text-xs mb-3">Soporte: {herramienta.soporte}</p>
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
