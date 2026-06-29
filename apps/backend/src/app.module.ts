import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { AccesosModule } from './accesos/accesos.module'
import { HerramientasAdminModule } from './admin/herramientas/herramientas-admin.module'
import { HistorialAdminModule } from './admin/historial/historial-admin.module'
import { NivelesAdminModule } from './admin/niveles/niveles-admin.module'
import { PermisosAdminModule } from './admin/permisos/permisos-admin.module'
import { RolesModule } from './admin/roles/roles.module'
import { UsuariosModule } from './admin/usuarios/usuarios.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard'
import { RolesGuard } from './auth/guards/roles.guard'
import { NavegacionModule } from './navegacion/navegacion.module'
import { PrismaModule } from './prisma/prisma.module'

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    NavegacionModule,
    AccesosModule,
    UsuariosModule,
    RolesModule,
    NivelesAdminModule,
    HerramientasAdminModule,
    PermisosAdminModule,
    HistorialAdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
