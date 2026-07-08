import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Prisma } from '@prisma/client'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { PrismaService } from '../../prisma/prisma.service'
import { AUDITABLE_KEY, AuditableMeta } from '../decorators/auditable.decorator'

// Campos que nunca deben persistirse en el log de auditoría, sin importar
// si la acción es crear, editar o toggle.
const CAMPOS_SENSIBLES: Partial<Record<AuditableMeta['entidad'], string[]>> = {
  usuario: ['password_hash'],
}

// Campos que cambian en toda edición aunque no haya un cambio real (ruido).
const CAMPOS_IGNORADOS_EN_DIFF = new Set(['actualizado_en'])

type Registro = Record<string, unknown>

@Injectable()
export class AuditoriaInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditoriaInterceptor.name)

  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const meta = this.reflector.get<AuditableMeta | undefined>(AUDITABLE_KEY, context.getHandler())
    if (!meta) return next.handle()

    const request = context.switchToHttp().getRequest()
    const usuarioId: string | undefined = request.user?.sub
    const entidadIdParam: string | undefined = request.params?.[meta.paramId ?? 'id']

    let antes: Registro | null = null
    if (meta.accion !== 'crear' && entidadIdParam) {
      antes = await this.buscarPorId(meta.modelo, entidadIdParam)
    }

    return next.handle().pipe(
      tap((respuesta) => {
        this.registrar(meta, usuarioId, entidadIdParam, antes, respuesta as Registro, request).catch(
          (err) => {
            this.logger.error(
              `No se pudo guardar el registro de auditoría (${meta.entidad}/${meta.accion}): ${err.message}`,
              err.stack,
            )
          },
        )
      }),
    )
  }

  private async buscarPorId(modelo: AuditableMeta['modelo'], id: string): Promise<Registro | null> {
    const delegate = (this.prisma as unknown as Record<string, any>)[modelo]
    if (!delegate) return null
    return delegate.findUnique({ where: { id } })
  }

  private async registrar(
    meta: AuditableMeta,
    usuarioId: string | undefined,
    entidadIdParam: string | undefined,
    antes: Registro | null,
    despues: Registro | null | undefined,
    request: any,
  ): Promise<void> {
    if (!usuarioId) return

    const cambios =
      meta.accion === 'crear'
        ? this.redactar(meta.entidad, despues)
        : this.diff(meta.entidad, antes, despues)

    const entidadId = (despues?.id as string | undefined) ?? entidadIdParam ?? ''
    if (!entidadId) return

    await this.prisma.historialAdministracion.create({
      data: {
        usuario_id: usuarioId,
        accion: meta.accion,
        entidad: meta.entidad,
        entidad_id: entidadId,
        cambios: cambios
          ? (JSON.parse(JSON.stringify(cambios)) as Prisma.InputJsonValue)
          : undefined,
        ip: request.ip ?? null,
        user_agent: request.headers?.['user-agent'] ?? null,
      },
    })
  }

  private redactar(entidad: AuditableMeta['entidad'], obj: Registro | null | undefined): Registro | null {
    if (!obj) return null
    const excluir = CAMPOS_SENSIBLES[entidad] ?? []
    const copia: Registro = {}
    for (const [key, value] of Object.entries(obj)) {
      if (!excluir.includes(key)) copia[key] = value
    }
    return copia
  }

  private diff(
    entidad: AuditableMeta['entidad'],
    antes: Registro | null,
    despues: Registro | null | undefined,
  ): Record<string, { antes: unknown; despues: unknown }> | null {
    if (!antes || !despues) return null
    const excluir = new Set([...(CAMPOS_SENSIBLES[entidad] ?? []), ...CAMPOS_IGNORADOS_EN_DIFF])
    const cambios: Record<string, { antes: unknown; despues: unknown }> = {}

    // Se itera sobre las claves de "antes" (siempre un fetch plano del modelo,
    // sin relaciones incluidas) para no comparar campos de relaciones que
    // algunos services agregan al "despues" (ej. UsuariosService incluye
    // "rol") y que aparecerían como falso cambio al no existir en "antes".
    for (const key of Object.keys(antes)) {
      if (excluir.has(key)) continue
      const valorAntes = antes[key]
      const valorDespues = despues[key]
      if (JSON.stringify(valorAntes) !== JSON.stringify(valorDespues)) {
        cambios[key] = { antes: valorAntes, despues: valorDespues }
      }
    }
    return cambios
  }
}
