import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ThrottlerModule } from '@nestjs/throttler'
import { MailModule } from '../common/mail/mail.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { LoginThrottlerGuard } from './guards/login-throttler.guard'

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN ?? '8h') as any },
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 5 }]),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, LoginThrottlerGuard],
})
export class AuthModule {}
