import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PrismaService } from '../../prisma/prisma.service'
import { SKIP_PASSWORD_CHECK_KEY } from '../decorators/skip-password-check.decorator'

@Injectable()
export class MustChangePasswordGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_PASSWORD_CHECK_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (skip) return true

    const { user } = context.switchToHttp().getRequest()
    if (!user) return true // ruta pública (@Public()) — no aplica, no hay usuario autenticado

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: user.sub },
      select: { debe_cambiar_password: true },
    })

    if (!usuario) {
      // No debería poder pasar nunca en operación normal (nunca hay borrado
      // físico) — pero si el usuario del token no existe más (restauración
      // desde un backup más viejo, mezcla de entornos), fail closed en vez
      // de dejar pasar sin poder confirmar nada.
      throw new ForbiddenException('No se pudo verificar tu usuario')
    }

    if (usuario.debe_cambiar_password) {
      throw new ForbiddenException('Debés cambiar tu contraseña temporal antes de continuar')
    }

    return true
  }
}
