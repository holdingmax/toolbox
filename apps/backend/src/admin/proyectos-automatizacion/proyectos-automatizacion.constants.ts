// Pipeline único y fijo — igual para todos los proyectos, no varía por tipo
// ni por nivel. Texto libre validado acá, no un enum de base de datos: sumar
// una etapa nueva es agregar una entrada a este array, sin migración.
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

// Semáforo por etapa: 3 estados, sin un cuarto "con problema" persistente
// (decisión explícita — un problema real se explica en observaciones).
export const ESTADOS_ETAPA = ['no_alcanzada', 'en_curso', 'completada'] as const

// Overlay a nivel proyecto, no una etapa más del pipeline.
export const ESTADOS_GENERALES_PROYECTO = ['normal', 'pausado', 'rechazado'] as const
