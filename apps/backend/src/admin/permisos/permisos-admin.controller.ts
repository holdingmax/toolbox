import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { Roles } from '../../auth/decorators/roles.decorator'
import { Auditable } from '../../common/decorators/auditable.decorator'
import { CreatePermisoDto } from './dto/create-permiso.dto'
import { PermisosAdminService } from './permisos-admin.service'

@Roles('Administrador')
@Controller('admin/permisos')
export class PermisosAdminController {
  constructor(private service: PermisosAdminService) {}

  @Get('usuarios')
  getUsuarios() {
    return this.service.getUsuarios()
  }

  @Get()
  getPermisos(@Query('usuario_id') usuarioId: string) {
    return this.service.getPermisos(usuarioId ?? '')
  }

  @Auditable({ entidad: 'permiso', modelo: 'permisoNivel', accion: 'crear' })
  @Post()
  createPermiso(@Body() dto: CreatePermisoDto) {
    return this.service.createPermiso(dto)
  }

  @Auditable({ entidad: 'permiso', modelo: 'permisoNivel', accion: 'toggle' })
  @Patch(':id')
  togglePermiso(@Param('id') id: string) {
    return this.service.togglePermiso(id)
  }
}
