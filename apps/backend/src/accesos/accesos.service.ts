import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AccesosService {
  constructor(private prisma: PrismaService) {}

  async registrar(
    usuarioId: string,
    herramientaId: string,
    ip: string | null,
    userAgent: string | null,
  ) {
    const herramienta = await this.prisma.herramienta.findFirst({
      where: { id: herramientaId, activo: true },
    })
    if (!herramienta) throw new NotFoundException('Herramienta no encontrada')

    const tieneAcceso = await this.verificarAccesoHerramienta(
      usuarioId,
      herramientaId,
    )
    if (!tieneAcceso) throw new ForbiddenException()

    await this.prisma.historialAcceso.create({
      data: {
        usuario_id: usuarioId,
        herramienta_id: herramientaId,
        ip,
        user_agent: userAgent,
      },
    })

    return { url: herramienta.url }
  }

  async getHistorialReciente(usuarioId: string, limit: number) {
    const accesos = await this.prisma.historialAcceso.findMany({
      where: { usuario_id: usuarioId },
      include: {
        herramienta: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            url: true,
            icono_url: true,
          },
        },
      },
      orderBy: { fecha_acceso: 'desc' },
      take: limit * 10,
    })

    const seen = new Set<string>()
    const unique: typeof accesos = []
    for (const a of accesos) {
      if (!seen.has(a.herramienta_id)) {
        seen.add(a.herramienta_id)
        unique.push(a)
        if (unique.length === limit) break
      }
    }

    return unique.map((a) => ({
      herramienta: a.herramienta,
      ultima_vez: a.fecha_acceso,
    }))
  }

  async getHerramientasDisponibles(usuarioId: string) {
    const permisos = await this.prisma.permisoNivel.findMany({
      where: { usuario_id: usuarioId, activo: true },
      include: { nivel: { select: { ruta: true } } },
    })

    if (!permisos.length) return { total: 0, herramientas: [] }

    const conditions = permisos.map((p) => ({
      ruta: { startsWith: p.nivel.ruta },
    }))

    const publicaciones = await this.prisma.herramientaNivel.findMany({
      where: {
        activo: true,
        nivel: { activo: true, OR: conditions },
      },
      include: {
        herramienta: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            url: true,
            icono_url: true,
            orden: true,
            activo: true,
          },
        },
      },
    })

    const seen = new Set<string>()
    const herramientas: {
      id: string
      nombre: string
      descripcion: string | null
      url: string
      icono_url: string | null
      orden: number
    }[] = []

    for (const pub of publicaciones) {
      if (!pub.herramienta.activo || seen.has(pub.herramienta_id)) continue
      seen.add(pub.herramienta_id)
      herramientas.push({
        id: pub.herramienta.id,
        nombre: pub.herramienta.nombre,
        descripcion: pub.herramienta.descripcion,
        url: pub.herramienta.url,
        icono_url: pub.herramienta.icono_url,
        orden: pub.herramienta.orden,
      })
    }

    herramientas.sort((a, b) => a.orden - b.orden)
    return { total: herramientas.length, herramientas }
  }

  private async verificarAccesoHerramienta(
    usuarioId: string,
    herramientaId: string,
  ): Promise<boolean> {
    // La herramienta debe estar publicada en al menos un nivel al que el usuario tiene acceso
    const publicaciones = await this.prisma.herramientaNivel.findMany({
      where: { herramienta_id: herramientaId, activo: true },
      include: { nivel: { select: { ruta: true } } },
    })
    if (!publicaciones.length) return false

    const permisos = await this.prisma.permisoNivel.findMany({
      where: { usuario_id: usuarioId, activo: true },
      include: { nivel: { select: { ruta: true } } },
    })
    if (!permisos.length) return false

    return publicaciones.some((pub) =>
      permisos.some((perm) => pub.nivel.ruta.startsWith(perm.nivel.ruta)),
    )
  }
}
