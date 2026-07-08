import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common'
import { Roles } from '../../auth/decorators/roles.decorator'
import { Auditable } from '../../common/decorators/auditable.decorator'
import { CreateNivelDto } from './dto/create-nivel.dto'
import { UpdateNivelDto } from './dto/update-nivel.dto'
import { NivelesAdminService } from './niveles-admin.service'

@Roles('Administrador')
@Controller('admin/niveles')
export class NivelesAdminController {
  constructor(private service: NivelesAdminService) {}

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Auditable({ entidad: 'nivel', modelo: 'nivel', accion: 'crear' })
  @Post()
  create(@Body() dto: CreateNivelDto) {
    return this.service.create(dto)
  }

  @Auditable({ entidad: 'nivel', modelo: 'nivel', accion: 'editar' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNivelDto) {
    return this.service.update(id, dto)
  }

  @Auditable({ entidad: 'nivel', modelo: 'nivel', accion: 'toggle' })
  @Patch(':id/estado')
  toggleEstado(@Param('id') id: string) {
    return this.service.toggleEstado(id)
  }
}
