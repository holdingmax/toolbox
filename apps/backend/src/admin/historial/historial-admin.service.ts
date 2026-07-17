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

  async findAllAdministracion(
    page = 1,
    limit = 20,
    filters: {
      usuario_id?: string
      entidad?: string
      accion?: string
      desde?: string
      hasta?: string
    } = {},
  ) {
    const skip = (page - 1) * limit
    const where: Record<string, unknown> = {}

    if (filters.usuario_id) where.usuario_id = filters.usuario_id
    if (filters.entidad) where.entidad = filters.entidad
    if (filters.accion) where.accion = filters.accion

    if (filters.desde || filters.hasta) {
      const fechaFiltro: Record<string, Date> = {}
      if (filters.desde) fechaFiltro.gte = new Date(filters.desde)
      if (filters.hasta) fechaFiltro.lte = new Date(filters.hasta)
      where.fecha = fechaFiltro
    }

    const [data, total] = await Promise.all([
      this.prisma.historialAdministracion.findMany({
        where,
        include: { usuario: { select: { id: true, nombre: true, email: true } } },
        orderBy: { fecha: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.historialAdministracion.count({ where }),
    ])

    const nombres = await this.resolverEntidadNombres(data)
    const dataConNombre = data.map((item) => ({
      ...item,
      entidad_nombre: nombres.get(`${item.entidad}:${item.entidad_id}`) ?? null,
    }))

    return { data: dataConNombre, total, page, limit }
  }

  // Resuelve el nombre legible de la entidad polimórfica (entidad_id no tiene
  // FK real: apunta a usuario/nivel/herramienta/permisoNivel/herramientaNivel
  // según el valor de "entidad"). Agrupa por tipo para hacer como máximo 5
  // queries batched en vez de una por fila.
  private async resolverEntidadNombres(
    items: { entidad: string; entidad_id: string }[],
  ): Promise<Map<string, string>> {
    const mapa = new Map<string, string>()
    const idsPorEntidad = new Map<string, Set<string>>()
    for (const item of items) {
      if (!idsPorEntidad.has(item.entidad)) idsPorEntidad.set(item.entidad, new Set())
      idsPorEntidad.get(item.entidad)!.add(item.entidad_id)
    }

    for (const [entidad, idsSet] of idsPorEntidad) {
      const ids = [...idsSet]
      if (entidad === 'usuario') {
        const rows = await this.prisma.usuario.findMany({
          where: { id: { in: ids } },
          select: { id: true, nombre: true },
        })
        for (const r of rows) mapa.set(`usuario:${r.id}`, r.nombre)
      } else if (entidad === 'nivel') {
        const rows = await this.prisma.nivel.findMany({
          where: { id: { in: ids } },
          select: { id: true, nombre: true },
        })
        for (const r of rows) mapa.set(`nivel:${r.id}`, r.nombre)
      } else if (entidad === 'herramienta') {
        const rows = await this.prisma.herramienta.findMany({
          where: { id: { in: ids } },
          select: { id: true, nombre: true },
        })
        for (const r of rows) mapa.set(`herramienta:${r.id}`, r.nombre)
      } else if (entidad === 'permiso') {
        const rows = await this.prisma.permisoNivel.findMany({
          where: { id: { in: ids } },
          include: { usuario: { select: { nombre: true } }, nivel: { select: { nombre: true } } },
        })
        for (const r of rows) mapa.set(`permiso:${r.id}`, `${r.usuario.nombre} → ${r.nivel.nombre}`)
      } else if (entidad === 'publicacion') {
        const rows = await this.prisma.herramientaNivel.findMany({
          where: { id: { in: ids } },
          include: { herramienta: { select: { nombre: true } }, nivel: { select: { nombre: true } } },
        })
        for (const r of rows) mapa.set(`publicacion:${r.id}`, `${r.herramienta.nombre} → ${r.nivel.nombre}`)
      }
    }

    return mapa
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
