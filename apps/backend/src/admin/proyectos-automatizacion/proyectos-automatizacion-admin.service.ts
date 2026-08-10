import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { PermisosNivelService } from '../../common/permisos-nivel/permisos-nivel.service'
import { CreateProyectoAutomatizacionDto } from './dto/create-proyecto-automatizacion.dto'
import { UpdateProyectoAutomatizacionDto } from './dto/update-proyecto-automatizacion.dto'
import { UpdateEtapaProyectoDto } from './dto/update-etapa-proyecto.dto'
import { ETAPAS_PIPELINE_PROYECTO } from './proyectos-automatizacion.constants'

const NIVEL_RESUMEN = { select: { id: true, nombre: true } } as const
const CON_ETAPAS = { nivel: NIVEL_RESUMEN, etapas: true } as const

// `etapa` es un string libre — un orderBy de Prisma lo ordenaría alfabético,
// no por el orden real del pipeline. Se ordena acá según
// ETAPAS_PIPELINE_PROYECTO en vez de en la query.
function ordenarEtapas<T extends { etapas: { etapa: string }[] }>(proyecto: T): T {
  proyecto.etapas.sort(
    (a, b) => ETAPAS_PIPELINE_PROYECTO.indexOf(a.etapa as never) - ETAPAS_PIPELINE_PROYECTO.indexOf(b.etapa as never),
  )
  return proyecto
}

@Injectable()
export class ProyectosAutomatizacionAdminService {
  constructor(
    private prisma: PrismaService,
    private permisosNivelService: PermisosNivelService,
  ) {}

  async findAll(
    page = 1,
    limit = 20,
    filters: { nivel_id?: string; estado_general?: string } = {},
  ) {
    const skip = (page - 1) * limit
    const where: Record<string, unknown> = {}
    if (filters.nivel_id) where.nivel_id = filters.nivel_id
    if (filters.estado_general) where.estado_general = filters.estado_general

    const [data, total] = await Promise.all([
      this.prisma.proyectoAutomatizacion.findMany({
        where,
        include: CON_ETAPAS,
        orderBy: { actualizado_en: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.proyectoAutomatizacion.count({ where }),
    ])
    return { data: data.map(ordenarEtapas), total, page, limit }
  }

  async findOne(id: string) {
    const proyecto = await this.prisma.proyectoAutomatizacion.findFirst({
      where: { id },
      include: CON_ETAPAS,
    })
    if (!proyecto) throw new NotFoundException('Proyecto de automatización no encontrado')
    return ordenarEtapas(proyecto)
  }

  async create(dto: CreateProyectoAutomatizacionDto) {
    const proyecto = await this.prisma.proyectoAutomatizacion.create({
      data: {
        titulo: dto.titulo,
        nivel_id: dto.nivel_id,
        estado_general: dto.estado_general ?? 'normal',
        fecha_inicio: dto.fecha_inicio ? new Date(dto.fecha_inicio) : undefined,
        observaciones: dto.observaciones,
        // Todo proyecto nuevo arranca en la primera etapa del pipeline —
        // el resto no alcanzadas todavía.
        etapas: {
          create: ETAPAS_PIPELINE_PROYECTO.map((etapa, i) => ({
            etapa,
            estado: i === 0 ? 'en_curso' : 'no_alcanzada',
          })),
        },
      },
      include: CON_ETAPAS,
    })
    return ordenarEtapas(proyecto)
  }

  async update(id: string, dto: UpdateProyectoAutomatizacionDto) {
    await this.findOne(id)

    const data: Record<string, unknown> = {}
    if (dto.titulo !== undefined) data.titulo = dto.titulo
    if (dto.nivel_id !== undefined) data.nivel_id = dto.nivel_id
    if (dto.estado_general !== undefined) data.estado_general = dto.estado_general
    if (dto.fecha_inicio !== undefined) data.fecha_inicio = new Date(dto.fecha_inicio)
    if (dto.observaciones !== undefined) data.observaciones = dto.observaciones
    if (dto.activo !== undefined) data.activo = dto.activo

    const proyecto = await this.prisma.proyectoAutomatizacion.update({
      where: { id },
      data,
      include: CON_ETAPAS,
    })
    return ordenarEtapas(proyecto)
  }

  async toggleActivo(id: string) {
    const proyecto = await this.findOne(id)
    return this.update(id, { activo: !proyecto.activo })
  }

  // Actualiza el semáforo de UNA etapa puntual — la vista de tabla dispara
  // esto por cada click en un círculo, no manda la grilla entera.
  async updateEtapa(proyectoId: string, etapa: string, dto: UpdateEtapaProyectoDto) {
    if (!ETAPAS_PIPELINE_PROYECTO.includes(etapa as (typeof ETAPAS_PIPELINE_PROYECTO)[number])) {
      throw new BadRequestException(`"${etapa}" no es una etapa válida del pipeline`)
    }
    await this.findOne(proyectoId)

    await this.prisma.proyectoEtapaEstado.update({
      where: { proyecto_id_etapa: { proyecto_id: proyectoId, etapa } },
      data: { estado: dto.estado },
    })

    return this.findOne(proyectoId)
  }

  // Lectura para jefes de área: filtrada automáticamente por los mismos
  // permisos reales que ya gobiernan la navegación de herramientas
  // (PermisosNivelService.getVisibleNodes) — sin la poda por herramientas de
  // navegacion.service.ts, porque un nivel puede tener un proyecto en
  // seguimiento aunque no tenga ninguna herramienta publicada todavía.
  // Administrador ve todos los proyectos activos, sin el filtro de cascada
  // -- exclusivo de esta vista, no toca navegacion.service.ts ni
  // accesos.service.ts. rol_nombre viene del JWT (mismo campo que ya usa
  // RolesGuard), no se vuelve a consultar la base.
  async findVisiblesParaUsuario(usuarioId: string, rolNombre: string) {
    if (rolNombre === 'Administrador') {
      const todos = await this.prisma.proyectoAutomatizacion.findMany({
        where: { activo: true },
        include: CON_ETAPAS,
        orderBy: { actualizado_en: 'desc' },
      })
      return todos.map(ordenarEtapas)
    }

    const visibles = await this.permisosNivelService.getVisibleNodes(usuarioId)
    if (!visibles.length) return []

    const proyectos = await this.prisma.proyectoAutomatizacion.findMany({
      where: { activo: true, nivel_id: { in: visibles.map((n) => n.id) } },
      include: CON_ETAPAS,
      orderBy: { actualizado_en: 'desc' },
    })
    return proyectos.map(ordenarEtapas)
  }
}
