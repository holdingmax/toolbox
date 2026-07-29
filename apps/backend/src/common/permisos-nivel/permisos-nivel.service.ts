import { Injectable } from '@nestjs/common'
import { Nivel } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

// Única fuente de verdad de "¿qué niveles puede ver este usuario, según sus
// permisos reales?" — usada tanto por navegacion.service.ts (para armar el
// árbol de herramientas) como por cualquier otro módulo que necesite filtrar
// datos propios por la misma cascada de permisos (ej. proyectos de
// automatización), sin duplicar la regla ni depender de que el nivel tenga
// herramientas publicadas.
@Injectable()
export class PermisosNivelService {
  constructor(private prisma: PrismaService) {}

  async getVisibleNodes(usuarioId: string): Promise<Nivel[]> {
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
}
