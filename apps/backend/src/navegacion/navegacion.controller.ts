import { Controller, Get, Param } from '@nestjs/common'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { NavegacionService } from './navegacion.service'

@Controller('navegacion')
export class NavegacionController {
  constructor(private navegacionService: NavegacionService) {}

  @Get()
  getRootNodes(@CurrentUser() user: any) {
    return this.navegacionService.getRootNodes(user.sub)
  }

  @Get(':id')
  getNivelDetalle(@Param('id') id: string, @CurrentUser() user: any) {
    return this.navegacionService.getNivelDetalle(id, user.sub)
  }
}
