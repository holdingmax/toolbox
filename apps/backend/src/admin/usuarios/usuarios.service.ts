import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateUsuarioDto } from './dto/create-usuario.dto'
import { UpdateUsuarioDto } from './dto/update-usuario.dto'

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, buscar = '') {
    const skip = (page - 1) * limit
    const where = buscar
      ? {
          OR: [
            { nombre: { contains: buscar } },
            { email: { contains: buscar } },
          ],
        }
      : {}

    const [data, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        include: { rol: true },
        orderBy: { creado_en: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.usuario.count({ where }),
    ])

    return { data: data.map(this.sanitize), total, page, limit }
  }

  async findOne(id: string) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id },
      include: { rol: true },
    })
    if (!usuario) throw new NotFoundException('Usuario no encontrado')
    return this.sanitize(usuario)
  }

  async create(dto: CreateUsuarioDto) {
    const existing = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    })
    if (existing) throw new ConflictException('El email ya está registrado')

    const password_hash = await bcrypt.hash(dto.password, 10)
    const usuario = await this.prisma.usuario.create({
      data: {
        nombre: dto.nombre,
        email: dto.email,
        password_hash,
        rol_id: dto.rol_id,
      },
      include: { rol: true },
    })
    return this.sanitize(usuario)
  }

  async update(id: string, dto: UpdateUsuarioDto) {
    await this.findOne(id)

    const data: Record<string, unknown> = {}
    if (dto.nombre !== undefined) data.nombre = dto.nombre
    if (dto.email !== undefined) data.email = dto.email
    if (dto.rol_id !== undefined) data.rol_id = dto.rol_id
    if (dto.activo !== undefined) data.activo = dto.activo
    if (dto.password) data.password_hash = await bcrypt.hash(dto.password, 10)

    const updated = await this.prisma.usuario.update({
      where: { id },
      data,
      include: { rol: true },
    })
    return this.sanitize(updated)
  }

  async toggleEstado(id: string) {
    const usuario = await this.findOne(id)
    return this.update(id, { activo: !usuario.activo })
  }

  private sanitize(u: any) {
    const result = { ...u }
    delete result.password_hash
    return result
  }
}
