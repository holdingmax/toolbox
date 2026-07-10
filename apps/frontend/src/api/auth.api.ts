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

export const forgotPassword = (email: string) =>
  client.post<{ ok: boolean }>('/api/auth/forgot-password', { email }).then((r) => r.data)

export const resetPassword = (token: string, nueva_contraseña: string) =>
  client
    .post<{ ok: boolean }>('/api/auth/reset-password', { token, nueva_contraseña })
    .then((r) => r.data)

export const getMe = () =>
  client.get('/api/auth/me').then((r) => r.data)

export const changePassword = (contraseña_actual: string, nueva_contraseña: string) =>
  client
    .patch<{ ok: boolean }>('/api/auth/password', { contraseña_actual, nueva_contraseña })
    .then((r) => r.data)

export interface MiHistorialItem {
  id: string
  herramienta_id: string
  fecha_acceso: string
  ip: string | null
  herramienta: { id: string; nombre: string }
}

export interface MiHistorialResponse {
  data: MiHistorialItem[]
  total: number
  page: number
  limit: number
}

export const getMiHistorial = (params: {
  page?: number
  limit?: number
  desde?: string
  hasta?: string
}) =>
  client
    .get<MiHistorialResponse>('/api/accesos/mi-historial', { params })
    .then((r) => r.data)
