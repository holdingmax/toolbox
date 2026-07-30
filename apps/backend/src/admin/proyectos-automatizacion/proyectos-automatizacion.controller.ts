import { Controller, Get } from '@nestjs/common'
import { CurrentUser } from '../../auth/decorators/current-user.decorator'
import { ProyectosAutomatizacionAdminService } from './proyectos-automatizacion-admin.service'

// Lectura para cualquier usuario autenticado (no solo Administrador) — el
// filtrado por área ya lo hace el service según los permisos reales del
// usuario, no hace falta un guard de rol acá. Deliberadamente sin sufijo
// "-admin" en el nombre de archivo/clase, a diferencia del resto de este
// módulo: este controller no tiene ninguna restricción de rol.
@Controller('proyectos-automatizacion')
export class ProyectosAutomatizacionController {
  constructor(private service: ProyectosAutomatizacionAdminService) {}

  @Get()
  findVisibles(@CurrentUser() user: any) {
    return this.service.findVisiblesParaUsuario(user.sub)
  }
}
