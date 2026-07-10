import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from '../prisma/prisma.service'

const RETENCION_MESES = 12

@Injectable()
export class RetencionAccesosService {
  private readonly logger = new Logger(RetencionAccesosService.name)

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_WEEK)
  async purgarAntiguos() {
    const limite = new Date()
    limite.setMonth(limite.getMonth() - RETENCION_MESES)

    const { count } = await this.prisma.historialAcceso.deleteMany({
      where: { fecha_acceso: { lt: limite } },
    })

    this.logger.log(
      `Purga de historial_accesos: ${count} fila(s) borradas (anteriores a ${limite.toISOString()})`,
    )

    return { borradas: count, limite }
  }
}
