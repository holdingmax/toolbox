import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from '../../prisma/prisma.service'

const TIMEOUT_MS = 5000

type EstadoServicio = 'ok' | 'error'

@Injectable()
export class HealthCheckService {
  private readonly logger = new Logger(HealthCheckService.name)

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async verificarTodas() {
    const herramientas = await this.prisma.herramienta.findMany({
      where: { activo: true },
    })

    return Promise.all(
      herramientas.map(async (h) => ({
        id: h.id,
        nombre: h.nombre,
        estado_servicio: await this.verificarUna(h.id, h.url),
      })),
    )
  }

  private async verificarUna(id: string, url: string): Promise<EstadoServicio> {
    const estado = await this.chequearUrl(url)
    await this.prisma.herramienta.update({
      where: { id },
      data: { estado_servicio: estado, ultima_verificacion: new Date() },
    })
    return estado
  }

  private async chequearUrl(url: string): Promise<EstadoServicio> {
    const conHead = await this.intentarFetch(url, 'HEAD')
    if (conHead === 'ok') return 'ok'
    return this.intentarFetch(url, 'GET')
  }

  private async intentarFetch(
    url: string,
    method: 'HEAD' | 'GET',
  ): Promise<EstadoServicio> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(url, { method, signal: controller.signal, redirect: 'follow' })
      return res.status >= 200 && res.status < 400 ? 'ok' : 'error'
    } catch (err) {
      this.logger.warn(`Health check (${method}) falló para ${url}: ${(err as Error).message}`)
      return 'error'
    } finally {
      clearTimeout(timeout)
    }
  }
}
