import client from './client'

export interface NivelResumen {
  id: string
  nombre: string
  descripcion: string | null
  tipo: string
  icono_url: string | null
  color_fondo: string | null
  orden: number
  tiene_hijos: boolean
}

export interface HerramientaResumen {
  id: string
  nombre: string
  descripcion: string | null
  url: string
  icono_url: string | null
  soporte: string | null
  orden: number
}

export interface NivelDetalle {
  nivel: NivelResumen & { ruta: string; parent_id: string | null }
  hijos: NivelResumen[]
  herramientas: HerramientaResumen[]
  breadcrumb: { id: string; nombre: string }[]
}

export const getRootNodes = () =>
  client.get<NivelResumen[]>('/api/navegacion').then((r) => r.data)

export const getNivelDetalle = (id: string) =>
  client.get<NivelDetalle>(`/api/navegacion/${id}`).then((r) => r.data)

export const registrarAcceso = (herramienta_id: string) =>
  client.post<{ url: string }>('/api/accesos', { herramienta_id }).then((r) => r.data)

export interface HerramientaAcceso {
  id: string
  nombre: string
  descripcion: string | null
  url: string
  icono_url: string | null
}

export interface AccesoReciente {
  herramienta: HerramientaAcceso
  ultima_vez: string
}

export interface HerramientasDisponibles {
  total: number
  herramientas: (HerramientaAcceso & { orden: number })[]
}

export const getAccesosRecientes = (limit = 4) =>
  client.get<AccesoReciente[]>('/api/accesos/historial', { params: { limit } }).then((r) => r.data)

export const getHerramientasDisponibles = () =>
  client.get<HerramientasDisponibles>('/api/accesos/herramientas').then((r) => r.data)
