import { Module } from '@nestjs/common'
import { NivelesAdminController } from './niveles-admin.controller'
import { NivelesAdminService } from './niveles-admin.service'

@Module({
  controllers: [NivelesAdminController],
  providers: [NivelesAdminService],
})
export class NivelesAdminModule {}
