import { Module } from '@nestjs/common'
import { AccesosController } from './accesos.controller'
import { AccesosService } from './accesos.service'
import { RetencionAccesosService } from './retencion-accesos.service'

@Module({
  controllers: [AccesosController],
  providers: [AccesosService, RetencionAccesosService],
})
export class AccesosModule {}
