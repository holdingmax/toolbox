import client from './client'

export interface LoginPayload {
  email: string
  password: string
}

export interface UsuarioAutenticado {
  id: string
  nombre: string
  email: string
  rol: { id: string; nombre: string }
}

export interface LoginResponse {
  access_token: string
  usuario: UsuarioAutenticado
}

export const login = (payload: LoginPayload) =>
  client.post<LoginResponse>('/api/auth/login', payload).then((r) => r.data)

export const getMe = () =>
  client.get('/api/auth/me').then((r) => r.data)

export const changePassword = (contraseña_actual: string, nueva_contraseña: string) =>
  client
    .patch<{ ok: boolean }>('/api/auth/password', { contraseña_actual, nueva_contraseña })
    .then((r) => r.data)
