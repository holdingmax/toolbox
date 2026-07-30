import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class RolesAdminService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.rol.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    })
  }
}
