import client from './client'

export interface UsuarioAdmin {
  id: string
  nombre: string
  email: string
  rol_id: string
  rol: { id: string; nombre: string; descripcion: string | null; activo: boolean }
  activo: boolean
  creado_en: string
  actualizado_en: string
}

export interface RolAdmin {
  id: string
  nombre: string
  descripcion: string | null
  activo: boolean
}

export interface UsuariosPagedResponse {
  data: UsuarioAdmin[]
  total: number
  page: number
  limit: number
}

export interface CreateUsuarioPayload {
  nombre: string
  email: string
  password: string
  rol_id: string
}

export interface UpdateUsuarioPayload {
  nombre?: string
  email?: string
  password?: string
  rol_id?: string
  activo?: boolean
}

export const getUsuarios = (params: { page?: number; limit?: number; buscar?: string }) =>
  client
    .get<UsuariosPagedResponse>('/api/admin/usuarios', { params })
    .then((r) => r.data)

export const getUsuario = (id: string) =>
  client.get<UsuarioAdmin>(`/api/admin/usuarios/${id}`).then((r) => r.data)

export const createUsuario = (payload: CreateUsuarioPayload) =>
  client.post<UsuarioAdmin>('/api/admin/usuarios', payload).then((r) => r.data)

export const updateUsuario = (id: string, payload: UpdateUsuarioPayload) =>
  client.patch<UsuarioAdmin>(`/api/admin/usuarios/${id}`, payload).then((r) => r.data)

export const toggleEstadoUsuario = (id: string) =>
  client.patch<UsuarioAdmin>(`/api/admin/usuarios/${id}/estado`).then((r) => r.data)

export const getRoles = () =>
  client.get<RolAdmin[]>('/api/admin/roles').then((r) => r.data)

// ── Niveles ───────────────────────────────────────────────────────────────────

export interface NivelAdmin {
  id: string
  nombre: string
  descripcion: string | null
  parent_id: string | null
  tipo: string
  ruta: string
  orden: number
  icono_url: string | null
  activo: boolean
  creado_en: string
  actualizado_en: string
}

export interface CreateNivelPayload {
  nombre: string
  tipo: string
  descripcion?: string
  parent_id?: string
  orden?: number
  icono_url?: string
}

export interface UpdateNivelPayload {
  nombre?: string
  tipo?: string
  descripcion?: string
  parent_id?: string | null
  orden?: number
  icono_url?: string
  activo?: boolean
}

export const getNiveles = () =>
  client.get<NivelAdmin[]>('/api/admin/niveles').then((r) => r.data)

export const getTiposNivel = () =>
  client.get<string[]>('/api/admin/niveles/tipos').then((r) => r.data)

export const createNivel = (payload: CreateNivelPayload) =>
  client.post<NivelAdmin>('/api/admin/niveles', payload).then((r) => r.data)

export const updateNivel = (id: string, payload: UpdateNivelPayload) =>
  client.patch<NivelAdmin>(`/api/admin/niveles/${id}`, payload).then((r) => r.data)

export const toggleEstadoNivel = (id: string) =>
  client.patch<NivelAdmin>(`/api/admin/niveles/${id}/estado`).then((r) => r.data)

// ── Herramientas ──────────────────────────────────────────────────────────────

export interface HerramientaAdmin {
  id: string
  nombre: string
  descripcion: string | null
  url: string
  icono_url: string | null
  soporte: string | null
  orden: number
  activo: boolean
  estado_servicio: 'ok' | 'error' | 'desconocido'
  ultima_verificacion: string | null
  creado_en: string
  actualizado_en: string
}

export interface HerramientasPagedResponse {
  data: HerramientaAdmin[]
  total: number
  page: number
  limit: number
}

export interface PublicacionAdmin {
  id: string
  herramienta_id: string
  nivel_id: string
  activo: boolean
  nivel: { id: string; nombre: string; tipo: string; ruta: string }
}

export interface CreateHerramientaPayload {
  nombre: string
  url: string
  descripcion?: string
  icono_url?: string
  soporte?: string
  orden?: number
}

export interface UpdateHerramientaPayload {
  nombre?: string
  url?: string
  descripcion?: string
  icono_url?: string
  soporte?: string
  orden?: number
  activo?: boolean
}

export const getHerramientas = (params: { page?: number; limit?: number; buscar?: string }) =>
  client.get<HerramientasPagedResponse>('/api/admin/herramientas', { params }).then((r) => r.data)

