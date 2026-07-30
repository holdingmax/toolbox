import { ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PrismaService } from '../../prisma/prisma.service'
import { limpiarBaseDeTest } from '../../test/db-test-helper'
import { SkipPasswordCheck } from '../decorators/skip-password-check.decorator'
import { MustChangePasswordGuard } from './must-change-password.guard'

class ControllerConSkip {
  @SkipPasswordCheck()
  metodo() {}
}

class ControllerSinSkip {
  metodo() {}
}

function crearContexto(
  target: { new (): object },
  user: { sub: string } | undefined,
): ExecutionContext {
  return {
    getHandler: () => target.prototype.metodo,
    getClass: () => target,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext
}

describe('MustChangePasswordGuard', () => {
  let prisma: PrismaService
  let guard: MustChangePasswordGuard

  beforeAll(async () => {
    prisma = new PrismaService()
    await prisma.$connect()
    guard = new MustChangePasswordGuard(prisma, new Reflector())
  })

  afterEach(async () => {
    await limpiarBaseDeTest(prisma)
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  async function crearUsuario(debeCambiarPassword: boolean) {
    const rol = await prisma.rol.create({ data: { nombre: 'Operador', activo: true } })
    return prisma.usuario.create({
      data: {
        nombre: 'Usuario guard (test)',
        email: `guard-${debeCambiarPassword}.test@toolbox.local`,
        password_hash: 'no-se-usa-en-este-test',
        rol_id: rol.id,
        activo: true,
        debe_cambiar_password: debeCambiarPassword,
      },
    })
  }

  it('con @SkipPasswordCheck(), deja pasar sin consultar la base -- incluso si el usuario debe cambiar la contraseña', async () => {
    const usuario = await crearUsuario(true)
    const contexto = crearContexto(ControllerConSkip, { sub: usuario.id })

    await expect(guard.canActivate(contexto)).resolves.toBe(true)
  })

  it('sin usuario en el request (ruta @Public()), deja pasar', async () => {
    const contexto = crearContexto(ControllerSinSkip, undefined)

    await expect(guard.canActivate(contexto)).resolves.toBe(true)
  })

  it('usuario con debe_cambiar_password:true, lanza ForbiddenException', async () => {
    const usuario = await crearUsuario(true)
    const contexto = crearContexto(ControllerSinSkip, { sub: usuario.id })

    await expect(guard.canActivate(contexto)).rejects.toThrow(ForbiddenException)
  })

  it('usuario con debe_cambiar_password:false, deja pasar', async () => {
    const usuario = await crearUsuario(false)
    const contexto = crearContexto(ControllerSinSkip, { sub: usuario.id })

    await expect(guard.canActivate(contexto)).resolves.toBe(true)
  })

  it('usuario del token que no existe en la base, lanza ForbiddenException (fail closed)', async () => {
    const contexto = crearContexto(ControllerSinSkip, { sub: 'id-inexistente-en-la-base' })

    await expect(guard.canActivate(contexto)).rejects.toThrow(ForbiddenException)
  })
})
