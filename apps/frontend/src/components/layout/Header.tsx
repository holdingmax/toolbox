import { useAuth } from '../../contexts/AuthContext'

export default function Header() {
  const { usuario } = useAuth()

  return (
    <header className="h-15 px-6 flex items-center justify-between border-b border-border-card bg-bg-sidebar/50">
      <span className="text-text-secondary text-sm">Portal de herramientas corporativas</span>
      {usuario && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-text-secondary">{usuario.nombre}</span>
          <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs">
            {usuario.rol.nombre}
          </span>
        </div>
      )}
    </header>
  )
}
