import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { Roles } from '../../auth/decorators/roles.decorator'
import { Auditable } from '../../common/decorators/auditable.decorator'
import { CreateProyectoAutomatizacionDto } from './dto/create-proyecto-automatizacion.dto'
import { UpdateProyectoAutomatizacionDto } from './dto/update-proyecto-automatizacion.dto'
import { ProyectosAutomatizacionService } from './proyectos-automatizacion.service'

@Roles('Administrador')
@Controller('admin/proyectos-automatizacion')
export class ProyectosAutomatizacionAdminController {
  constructor(private service: ProyectosAutomatizacionService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('nivel_id') nivel_id?: string,
    @Query('estado') estado?: string,
  ) {
    return this.service.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, {
      nivel_id,
      estado,
    })
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Auditable({ entidad: 'proyecto_automatizacion', modelo: 'proyectoAutomatizacion', accion: 'crear' })
  @Post()
  create(@Body() dto: CreateProyectoAutomatizacionDto) {
    return this.service.create(dto)
  }

  @Auditable({ entidad: 'proyecto_automatizacion', modelo: 'proyectoAutomatizacion', accion: 'editar' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProyectoAutomatizacionDto) {
    return this.service.update(id, dto)
  }

  // Nombrado ":id/activo" (no ":id/estado", como el resto de los módulos
  // admin) a propósito: acá "estado" ya es un campo de negocio real
  // (pendiente/iniciado/etc., editable vía el PATCH de arriba) — reusar ese
  // mismo segmento de ruta para la baja lógica sería confuso.
  @Auditable({ entidad: 'proyecto_automatizacion', modelo: 'proyectoAutomatizacion', accion: 'toggle' })
  @Patch(':id/activo')
  toggleActivo(@Param('id') id: string) {
    return this.service.toggleActivo(id)
  }
}
