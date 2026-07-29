import { Module } from '@nestjs/common'
import { PermisosNivelModule } from '../common/permisos-nivel/permisos-nivel.module'
import { NavegacionController } from './navegacion.controller'
import { NavegacionService } from './navegacion.service'

@Module({
  imports: [PermisosNivelModule],
  controllers: [NavegacionController],
  providers: [NavegacionService],
})
export class NavegacionModule {}
