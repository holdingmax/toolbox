import { Module } from '@nestjs/common'
import { HerramientasAdminController } from './herramientas-admin.controller'
import { HerramientasAdminService } from './herramientas-admin.service'

@Module({
  controllers: [HerramientasAdminController],
  providers: [HerramientasAdminService],
})
export class HerramientasAdminModule {}
