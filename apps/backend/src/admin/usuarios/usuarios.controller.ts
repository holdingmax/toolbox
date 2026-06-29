import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { Roles } from '../../auth/decorators/roles.decorator'
import { CreateUsuarioDto } from './dto/create-usuario.dto'
import { UpdateUsuarioDto } from './dto/update-usuario.dto'
import { UsuariosService } from './usuarios.service'

@Roles('Administrador')
@Controller('admin/usuarios')
export class UsuariosController {
  constructor(private usuariosService: UsuariosService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('buscar') buscar?: string,
  ) {
    return this.usuariosService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      buscar ?? '',
    )
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usuariosService.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateUsuarioDto) {
    return this.usuariosService.create(dto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUsuarioDto) {
    return this.usuariosService.update(id, dto)
  }

  @Patch(':id/estado')
  toggleEstado(@Param('id') id: string) {
    return this.usuariosService.toggleEstado(id)
  }
}
