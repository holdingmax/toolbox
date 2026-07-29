import { Controller, Get } from '@nestjs/common'
import { CurrentUser } from '../../auth/decorators/current-user.decorator'
import { ProyectosAutomatizacionService } from './proyectos-automatizacion.service'

// Lectura para cualquier usuario autenticado (no solo Administrador) — el
// filtrado por área ya lo hace el service según los permisos reales del
// usuario, no hace falta un guard de rol acá.
@Controller('proyectos-automatizacion')
export class ProyectosAutomatizacionController {
  constructor(private service: ProyectosAutomatizacionService) {}

  @Get()
  findVisibles(@CurrentUser() user: any) {
    return this.service.findVisiblesParaUsuario(user.sub)
  }
}
