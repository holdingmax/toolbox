import { Controller, Get, Query } from '@nestjs/common'
import { Roles } from '../../auth/decorators/roles.decorator'
import { HistorialAdminService } from './historial-admin.service'

@Roles('Administrador')
@Controller('admin/historial')
export class HistorialAdminController {
  constructor(private service: HistorialAdminService) {}

  @Get('usuarios')
  getUsuarios() {
    return this.service.getUsuarios()
  }

  @Get('herramientas')
  getHerramientas() {
    return this.service.getHerramientas()
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('usuario_id') usuario_id?: string,
    @Query('herramienta_id') herramienta_id?: string,
    @Query('nivel_id') nivel_id?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.service.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      { usuario_id, herramienta_id, nivel_id, desde, hasta },
    )
  }
}
