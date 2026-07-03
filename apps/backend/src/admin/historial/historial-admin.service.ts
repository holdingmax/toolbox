import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class HistorialAdminService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    page = 1,
    limit = 20,
    filters: {
      usuario_id?: string
      herramienta_id?: string
      nivel_id?: string
      desde?: string
      hasta?: string
    } = {},
  ) {
    const skip = (page - 1) * limit
    const where: Record<string, unknown> = {}

    if (filters.usuario_id) where.usuario_id = filters.usuario_id

    if (filters.nivel_id) {
      let herramientaIds = await this.getHerramientaIdsDelSubarbol(filters.nivel_id)
      if (filters.herramienta_id) {
        herramientaIds = herramientaIds.filter((id) => id === filters.herramienta_id)
      }
      where.herramienta_id = { in: herramientaIds }
    } else if (filters.herramienta_id) {
      where.herramienta_id = filters.herramienta_id
    }

    if (filters.desde || filters.hasta) {
      const fechaFiltro: Record<string, Date> = {}
      if (filters.desde) fechaFiltro.gte = new Date(filters.desde)
      if (filters.hasta) fechaFiltro.lte = new Date(filters.hasta)
      where.fecha_acceso = fechaFiltro
    }

    const [data, total] = await Promise.all([
      this.prisma.historialAcceso.findMany({
        where,
        include: {
          usuario: { select: { id: true, nombre: true, email: true } },
          herramienta: { select: { id: true, nombre: true } },
        },
        orderBy: { fecha_acceso: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.historialAcceso.count({ where }),
    ])
    return { data, total, page, limit }
  }

  getUsuarios() {
    return this.prisma.usuario.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    })
  }

  getHerramientas() {
    return this.prisma.herramienta.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    })
  }

  private async getHerramientaIdsDelSubarbol(nivelId: string): Promise<string[]> {
    const nivel = await this.prisma.nivel.findFirst({ where: { id: nivelId } })
    if (!nivel) return []

    const subarbol = await this.prisma.nivel.findMany({
      where: { ruta: { startsWith: nivel.ruta } },
      select: { id: true },
    })

    const publicaciones = await this.prisma.herramientaNivel.findMany({
      where: { activo: true, nivel_id: { in: subarbol.map((n) => n.id) } },
      select: { herramienta_id: true },
    })

    return [...new Set(publicaciones.map((p) => p.herramienta_id))]
  }
}
