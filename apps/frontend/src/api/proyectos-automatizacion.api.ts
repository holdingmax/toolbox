import client from './client'

// Texto libre validado por el backend (class-validator), no un enum de base
// de datos — sumar un estado nuevo es agregar un string acá, sin migración.
export const ESTADOS_PROYECTO_AUTOMATIZACION = [
  'pendiente',
  'iniciado',
  'en_proceso',
  'testing',
  'finalizado',
  'pausado',
] as const

export const ESTADO_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  iniciado: 'Iniciado',
  en_proceso: 'En proceso',
  testing: 'En pruebas',
  finalizado: 'Finalizado',
  pausado: 'Pausado',
}

export interface ProyectoAutomatizacion {
  id: string
  titulo: string
  estado: string
  fecha_inicio: string | null
  notas: string | null
  nivel_id: string
  activo: boolean
  creado_en: string
  actualizado_en: string
  nivel: { id: string; nombre: string }
}

// fecha_inicio es un campo "solo fecha" guardado como medianoche UTC
// (ej. 2026-07-28T00:00:00.000Z). Formatearlo con new Date(...).toLocaleDateString()
// sin más lo convierte a la zona horaria local del navegador antes de mostrarlo —
// en cualquier huso horario detrás de UTC (Argentina, UTC-3), medianoche UTC cae
// en el día anterior en hora local, y la fecha se muestra un día antes de la
// real. Forzar timeZone: 'UTC' evita esa conversión.
export function formatFechaProyecto(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' })
}

export interface ProyectosAutomatizacionPagedResponse {
  data: ProyectoAutomatizacion[]
  total: number
  page: number
  limit: number
}

export const getProyectosAutomatizacionAdmin = (params: {
  page?: number
  limit?: number
  nivel_id?: string
  estado?: string
}) =>
  client
    .get<ProyectosAutomatizacionPagedResponse>('/api/admin/proyectos-automatizacion', { params })
    .then((r) => r.data)

export const createProyectoAutomatizacion = (data: {
  titulo: string
  nivel_id: string
  estado?: string
  fecha_inicio?: string
  notas?: string
}) => client.post<ProyectoAutomatizacion>('/api/admin/proyectos-automatizacion', data).then((r) => r.data)

export const updateProyectoAutomatizacion = (
  id: string,
  data: Partial<{
    titulo: string
    nivel_id: string
    estado: string
    fecha_inicio: string
    notas: string
    activo: boolean
  }>,
) => client.patch<ProyectoAutomatizacion>(`/api/admin/proyectos-automatizacion/${id}`, data).then((r) => r.data)

export const toggleActivoProyectoAutomatizacion = (id: string) =>
  client.patch<ProyectoAutomatizacion>(`/api/admin/proyectos-automatizacion/${id}/activo`).then((r) => r.data)

// Lectura para jefes de área — el backend ya filtra automáticamente según
// los permisos reales del usuario, sin ningún parámetro de nivel acá.
export const getProyectosAutomatizacionVisibles = () =>
  client.get<ProyectoAutomatizacion[]>('/api/proyectos-automatizacion').then((r) => r.data)
