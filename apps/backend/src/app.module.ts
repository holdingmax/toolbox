import { join } from 'path'
import { Module } from '@nestjs/common'
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { ServeStaticModule } from '@nestjs/serve-static'
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
import { MustChangePasswordGuard } from './auth/guards/must-change-password.guard'
import { RolesGuard } from './auth/guards/roles.guard'
import { AuditoriaInterceptor } from './common/interceptors/auditoria.interceptor'
import { NavegacionModule } from './navegacion/navegacion.module'
import { PrismaModule } from './prisma/prisma.module'

@Module({
  imports: [
    // Sirve el build de React para todas las rutas que no sean /api/*
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'frontend', 'dist'),
      exclude: ['/api/{*path}'],
    }),
    ScheduleModule.forRoot(),
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
    { provide: APP_GUARD, useClass: MustChangePasswordGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditoriaInterceptor },
  ],
})
export class AppModule {}
