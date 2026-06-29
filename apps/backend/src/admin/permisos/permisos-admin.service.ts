import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreatePermisoDto } from './dto/create-permiso.dto'

@Injectable()
export class PermisosAdminService {
  constructor(private prisma: PrismaService) {}

  getUsuarios() {
    return this.prisma.usuario.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: { select: { nombre: true } },
      },
      orderBy: { nombre: 'asc' },
    })
  }

  getPermisos(usuarioId: string) {
    return this.prisma.permisoNivel.findMany({
      where: { usuario_id: usuarioId },
      include: { nivel: true },
      orderBy: { nivel: { ruta: 'asc' } },
    })
  }

  async createPermiso(dto: CreatePermisoDto) {
    const existing = await this.prisma.permisoNivel.findFirst({
      where: { usuario_id: dto.usuario_id, nivel_id: dto.nivel_id },
    })
    if (existing) {
      if (!existing.activo) {
        return this.prisma.permisoNivel.update({
          where: { id: existing.id },
          data: { activo: true },
          include: { nivel: true },
        })
      }
      throw new ConflictException('El usuario ya tiene permiso sobre ese nivel')
    }
    return this.prisma.permisoNivel.create({
      data: { usuario_id: dto.usuario_id, nivel_id: dto.nivel_id },
      include: { nivel: true },
    })
  }

  async togglePermiso(id: string) {
    const permiso = await this.prisma.permisoNivel.findFirst({ where: { id } })
    if (!permiso) throw new NotFoundException('Permiso no encontrado')
    return this.prisma.permisoNivel.update({
      where: { id },
      data: { activo: !permiso.activo },
      include: { nivel: true },
    })
  }
}
