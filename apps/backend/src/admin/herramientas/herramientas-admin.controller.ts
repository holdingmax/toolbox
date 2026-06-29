import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { Roles } from '../../auth/decorators/roles.decorator'
import { CreateHerramientaDto } from './dto/create-herramienta.dto'
import { CreatePublicacionDto } from './dto/create-publicacion.dto'
import { UpdateHerramientaDto } from './dto/update-herramienta.dto'
import { HerramientasAdminService } from './herramientas-admin.service'

@Roles('Administrador')
@Controller('admin/herramientas')
export class HerramientasAdminController {
  constructor(private service: HerramientasAdminService) {}

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

  @Post()
  create(@Body() dto: CreateHerramientaDto) {
    return this.service.create(dto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateHerramientaDto) {
    return this.service.update(id, dto)
  }

  @Patch(':id/estado')
  toggleEstado(@Param('id') id: string) {
    return this.service.toggleEstado(id)
  }

  @Get(':id/publicaciones')
  getPublicaciones(@Param('id') id: string) {
    return this.service.getPublicaciones(id)
  }

  @Post(':id/publicaciones')
  createPublicacion(
    @Param('id') herramientaId: string,
    @Body() dto: CreatePublicacionDto,
  ) {
    return this.service.createPublicacion(herramientaId, dto)
  }

  @Patch(':id/publicaciones/:pubId')
  togglePublicacion(@Param('pubId') pubId: string) {
    return this.service.togglePublicacion(pubId)
  }
}
