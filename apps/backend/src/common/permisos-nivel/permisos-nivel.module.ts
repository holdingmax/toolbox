import { Module } from '@nestjs/common'
import { PermisosNivelService } from './permisos-nivel.service'

@Module({
  providers: [PermisosNivelService],
  exports: [PermisosNivelService],
})
export class PermisosNivelModule {}
