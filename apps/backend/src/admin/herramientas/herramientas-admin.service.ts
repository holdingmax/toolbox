import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateHerramientaDto } from './dto/create-herramienta.dto'
import { CreatePublicacionDto } from './dto/create-publicacion.dto'
import { UpdateHerramientaDto } from './dto/update-herramienta.dto'

@Injectable()
export class HerramientasAdminService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, buscar = '') {
    const skip = (page - 1) * limit
    const where = buscar
      ? {
          OR: [
            { nombre: { contains: buscar } },
            { url: { contains: buscar } },
          ],
        }
      : {}

    const [data, total] = await Promise.all([
      this.prisma.herramienta.findMany({
        where,
        orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.herramienta.count({ where }),
    ])
    return { data, total, page, limit }
  }

  async findOne(id: string) {
    const h = await this.prisma.herramienta.findFirst({ where: { id } })
    if (!h) throw new NotFoundException('Herramienta no encontrada')
    return h
  }

  async create(dto: CreateHerramientaDto) {
    return this.prisma.herramienta.create({
      data: {
        nombre: dto.nombre,
        url: dto.url,
        descripcion: dto.descripcion ?? null,
        icono_url: dto.icono_url ?? null,
        soporte: dto.soporte ?? null,
        orden: dto.orden ?? 0,
      },
    })
  }

  async update(id: string, dto: UpdateHerramientaDto) {
    await this.findOne(id)
    const data: Record<string, unknown> = {}
    if (dto.nombre !== undefined) data.nombre = dto.nombre
    if (dto.url !== undefined) data.url = dto.url
    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion
    if (dto.icono_url !== undefined) data.icono_url = dto.icono_url
    if (dto.soporte !== undefined) data.soporte = dto.soporte
    if (dto.orden !== undefined) data.orden = dto.orden
    if (dto.activo !== undefined) data.activo = dto.activo

    return this.prisma.herramienta.update({ where: { id }, data })
  }

  async toggleEstado(id: string) {
    const h = await this.findOne(id)
    return this.prisma.herramienta.update({
      where: { id },
      data: { activo: !h.activo },
    })
  }

  async getPublicaciones(herramientaId: string) {
    await this.findOne(herramientaId)
    return this.prisma.herramientaNivel.findMany({
      where: { herramienta_id: herramientaId },
      include: { nivel: true },
      orderBy: { nivel: { ruta: 'asc' } },
    })
  }

  async createPublicacion(herramientaId: string, dto: CreatePublicacionDto) {
    await this.findOne(herramientaId)
    const nivel = await this.prisma.nivel.findFirst({
      where: { id: dto.nivel_id },
    })
    if (!nivel) throw new NotFoundException('Nivel no encontrado')

    const existing = await this.prisma.herramientaNivel.findFirst({
      where: { herramienta_id: herramientaId, nivel_id: dto.nivel_id },
    })
    if (existing) {
      if (!existing.activo) {
        return this.prisma.herramientaNivel.update({
          where: { id: existing.id },
          data: { activo: true },
          include: { nivel: true },
        })
      }
      throw new ConflictException('La herramienta ya está publicada en ese nivel')
    }

    return this.prisma.herramientaNivel.create({
      data: { herramienta_id: herramientaId, nivel_id: dto.nivel_id },
      include: { nivel: true },
    })
  }

  async togglePublicacion(pubId: string) {
    const pub = await this.prisma.herramientaNivel.findFirst({
      where: { id: pubId },
    })
    if (!pub) throw new NotFoundException('Publicación no encontrada')
    return this.prisma.herramientaNivel.update({
      where: { id: pubId },
      data: { activo: !pub.activo },
      include: { nivel: true },
    })
  }
}
