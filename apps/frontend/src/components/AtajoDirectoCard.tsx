import type { HerramientaAcceso } from '../api/navegacion.api'
import { getPaletteColor, paletteGradient } from '../utils/colorPalette'
import IconoConFallback from './IconoConFallback'

interface AtajoDirectoCardProps {
  herramienta: HerramientaAcceso
  onAbrir: () => void
  abriendo: boolean
}

export default function AtajoDirectoCard({ herramienta, onAbrir, abriendo }: AtajoDirectoCardProps) {
  const palette = getPaletteColor(herramienta.nombre)

  return (
    <div
      className="max-w-sm rounded-2xl rounded-t-none overflow-hidden
                 bg-bg-card border border-border-card border-t-[3px] flex flex-col"
      style={{ borderTopColor: palette.bg }}
    >
      {/* Zona del logo: logo real grande, o iniciales agrandadas sobre tinte de marca */}
      <div
        className="h-[200px] flex items-center justify-center p-6"
        style={{ background: paletteGradient(palette.bg) }}
      >
        <IconoConFallback nombre={herramienta.nombre} icono_url={herramienta.icono_url} tamano={96} fontTamano={32} />
      </div>

      {/* Zona de texto: badge, nombre, descripción y botón de acción */}
      <div className="bg-bg-card flex flex-col items-start gap-2 px-6 py-5">
        <span className="text-xs px-2 py-0.5 rounded-full bg-white/15 text-white/80
                         font-medium backdrop-blur-sm border border-white/10">
          Tu herramienta
        </span>
        <p className="text-text-primary font-bold text-lg leading-snug text-left">
          {herramienta.nombre}
        </p>
        {herramienta.descripcion && (
          <p className="text-text-secondary text-sm leading-snug text-left mb-1">
            {herramienta.descripcion}
          </p>
        )}
        <button
          type="button"
          onClick={onAbrir}
          disabled={abriendo}
          className="mt-1 bg-gradient-to-r from-[#7c3aed] to-[#5b21b6] hover:from-[#8b5cf6] hover:to-[#6d28d9]
                     text-white font-semibold py-2.5 px-6 rounded-lg transition-all text-sm
                     disabled:opacity-60"
        >
          {abriendo ? 'Abriendo…' : 'Abrir →'}
        </button>
      </div>
    </div>
  )
}
