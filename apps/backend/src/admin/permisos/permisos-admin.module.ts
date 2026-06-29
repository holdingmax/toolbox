import { Module } from '@nestjs/common'
import { PermisosAdminController } from './permisos-admin.controller'
import { PermisosAdminService } from './permisos-admin.service'

@Module({
  controllers: [PermisosAdminController],
  providers: [PermisosAdminService],
})
export class PermisosAdminModule {}
