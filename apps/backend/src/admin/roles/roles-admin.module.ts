import { Module } from '@nestjs/common'
import { RolesAdminController } from './roles-admin.controller'
import { RolesAdminService } from './roles-admin.service'

@Module({
  controllers: [RolesAdminController],
  providers: [RolesAdminService],
})
export class RolesAdminModule {}
