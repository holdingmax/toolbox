import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Nivel } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class NavegacionService {
  constructor(private prisma: PrismaService) {}

  async getRootNodes(usuarioId: string) {
    const visibles = await this.getVisibleNodes(usuarioId)
    if (!visibles.length) return []

    const podados = await this.pruneEmptyBranches(visibles)
    const visiblesIds = new Set(podados.map((n) => n.id))

    return podados
      .filter((n) => !n.parent_id || !visiblesIds.has(n.parent_id))
      .map((n) => ({
        ...this.toResumen(n),
        tiene_hijos: podados.some((h) => h.parent_id === n.id),
      }))
      .sort((a, b) => a.orden - b.orden)
  }

  async getNivelDetalle(nivelId: string, usuarioId: string) {
    const nivel = await this.prisma.nivel.findFirst({
      where: { id: nivelId, activo: true },
    })
    if (!nivel) throw new NotFoundException('Nivel no encontrado')

    const tieneAcceso = await this.verificarAcceso(usuarioId, nivel.ruta)
    if (!tieneAcceso) throw new ForbiddenException()

    const visibles = await this.getVisibleNodes(usuarioId)
    const podados = await this.pruneEmptyBranches(visibles)

    const hijos = podados
      .filter((n) => n.parent_id === nivelId)
      .map((n) => ({
        ...this.toResumen(n),
        tiene_hijos: podados.some((h) => h.parent_id === n.id),
      }))
      .sort((a, b) => a.orden - b.orden)

    const herramientasNiveles = await this.prisma.herramientaNivel.findMany({
      where: { nivel_id: nivelId, activo: true },
      include: { herramienta: true },
      orderBy: { herramienta: { orden: 'asc' } },
    })

    const herramientas = herramientasNiveles
      .filter((hn) => hn.herramienta.activo)
      .map((hn) => ({
        id: hn.herramienta.id,
        nombre: hn.herramienta.nombre,
        descripcion: hn.herramienta.descripcion,
        url: hn.herramienta.url,
        icono_url: hn.herramienta.icono_url,
        orden: hn.herramienta.orden,
      }))

    const breadcrumb = await this.buildBreadcrumb(nivel.ruta)

    return { nivel, hijos, herramientas, breadcrumb }
  }

  // --- private helpers ---

  private async getVisibleNodes(usuarioId: string): Promise<Nivel[]> {
    const permisos = await this.prisma.permisoNivel.findMany({
      where: { usuario_id: usuarioId, activo: true },
      include: { nivel: true },
    })
    if (!permisos.length) return []

    const conditions = permisos.map((p) => ({
      ruta: { startsWith: p.nivel.ruta },
    }))

    return this.prisma.nivel.findMany({
      where: { activo: true, OR: conditions },
      orderBy: { orden: 'asc' },
    })
  }

  private async pruneEmptyBranches(niveles: Nivel[]): Promise<Nivel[]> {
    if (!niveles.length) return []

    const nivelIds = niveles.map((n) => n.id)

    const conHerramientas = await this.prisma.herramientaNivel.findMany({
      where: { activo: true, nivel_id: { in: nivelIds } },
      include: {
        nivel: { select: { ruta: true } },
        herramienta: { select: { activo: true } },
      },
    })

    const rutasConTool = conHerramientas
      .filter((h) => h.herramienta.activo)
      .map((h) => h.nivel.ruta)

    if (!rutasConTool.length) return []

    // Un nivel es visible si alguna herramienta activa está en él o en un descendiente
    return niveles.filter((nivel) =>
      rutasConTool.some((ruta) => ruta.startsWith(nivel.ruta)),
    )
  }

  private async verificarAcceso(
    usuarioId: string,
    rutaNivel: string,
  ): Promise<boolean> {
    const permisos = await this.prisma.permisoNivel.findMany({
      where: { usuario_id: usuarioId, activo: true },
      include: { nivel: { select: { ruta: true } } },
    })
    return permisos.some((p) => rutaNivel.startsWith(p.nivel.ruta))
  }

  private async buildBreadcrumb(ruta: string) {
    const ids = ruta.split('/').filter(Boolean)
    if (!ids.length) return []

    const niveles = await this.prisma.nivel.findMany({
      where: { id: { in: ids } },
      select: { id: true, nombre: true },
    })

    return ids
      .map((id) => niveles.find((n) => n.id === id))
      .filter((n): n is { id: string; nombre: string } => Boolean(n))
  }

  private toResumen(n: Nivel) {
    return {
      id: n.id,
      nombre: n.nombre,
      descripcion: n.descripcion,
      tipo: n.tipo,
      icono_url: n.icono_url,
      color_fondo: n.color_fondo,
      orden: n.orden,
      parent_id: n.parent_id,
      ruta: n.ruta,
    }
  }
}
