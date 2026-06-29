import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common'
import type { Request } from 'express'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { AccesosService } from './accesos.service'
import { RegistrarAccesoDto } from './dto/registrar-acceso.dto'

@Controller('accesos')
export class AccesosController {
  constructor(private accesosService: AccesosService) {}

  @Get('historial')
  getHistorial(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
  ) {
    return this.accesosService.getHistorialReciente(user.sub, limit ? +limit : 4)
  }

  @Get('herramientas')
  getHerramientas(@CurrentUser() user: any) {
    return this.accesosService.getHerramientasDisponibles(user.sub)
  }

  @Post()
  registrar(
    @Body() dto: RegistrarAccesoDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ip = req.ip ?? null
    const userAgent = req.headers['user-agent'] ?? null
    return this.accesosService.registrar(
      user.sub,
      dto.herramienta_id,
      ip,
      userAgent,
    )
  }
}
