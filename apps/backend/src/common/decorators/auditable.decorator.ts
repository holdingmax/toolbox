import { SetMetadata } from '@nestjs/common'

export type EntidadAuditable = 'usuario' | 'nivel' | 'herramienta' | 'permiso' | 'publicacion' | 'proyecto_automatizacion'

export type ModeloAuditable = 'usuario' | 'nivel' | 'herramienta' | 'permisoNivel' | 'herramientaNivel' | 'proyectoAutomatizacion'

export type AccionAuditable = 'crear' | 'editar' | 'toggle'

export interface AuditableMeta {
  entidad: EntidadAuditable
  /** Nombre del delegate de Prisma (this.prisma[modelo]) usado para buscar el estado "antes". */
  modelo: ModeloAuditable
  accion: AccionAuditable
  /** Param de la ruta que identifica la entidad afectada. Default: 'id'. */
  paramId?: string
}

export const AUDITABLE_KEY = 'auditable'

export const Auditable = (meta: AuditableMeta) => SetMetadata(AUDITABLE_KEY, meta)
