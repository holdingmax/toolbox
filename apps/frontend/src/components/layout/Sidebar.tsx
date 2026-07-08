import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import CubeIcon from '../CubeIcon'

function getInitials(nombre: string): string {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const isAdmin = usuario?.rol.nombre === 'Administrador'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-accent/20 text-accent'
        : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
    }`

  return (
    <>
      {/* Backdrop — solo mobile, solo cuando el sidebar está abierto */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-60 min-h-screen bg-bg-sidebar flex flex-col border-r border-border-card flex-shrink-0 transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="px-4 py-5 border-b border-border-card">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <CubeIcon className="w-16 h-16 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-text-primary font-bold text-xl tracking-[0.18em] leading-none">
                  TOOLBOX
                </p>
                <p className="text-text-secondary text-[13px] mt-1.5">HoldingMax</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="md:hidden text-text-secondary hover:text-text-primary text-xl leading-none flex-shrink-0"
              aria-label="Cerrar menú"
            >
              ×
            </button>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {/* Nav principal */}
          <NavLink to="/dashboard" className={linkClass} onClick={onClose}>
            <span>⊞</span>
            <span>Inicio</span>
          </NavLink>

          <NavLink to={isAdmin ? '/admin/historial' : '/historial'} className={linkClass} onClick={onClose}>
            <span>📋</span>
            <span>Historial</span>
          </NavLink>
          <NavLink to="/configuracion" className={linkClass} onClick={onClose}>
            <span>⚙️</span>
            <span>Configuración</span>
          </NavLink>

          {/* Sección Administración — solo para Administrador */}
          {isAdmin && (
            <div className="pt-3">
              <p className="px-3 pb-1 text-xs font-semibold text-text-secondary/50 uppercase tracking-wider">
                Administración
              </p>
              <NavLink to="/admin/usuarios" className={linkClass} onClick={onClose}>
                <span className="pl-2">👥</span>
                <span>Usuarios</span>
              </NavLink>
              <NavLink to="/admin/niveles" className={linkClass} onClick={onClose}>
                <span className="pl-2">🏢</span>
                <span>Niveles</span>
              </NavLink>
              <NavLink to="/admin/herramientas" className={linkClass} onClick={onClose}>
                <span className="pl-2">🔧</span>
                <span>Herramientas</span>
              </NavLink>
              <NavLink to="/admin/permisos" className={linkClass} onClick={onClose}>
                <span className="pl-2">🔑</span>
                <span>Permisos</span>
              </NavLink>
            </div>
          )}
        </nav>

        {/* Footer usuario */}
        {usuario && (
          <div className="px-3 py-4 border-t border-border-card">
            <div className="flex items-center gap-3 px-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {getInitials(usuario.nombre)}
              </div>
              <div className="min-w-0">
                <p className="text-text-primary text-sm font-medium truncate">{usuario.nombre}</p>
                <p className="text-text-secondary text-xs truncate">{usuario.rol.nombre}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-white/5 hover:text-status-inactive transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
