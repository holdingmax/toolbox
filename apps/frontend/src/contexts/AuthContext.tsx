import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { UsuarioAutenticado } from '../api/auth.api'

interface AuthState {
  token: string | null
  usuario: UsuarioAutenticado | null
}

interface AuthContextValue extends AuthState {
  login: (token: string, usuario: UsuarioAutenticado) => void
  logout: () => void
  actualizarUsuario: (cambios: Partial<UsuarioAutenticado>) => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadFromStorage(): AuthState {
  try {
    const token = localStorage.getItem('toolbox_token')
    const raw = localStorage.getItem('toolbox_user')
    const usuario = raw ? (JSON.parse(raw) as UsuarioAutenticado) : null
    return { token, usuario }
  } catch {
    return { token: null, usuario: null }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadFromStorage)

  const login = useCallback((token: string, usuario: UsuarioAutenticado) => {
    localStorage.setItem('toolbox_token', token)
    localStorage.setItem('toolbox_user', JSON.stringify(usuario))
    setState({ token, usuario })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('toolbox_token')
    localStorage.removeItem('toolbox_user')
    setState({ token: null, usuario: null })
  }, [])

  const actualizarUsuario = useCallback((cambios: Partial<UsuarioAutenticado>) => {
    setState((prev) => {
      if (!prev.usuario) return prev
      const usuario = { ...prev.usuario, ...cambios }
      localStorage.setItem('toolbox_user', JSON.stringify(usuario))
      return { ...prev, usuario }
    })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout, actualizarUsuario, isAuthenticated: !!state.token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
