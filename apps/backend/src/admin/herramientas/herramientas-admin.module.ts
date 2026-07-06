import { Module } from '@nestjs/common'
import { HealthCheckService } from './health-check.service'
import { HerramientasAdminController } from './herramientas-admin.controller'
import { HerramientasAdminService } from './herramientas-admin.service'

@Module({
  controllers: [HerramientasAdminController],
  providers: [HerramientasAdminService, HealthCheckService],
})
export class HerramientasAdminModule {}
