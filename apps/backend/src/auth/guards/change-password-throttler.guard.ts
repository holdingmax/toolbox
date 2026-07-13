import { Injectable } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'

@Injectable()
export class ChangePasswordThrottlerGuard extends ThrottlerGuard {
  protected async getErrorMessage(): Promise<string> {
    return 'Demasiados intentos, esperá un minuto e intentá de nuevo'
  }

  // Trackea por usuario (no por IP): acá el request ya está autenticado, y
  // así cada cuenta tiene su propio cupo sin depender de si varios usuarios
  // comparten IP, ni permitir que rotar de IP resetee el contador.
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.user?.sub ?? req.ip
  }
}
