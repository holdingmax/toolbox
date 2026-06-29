import { Module } from '@nestjs/common'
import { NavegacionController } from './navegacion.controller'
import { NavegacionService } from './navegacion.service'

@Module({
  controllers: [NavegacionController],
  providers: [NavegacionService],
})
export class NavegacionModule {}
