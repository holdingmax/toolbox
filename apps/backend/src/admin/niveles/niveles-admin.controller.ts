import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common'
import { Roles } from '../../auth/decorators/roles.decorator'
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

  @Post()
  create(@Body() dto: CreateNivelDto) {
    return this.service.create(dto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNivelDto) {
    return this.service.update(id, dto)
  }

  @Patch(':id/estado')
  toggleEstado(@Param('id') id: string) {
    return this.service.toggleEstado(id)
  }
}
