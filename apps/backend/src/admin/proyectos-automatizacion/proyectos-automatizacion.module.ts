import { Module } from '@nestjs/common'
import { PermisosNivelModule } from '../../common/permisos-nivel/permisos-nivel.module'
import { ProyectosAutomatizacionAdminController } from './proyectos-automatizacion-admin.controller'
import { ProyectosAutomatizacionController } from './proyectos-automatizacion.controller'
import { ProyectosAutomatizacionService } from './proyectos-automatizacion.service'

@Module({
  imports: [PermisosNivelModule],
  controllers: [ProyectosAutomatizacionAdminController, ProyectosAutomatizacionController],
  providers: [ProyectosAutomatizacionService],
})
export class ProyectosAutomatizacionModule {}
