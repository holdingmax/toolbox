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

export default function NivelCard({ nivel }: { nivel: NivelResumen }) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(`/nivel/${nivel.id}`)}
      className="group w-full text-left bg-bg-card border border-border-card rounded-xl p-5
                 flex items-center gap-5 transition-all duration-200
                 hover:border-accent hover:-translate-y-0.5
                 hover:shadow-[0_8px_30px_rgba(124,58,237,0.25)]"
    >
      {/* Avatar */}
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0 select-none"
        style={{ background: avatarGradient(nivel.id) }}
      >
        {nivel.icono_url ? (
          <img src={nivel.icono_url} alt="" className="w-8 h-8 object-contain" />
        ) : (
          initials(nivel.nombre)
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-text-primary font-bold text-lg leading-snug truncate mb-1.5">
          {nivel.nombre}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent capitalize font-medium flex-shrink-0">
            {nivel.tipo}
          </span>
          {nivel.descripcion && (
            <span className="text-text-secondary text-sm truncate">{nivel.descripcion}</span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <span className="text-text-secondary/50 group-hover:text-accent transition-colors flex-shrink-0 text-xl leading-none">
        →
      </span>
    </button>
  )
}
