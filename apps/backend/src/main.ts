import 'dotenv/config'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter'

async function bootstrap() {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret || jwtSecret.length < 32) {
    console.error(
      'JWT_SECRET no está configurado o es demasiado corto — el servidor no puede arrancar de forma segura',
    )
    process.exit(1)
  }

  const app = await NestFactory.create(AppModule)

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  app.useGlobalFilters(new PrismaExceptionFilter())

  app.setGlobalPrefix('api')

  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
