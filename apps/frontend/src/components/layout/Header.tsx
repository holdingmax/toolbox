import { useAuth } from '../../contexts/AuthContext'

interface HeaderProps {
  onToggleSidebar: () => void
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { usuario } = useAuth()

  return (
    <header className="h-15 px-4 md:px-6 flex items-center justify-between gap-3 border-b border-border-card bg-bg-sidebar/50">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="md:hidden text-text-secondary hover:text-text-primary text-xl leading-none flex-shrink-0"
          aria-label="Abrir menú"
        >
          ☰
        </button>
        <span className="hidden md:block text-text-secondary text-sm truncate">
          Portal de herramientas corporativas
        </span>
      </div>
      {usuario && (
        <div className="flex items-center gap-2 text-sm flex-shrink-0">
          <span className="hidden sm:inline text-text-secondary truncate max-w-[140px]">
            {usuario.nombre}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs whitespace-nowrap">
            {usuario.rol.nombre}
          </span>
        </div>
      )}
    </header>
  )
}