export const createHerramienta = (payload: CreateHerramientaPayload) =>
  client.post<HerramientaAdmin>('/api/admin/herramientas', payload).then((r) => r.data)

export const updateHerramienta = (id: string, payload: UpdateHerramientaPayload) =>
  client.patch<HerramientaAdmin>(`/api/admin/herramientas/${id}`, payload).then((r) => r.data)

export const toggleEstadoHerramienta = (id: string) =>
  client.patch<HerramientaAdmin>(`/api/admin/herramientas/${id}/estado`).then((r) => r.data)

export const verificarSaludHerramientas = () =>
  client
    .post<{ id: string; nombre: string; estado_servicio: string }[]>('/api/admin/herramientas/verificar-salud')
    .then((r) => r.data)

export const getPublicaciones = (herramientaId: string) =>
  client.get<PublicacionAdmin[]>(`/api/admin/herramientas/${herramientaId}/publicaciones`).then((r) => r.data)

export const createPublicacion = (herramientaId: string, nivel_id: string) =>
  client.post<PublicacionAdmin>(`/api/admin/herramientas/${herramientaId}/publicaciones`, { nivel_id }).then((r) => r.data)

export const togglePublicacion = (herramientaId: string, pubId: string) =>
  client.patch<PublicacionAdmin>(`/api/admin/herramientas/${herramientaId}/publicaciones/${pubId}`).then((r) => r.data)

// ── Permisos ──────────────────────────────────────────────────────────────────

export interface UsuarioSelector {
  id: string
  nombre: string
  email: string
  rol: { nombre: string }
}

export interface PermisoAdmin {
  id: string
  usuario_id: string
  nivel_id: string
  activo: boolean
  creado_en: string
  actualizado_en: string
  nivel: { id: string; nombre: string; tipo: string; ruta: string }
}

export const getUsuariosSelector = () =>
  client.get<UsuarioSelector[]>('/api/admin/permisos/usuarios').then((r) => r.data)

export const getPermisos = (usuarioId: string) =>
  client.get<PermisoAdmin[]>('/api/admin/permisos', { params: { usuario_id: usuarioId } }).then((r) => r.data)

export const createPermiso = (usuario_id: string, nivel_id: string) =>
  client.post<PermisoAdmin>('/api/admin/permisos', { usuario_id, nivel_id }).then((r) => r.data)

export const togglePermiso = (id: string) =>
  client.patch<PermisoAdmin>(`/api/admin/permisos/${id}`).then((r) => r.data)

// ── Historial ─────────────────────────────────────────────────────────────────

export interface HistorialItem {
  id: string
  usuario_id: string
  herramienta_id: string
  fecha_acceso: string
  ip: string | null
  user_agent: string | null
  usuario: { id: string; nombre: string; email: string }
  herramienta: { id: string; nombre: string }
}

export interface HistorialPagedResponse {
  data: HistorialItem[]
  total: number
  page: number
  limit: number
}

export const getHistorial = (params: {
  page?: number
  limit?: number
  usuario_id?: string
  herramienta_id?: string
  nivel_id?: string
  desde?: string
  hasta?: string
}) => client.get<HistorialPagedResponse>('/api/admin/historial', { params }).then((r) => r.data)

export const getHistorialUsuarios = () =>
  client.get<{ id: string; nombre: string }[]>('/api/admin/historial/usuarios').then((r) => r.data)

export const getHistorialHerramientas = () =>
  client.get<{ id: string; nombre: string }[]>('/api/admin/historial/herramientas').then((r) => r.data)

// ── Historial de administración ─────────────────────────────────────────────

export interface HistorialAdministracionItem {
  id: string
  accion: 'crear' | 'editar' | 'toggle'
  entidad: 'usuario' | 'nivel' | 'herramienta' | 'permiso' | 'publicacion'
  entidad_id: string
  entidad_nombre: string | null
  cambios: Record<string, unknown> | null
  ip: string | null
  fecha: string
  usuario: { id: string; nombre: string; email: string }
}

export interface HistorialAdministracionPagedResponse {
  data: HistorialAdministracionItem[]
  total: number
  page: number
  limit: number
}

export const getHistorialAdministracion = (params: {
  page?: number
  limit?: number
  usuario_id?: string
  entidad?: string
  accion?: string
  desde?: string
  hasta?: string
}) =>
  client
    .get<HistorialAdministracionPagedResponse>('/api/admin/historial/administracion', { params })
    .then((r) => r.data)
