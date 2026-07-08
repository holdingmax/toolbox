import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'
import { MailService } from '../common/mail/mail.service'
import { PrismaService } from '../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'

const RESET_TOKEN_VIGENCIA_MS = 60 * 60 * 1000 // 1 hora

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
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

  async forgotPassword(email: string): Promise<{ ok: true }> {
    const usuario = await this.prisma.usuario.findUnique({ where: { email } })

    if (usuario && usuario.activo) {
      const tokenCrudo = crypto.randomBytes(32).toString('hex')
      const tokenHash = crypto.createHash('sha256').update(tokenCrudo).digest('hex')
      const expira = new Date(Date.now() + RESET_TOKEN_VIGENCIA_MS)

      await this.prisma.usuario.update({
        where: { id: usuario.id },
        data: { reset_token: tokenHash, reset_token_expira: expira },
      })

      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'
      const resetUrl = `${frontendUrl}/reset-password?token=${tokenCrudo}`

      try {
        await this.mailService.enviarResetPassword(usuario.email, resetUrl)
      } catch (err) {
        // Nunca se revela al llamador si el envío falló — solo queda en el log del servidor.
        this.logger.error(
          `No se pudo enviar el email de reset para el usuario ${usuario.id}: ${(err as Error).message}`,
        )
      }
    }

    // Misma respuesta exista o no el email, para no revelar si está registrado.
    return { ok: true }
  }

  async resetPassword(token: string, nuevaContraseña: string): Promise<{ ok: true }> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const usuario = await this.prisma.usuario.findFirst({
      where: { reset_token: tokenHash },
    })

    if (!usuario || !usuario.reset_token_expira || usuario.reset_token_expira < new Date()) {
      throw new UnauthorizedException('Token inválido o expirado')
    }

    const hash = await bcrypt.hash(nuevaContraseña, 10)
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { password_hash: hash, reset_token: null, reset_token_expira: null },
    })

    return { ok: true }
  }
}
