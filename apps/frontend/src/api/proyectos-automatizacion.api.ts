import client from './client'

// Pipeline único y fijo — igual para todos los proyectos. Texto libre
// validado por el backend (class-validator), no un enum de base de datos.
export const ETAPAS_PIPELINE_PROYECTO = [
  'iniciado',
  'en_relevamiento',
  'aprobado',
  'en_cola',
  'iniciando_desarrollo',
  'en_proceso',
  'en_pruebas',
  'finalizado',
] as const

export const ETAPA_LABELS: Record<string, string> = {
  iniciado: 'Iniciado',
  en_relevamiento: 'En relevamiento',
  aprobado: 'Aprobado',
  en_cola: 'En cola',
  iniciando_desarrollo: 'Iniciando desarrollo',
  en_proceso: 'En proceso',
  en_pruebas: 'En pruebas',
  finalizado: 'Finalizado',
}

// Semáforo por etapa: 3 estados, sin un cuarto "con problema" persistente —
// un problema real se explica en observaciones, no con un color nuevo.
export const ESTADOS_ETAPA = ['no_alcanzada', 'en_curso', 'completada'] as const

// Overlay a nivel proyecto, no una etapa más del pipeline.
export const ESTADOS_GENERALES_PROYECTO = ['normal', 'pausado', 'rechazado'] as const

export const ESTADO_GENERAL_LABELS: Record<string, string> = {
  normal: 'Normal',
  pausado: 'Pausado',
  rechazado: 'Rechazado',
}

export interface ProyectoEtapaEstado {
  id: string
  etapa: string
  estado: string
  actualizado_en: string
}

export interface ProyectoAutomatizacion {
  id: string
  titulo: string
  estado_general: string
  fecha_inicio: string | null
  observaciones: string | null
  nivel_id: string
  activo: boolean
  creado_en: string
  actualizado_en: string
  nivel: { id: string; nombre: string }
  etapas: ProyectoEtapaEstado[]
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

// Etapa más avanzada con estado 'en_curso' o, si no hay ninguna en curso, la
// última 'completada' -- usado para ordenar por avance en la vista de tabla.
export function indiceAvance(proyecto: ProyectoAutomatizacion): number {
  const enCurso = proyecto.etapas.find((e) => e.estado === 'en_curso')
  if (enCurso) return ETAPAS_PIPELINE_PROYECTO.indexOf(enCurso.etapa as never)

  let ultimaCompletada = -1
  for (const etapa of proyecto.etapas) {
    if (etapa.estado !== 'completada') continue
    const i = ETAPAS_PIPELINE_PROYECTO.indexOf(etapa.etapa as never)
    if (i > ultimaCompletada) ultimaCompletada = i
  }
  return ultimaCompletada
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
  estado_general?: string
}) =>
  client
    .get<ProyectosAutomatizacionPagedResponse>('/api/admin/proyectos-automatizacion', { params })
    .then((r) => r.data)

export const createProyectoAutomatizacion = (data: {
  titulo: string
  nivel_id: string
  estado_general?: string
  fecha_inicio?: string
  observaciones?: string
}) => client.post<ProyectoAutomatizacion>('/api/admin/proyectos-automatizacion', data).then((r) => r.data)

export const updateProyectoAutomatizacion = (
  id: string,
  data: Partial<{
    titulo: string
    nivel_id: string
    estado_general: string
    fecha_inicio: string
    observaciones: string
    activo: boolean
  }>,
) => client.patch<ProyectoAutomatizacion>(`/api/admin/proyectos-automatizacion/${id}`, data).then((r) => r.data)

export const toggleActivoProyectoAutomatizacion = (id: string) =>
  client.patch<ProyectoAutomatizacion>(`/api/admin/proyectos-automatizacion/${id}/activo`).then((r) => r.data)

// Un click en un círculo de la vista de tabla -- una etapa puntual por
// request, no la grilla entera.
export const updateEtapaProyecto = (id: string, etapa: string, estado: string) =>
  client
    .patch<ProyectoAutomatizacion>(`/api/admin/proyectos-automatizacion/${id}/etapas/${etapa}`, { estado })
    .then((r) => r.data)

// Lectura para jefes de área — el backend ya filtra automáticamente según
// los permisos reales del usuario, sin ningún parámetro de nivel acá.
export const getProyectosAutomatizacionVisibles = () =>
  client.get<ProyectoAutomatizacion[]>('/api/proyectos-automatizacion').then((r) => r.data)
