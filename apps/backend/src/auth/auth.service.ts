import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
      include: { rol: true },
    })

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Credenciales inválidas')
    }

    const passwordValida = await bcrypt.compare(dto.password, usuario.password_hash)
    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales inválidas')
    }

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol_id: usuario.rol_id,
      rol_nombre: usuario.rol.nombre,
    }

    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    }
  }

  async changePassword(
    userId: string,
    contraseñaActual: string,
    nuevaContraseña: string,
  ) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: userId } })
    if (!usuario) throw new NotFoundException('Usuario no encontrado')

    const valid = await bcrypt.compare(contraseñaActual, usuario.password_hash)
    if (!valid) throw new UnauthorizedException('La contraseña actual es incorrecta')

    const hash = await bcrypt.hash(nuevaContraseña, 10)
    await this.prisma.usuario.update({
      where: { id: userId },
      data: { password_hash: hash },
    })

    return { ok: true }
  }
}
