import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { Roles } from '../../auth/decorators/roles.decorator'
import { Auditable } from '../../common/decorators/auditable.decorator'
import { CreateHerramientaDto } from './dto/create-herramienta.dto'
import { CreatePublicacionDto } from './dto/create-publicacion.dto'
import { UpdateHerramientaDto } from './dto/update-herramienta.dto'
import { HealthCheckService } from './health-check.service'
import { HerramientasAdminService } from './herramientas-admin.service'

@Roles('Administrador')
@Controller('admin/herramientas')
export class HerramientasAdminController {
  constructor(
    private service: HerramientasAdminService,
    private healthCheckService: HealthCheckService,
  ) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('buscar') buscar?: string,
  ) {
    return this.service.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      buscar ?? '',
    )
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Auditable({ entidad: 'herramienta', modelo: 'herramienta', accion: 'crear' })
  @Post()
  create(@Body() dto: CreateHerramientaDto) {
    return this.service.create(dto)
  }

  @Auditable({ entidad: 'herramienta', modelo: 'herramienta', accion: 'editar' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateHerramientaDto) {
    return this.service.update(id, dto)
  }

  @Auditable({ entidad: 'herramienta', modelo: 'herramienta', accion: 'toggle' })
  @Patch(':id/estado')
  toggleEstado(@Param('id') id: string) {
    return this.service.toggleEstado(id)
  }

  @Post('verificar-salud')
  verificarSalud() {
    return this.healthCheckService.verificarTodas()
  }

  @Get(':id/publicaciones')
  getPublicaciones(@Param('id') id: string) {
    return this.service.getPublicaciones(id)
  }

  @Auditable({ entidad: 'publicacion', modelo: 'herramientaNivel', accion: 'crear' })
  @Post(':id/publicaciones')
  createPublicacion(
    @Param('id') herramientaId: string,
    @Body() dto: CreatePublicacionDto,
  ) {
    return this.service.createPublicacion(herramientaId, dto)
  }

  @Auditable({ entidad: 'publicacion', modelo: 'herramientaNivel', accion: 'toggle', paramId: 'pubId' })
  @Patch(':id/publicaciones/:pubId')
  togglePublicacion(@Param('pubId') pubId: string) {
    return this.service.togglePublicacion(pubId)
  }
}
