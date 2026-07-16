import { getPaletteColor, initials } from '../utils/colorPalette'

interface IconoConFallbackProps {
  nombre: string
  icono_url: string | null
  tamano: number
  fontTamano: number
}

export default function IconoConFallback({ nombre, icono_url, tamano, fontTamano }: IconoConFallbackProps) {
  if (icono_url) {
    return (
      <img
        src={icono_url}
        alt={nombre}
        className="max-w-full max-h-full object-contain"
      />
    )
  }

  const palette = getPaletteColor(nombre)
  return (
    <div
      className="rounded-2xl flex items-center justify-center flex-shrink-0"
      style={{ width: tamano, height: tamano, background: palette.bg }}
    >
      <span className="font-bold select-none" style={{ fontSize: fontTamano, color: palette.text }}>
        {initials(nombre)}
      </span>
    </div>
  )
}
