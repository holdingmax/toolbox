import { useNavigate } from 'react-router-dom'
import type { NivelResumen } from '../api/navegacion.api'
import { getPaletteColor, paletteGradient } from '../utils/colorPalette'
import IconoConFallback from './IconoConFallback'

function FolderIcon() {
  return (
    <svg className="w-8 h-8 text-accent/60" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  )
}

interface NivelCardProps {
  nivel: NivelResumen
  /** 'empresa': tarjeta de portada con imagen/color de marca (nivel raíz).
   *  'area': tarjeta compacta oscura con ícono de carpeta (niveles intermedios). */
  variant?: 'empresa' | 'area'
}

export default function NivelCard({ nivel, variant = 'empresa' }: NivelCardProps) {
  const navigate = useNavigate()

  /* ── Tarjeta compacta para niveles intermedios ── */
  if (variant === 'area') {
    return (
      <button
        onClick={() => navigate(`/nivel/${nivel.id}`)}
        className="group w-full bg-bg-card border border-border-card rounded-xl px-5 py-4
                   flex items-center gap-4 cursor-pointer transition-all duration-200 text-left
                   hover:scale-[1.02] hover:border-accent hover:shadow-[0_0_0_1px_#7c3aed,0_0_20px_rgba(124,58,237,0.25)]"
      >
        <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20
                        flex items-center justify-center flex-shrink-0
                        group-hover:bg-accent/15 transition-colors">
          <FolderIcon />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-text-primary font-semibold text-sm leading-snug truncate">
            {nivel.nombre}
          </p>
          <span className="text-xs text-text-secondary capitalize">{nivel.tipo}</span>
        </div>
        <span className="text-text-secondary/40 group-hover:text-accent transition-colors flex-shrink-0 text-lg">
          →
        </span>
      </button>
    )
  }

  /* ── Tarjeta de portada para empresa (nivel raíz) ── */

  const palette = getPaletteColor(nivel.nombre)

  return (
    <button
      onClick={() => navigate(`/nivel/${nivel.id}`)}
      className="group w-full h-[280px] rounded-2xl rounded-t-none overflow-hidden cursor-pointer
                 bg-bg-card border border-border-card border-t-[3px] flex flex-col transition-all duration-200
                 hover:scale-[1.02] hover:border-accent hover:shadow-[0_0_0_1px_#7c3aed,0_0_32px_rgba(124,58,237,0.45)]"
      style={{ borderTopColor: palette.bg }}
    >
      {/* Zona del logo (75%): logo real grande, o iniciales agrandadas sobre tinte sutil de marca */}
      <div
        className="flex-[3] min-h-0 overflow-hidden flex items-center justify-center p-6"
        style={{ background: paletteGradient(palette.bg) }}
      >
        <IconoConFallback nombre={nivel.nombre} icono_url={nivel.icono_url} tamano={88} fontTamano={28} />
      </div>

      {/* Zona de texto (25%): badge y nombre centrados verticalmente */}
      <div className="flex-1 min-h-0 overflow-hidden bg-bg-card flex flex-col items-start justify-center gap-1.5 px-4">
        <span className="text-xs px-2 py-0.5 rounded-full bg-white/15 text-white/80
                         capitalize font-medium backdrop-blur-sm border border-white/10">
          {nivel.tipo}
        </span>
        <p className="text-text-primary font-bold text-base leading-snug text-left line-clamp-2">
          {nivel.nombre}
        </p>
      </div>
    </button>
  )
}
