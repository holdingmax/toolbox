import { Module } from '@nestjs/common'
import { HistorialAdminController } from './historial-admin.controller'
import { HistorialAdminService } from './historial-admin.service'

@Module({
  controllers: [HistorialAdminController],
  providers: [HistorialAdminService],
})
export class HistorialAdminModule {}
