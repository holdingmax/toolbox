import { useNavigate } from 'react-router-dom'
import type { NivelResumen } from '../api/navegacion.api'

const AVATAR_STOPS: [string, string][] = [
  ['#7c3aed', '#5b21b6'],
  ['#2563eb', '#1e40af'],
  ['#059669', '#065f46'],
  ['#dc2626', '#991b1b'],
  ['#d97706', '#92400e'],
  ['#0891b2', '#164e63'],
  ['#db2777', '#9d174d'],
]

function avatarGradient(id: string): string {
  const sum = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const [c1, c2] = AVATAR_STOPS[sum % AVATAR_STOPS.length]
  return `linear-gradient(135deg, ${c1}, ${c2})`
}

function initials(nombre: string): string {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function FolderIcon() {
  return (
    <svg className="w-8 h-8 text-accent/60" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  )
}

function LogoPendienteIcon() {
  return (
    <svg className="w-10 h-10 opacity-25" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
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
                   hover:border-accent hover:shadow-[0_0_0_1px_#7c3aed,0_0_20px_rgba(124,58,237,0.25)]"
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

  // Background: usa color_fondo si está configurado, sino gradiente automático
  const bgStyle = nivel.color_fondo
    ? { background: nivel.color_fondo }
    : { background: avatarGradient(nivel.id) }

  // Sin logo: placeholder si tiene color de marca, iniciales si solo tiene gradiente auto
  const renderSinLogo = nivel.color_fondo ? (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
      <LogoPendienteIcon />
      <span className="text-white/25 text-xs font-medium tracking-wide">Logo pendiente</span>
    </div>
  ) : (
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="text-white font-bold text-4xl select-none opacity-60">
        {initials(nivel.nombre)}
      </span>
    </div>
  )

  return (
    <button
      onClick={() => navigate(`/nivel/${nivel.id}`)}
      className="group relative w-full min-h-[200px] rounded-2xl overflow-hidden cursor-pointer
                 border border-border-card transition-all duration-200
                 hover:border-accent hover:shadow-[0_0_0_1px_#7c3aed,0_0_32px_rgba(124,58,237,0.45)]"
    >
      {/* Fondo */}
      <div className="absolute inset-0" style={bgStyle} />

      {/* Logo con object-contain si existe */}
      {nivel.icono_url ? (
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <img
            src={nivel.icono_url}
            alt={nivel.nombre}
            className="w-full h-full object-contain"
          />
        </div>
      ) : renderSinLogo}

      {/* Degradé oscuro inferior */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

      {/* Nombre y badge superpuestos */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col items-start gap-1.5">
        <span className="text-xs px-2 py-0.5 rounded-full bg-white/15 text-white/80
                         capitalize font-medium backdrop-blur-sm border border-white/10">
          {nivel.tipo}
        </span>
        <p className="text-white font-bold text-base leading-snug text-left line-clamp-2 drop-shadow-sm">
          {nivel.nombre}
        </p>
      </div>
    </button>
  )
}
