import { Controller, Get } from '@nestjs/common'
import { Roles } from '../../auth/decorators/roles.decorator'
import { RolesService } from './roles.service'

@Roles('Administrador')
@Controller('admin/roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  findAll() {
    return this.rolesService.findAll()
  }
}
