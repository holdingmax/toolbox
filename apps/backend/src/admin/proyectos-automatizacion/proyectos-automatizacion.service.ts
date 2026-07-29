import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { PermisosNivelService } from '../../common/permisos-nivel/permisos-nivel.service'
import { CreateProyectoAutomatizacionDto } from './dto/create-proyecto-automatizacion.dto'
import { UpdateProyectoAutomatizacionDto } from './dto/update-proyecto-automatizacion.dto'

const NIVEL_RESUMEN = { select: { id: true, nombre: true } } as const

@Injectable()
export class ProyectosAutomatizacionService {
  constructor(
    private prisma: PrismaService,
    private permisosNivelService: PermisosNivelService,
  ) {}

  async findAll(
    page = 1,
    limit = 20,
    filters: { nivel_id?: string; estado?: string } = {},
  ) {
    const skip = (page - 1) * limit
    const where: Record<string, unknown> = {}
    if (filters.nivel_id) where.nivel_id = filters.nivel_id
    if (filters.estado) where.estado = filters.estado

    const [data, total] = await Promise.all([
      this.prisma.proyectoAutomatizacion.findMany({
        where,
        include: { nivel: NIVEL_RESUMEN },
        orderBy: { actualizado_en: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.proyectoAutomatizacion.count({ where }),
    ])
    return { data, total, page, limit }
  }

  async findOne(id: string) {
    const proyecto = await this.prisma.proyectoAutomatizacion.findFirst({
      where: { id },
      include: { nivel: NIVEL_RESUMEN },
    })
    if (!proyecto) throw new NotFoundException('Proyecto de automatización no encontrado')
    return proyecto
  }

  create(dto: CreateProyectoAutomatizacionDto) {
    return this.prisma.proyectoAutomatizacion.create({
      data: {
        titulo: dto.titulo,
        nivel_id: dto.nivel_id,
        estado: dto.estado ?? 'pendiente',
        fecha_inicio: dto.fecha_inicio ? new Date(dto.fecha_inicio) : undefined,
        notas: dto.notas,
      },
      include: { nivel: NIVEL_RESUMEN },
    })
  }

  async update(id: string, dto: UpdateProyectoAutomatizacionDto) {
    await this.findOne(id)

    const data: Record<string, unknown> = {}
    if (dto.titulo !== undefined) data.titulo = dto.titulo
    if (dto.nivel_id !== undefined) data.nivel_id = dto.nivel_id
    if (dto.estado !== undefined) data.estado = dto.estado
    if (dto.fecha_inicio !== undefined) data.fecha_inicio = new Date(dto.fecha_inicio)
    if (dto.notas !== undefined) data.notas = dto.notas
    if (dto.activo !== undefined) data.activo = dto.activo

    return this.prisma.proyectoAutomatizacion.update({
      where: { id },
      data,
      include: { nivel: NIVEL_RESUMEN },
    })
  }

  async toggleActivo(id: string) {
    const proyecto = await this.findOne(id)
    return this.update(id, { activo: !proyecto.activo })
  }

  // Lectura para jefes de área: filtrada automáticamente por los mismos
  // permisos reales que ya gobiernan la navegación de herramientas
  // (PermisosNivelService.getVisibleNodes) — sin la poda por herramientas de
  // navegacion.service.ts, porque un nivel puede tener un proyecto en
  // seguimiento aunque no tenga ninguna herramienta publicada todavía.
  async findVisiblesParaUsuario(usuarioId: string) {
    const visibles = await this.permisosNivelService.getVisibleNodes(usuarioId)
    if (!visibles.length) return []

    return this.prisma.proyectoAutomatizacion.findMany({
      where: { activo: true, nivel_id: { in: visibles.map((n) => n.id) } },
      include: { nivel: NIVEL_RESUMEN },
      orderBy: { actualizado_en: 'desc' },
    })
  }
}
