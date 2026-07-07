import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import type { Response } from 'express'

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>()

    switch (exception.code) {
      case 'P2002': {
        const target = exception.meta?.target
        const campo = Array.isArray(target) ? target.join(', ') : target
        response.status(409).json({
          statusCode: 409,
          error: 'Conflict',
          message: campo ? `Ya existe un registro con ese ${campo}` : 'El recurso ya existe',
        })
        return
      }
      case 'P2025':
        response.status(404).json({
          statusCode: 404,
          error: 'Not Found',
          message: 'Registro no encontrado',
        })
        return
      default:
        response.status(500).json({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Error interno del servidor',
        })
        return
    }
  }
}
