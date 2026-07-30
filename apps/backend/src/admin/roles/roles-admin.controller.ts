import { Controller, Get } from '@nestjs/common'
import { Roles } from '../../auth/decorators/roles.decorator'
import { RolesAdminService } from './roles-admin.service'

@Roles('Administrador')
@Controller('admin/roles')
export class RolesAdminController {
  constructor(private rolesService: RolesAdminService) {}

  @Get()
  findAll() {
    return this.rolesService.findAll()
  }
}
