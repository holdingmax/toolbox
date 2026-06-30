import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateNivelDto } from './dto/create-nivel.dto'
import { UpdateNivelDto } from './dto/update-nivel.dto'

@Injectable()
export class NivelesAdminService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.nivel.findMany({ orderBy: { ruta: 'asc' } })
  }

  async findOne(id: string) {
    const nivel = await this.prisma.nivel.findFirst({ where: { id } })
    if (!nivel) throw new NotFoundException('Nivel no encontrado')
    return nivel
  }

  async create(dto: CreateNivelDto) {
    return this.prisma.$transaction(async (tx) => {
      let rutaBase = '/'
      if (dto.parent_id) {
        const parent = await tx.nivel.findFirst({ where: { id: dto.parent_id } })
        if (!parent) throw new NotFoundException('Nivel padre no encontrado')
        rutaBase = parent.ruta
      }

      // Create first to get the generated ID
      const created = await tx.nivel.create({
        data: {
          nombre: dto.nombre,
          tipo: dto.tipo,
          descripcion: dto.descripcion ?? null,
          parent_id: dto.parent_id ?? null,
          ruta: `__temp_${Date.now()}/`,
          orden: dto.orden ?? 0,
          icono_url: dto.icono_url ?? null,
          color_fondo: dto.color_fondo ?? null,
        },
      })

      return tx.nivel.update({
        where: { id: created.id },
        data: { ruta: `${rutaBase}${created.id}/` },
      })
    })
  }

  async update(id: string, dto: UpdateNivelDto) {
    const nivel = await this.findOne(id)
    const oldRuta = nivel.ruta

    return this.prisma.$transaction(async (tx) => {
      const data: Record<string, unknown> = {}
      if (dto.nombre !== undefined) data.nombre = dto.nombre
      if (dto.tipo !== undefined) data.tipo = dto.tipo
      if (dto.descripcion !== undefined) data.descripcion = dto.descripcion
      if (dto.orden !== undefined) data.orden = dto.orden
      if (dto.icono_url !== undefined) data.icono_url = dto.icono_url
      if (dto.color_fondo !== undefined) data.color_fondo = dto.color_fondo
      if (dto.activo !== undefined) data.activo = dto.activo

      if (dto.parent_id !== undefined) {
        let rutaBase = '/'
        if (dto.parent_id) {
          const parent = await tx.nivel.findFirst({ where: { id: dto.parent_id } })
          if (!parent) throw new NotFoundException('Nivel padre no encontrado')
          if (parent.ruta.startsWith(oldRuta)) {
            throw new ConflictException(
              'No se puede mover un nivel dentro de sí mismo',
            )
          }
          rutaBase = parent.ruta
        }
        data.parent_id = dto.parent_id || null
        const newRuta = `${rutaBase}${id}/`
        data.ruta = newRuta

        // Recalculate ruta for all descendants
        const descendants = await tx.nivel.findMany({
          where: { ruta: { startsWith: oldRuta } },
        })
        for (const d of descendants) {
          if (d.id === id) continue
          await tx.nivel.update({
            where: { id: d.id },
            data: { ruta: newRuta + d.ruta.slice(oldRuta.length) },
          })
        }
      }

      return tx.nivel.update({ where: { id }, data })
    })
  }

  async toggleEstado(id: string) {
    const nivel = await this.findOne(id)
    return this.prisma.nivel.update({
      where: { id },
      data: { activo: !nivel.activo },
    })
  }
}
