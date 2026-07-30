import { ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Roles } from '../decorators/roles.decorator'
import { RolesGuard } from './roles.guard'

class ControllerSinRoles {
  metodo() {}
}

class ControllerSoloAdmin {
  @Roles('Administrador')
  metodo() {}
}

class ControllerAdminUOperador {
  @Roles('Administrador', 'Operador')
  metodo() {}
}

function crearContexto(target: { new (): object }, user: { rol_nombre: string } | undefined): ExecutionContext {
  return {
    getHandler: () => target.prototype.metodo,
    getClass: () => target,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector())

  it('sin @Roles(...) en el endpoint, deja pasar sin mirar el usuario', () => {
    const contexto = crearContexto(ControllerSinRoles, undefined)

    expect(guard.canActivate(contexto)).toBe(true)
  })

  it('con @Roles("Administrador") y el usuario tiene ese rol, deja pasar', () => {
    const contexto = crearContexto(ControllerSoloAdmin, { rol_nombre: 'Administrador' })

    expect(guard.canActivate(contexto)).toBe(true)
  })

  it('con @Roles("Administrador") y el usuario tiene otro rol, lanza ForbiddenException', () => {
    const contexto = crearContexto(ControllerSoloAdmin, { rol_nombre: 'Operador' })

    expect(() => guard.canActivate(contexto)).toThrow(ForbiddenException)
  })

  it('con @Roles(...) pero sin usuario en el request, devuelve false (no throw)', () => {
    const contexto = crearContexto(ControllerSoloAdmin, undefined)

    expect(guard.canActivate(contexto)).toBe(false)
  })

  it('con @Roles("Administrador", "Operador") y el usuario matchea el segundo rol, deja pasar', () => {
    const contexto = crearContexto(ControllerAdminUOperador, { rol_nombre: 'Operador' })

    expect(guard.canActivate(contexto)).toBe(true)
  })
})
