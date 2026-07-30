import { PrismaService } from '../prisma/prisma.service'
import { crearFixtureMinimo, limpiarBaseDeTest } from './db-test-helper'

// No prueba lógica de negocio todavía — solo confirma que la infraestructura
// de tests de integración (branch de test, seed, limpieza) funciona de punta
// a punta antes de escribir el primer test real de permisos sobre ella.
describe('infraestructura de tests de integración', () => {
  let prisma: PrismaService

  beforeAll(async () => {
    prisma = new PrismaService()
    await prisma.$connect()
  })

  afterEach(async () => {
    await limpiarBaseDeTest(prisma)
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('seedea el fixture mínimo y lo puede leer de vuelta', async () => {
    const fixture = await crearFixtureMinimo(prisma)

    expect(await prisma.nivel.count()).toBe(5)
    expect(await prisma.usuario.count()).toBe(4)
    expect(fixture.niveles.subareaA1a.ruta).toBe(
      `${fixture.niveles.areaA1.ruta}${fixture.niveles.subareaA1a.id}/`,
    )
  })

  it('deja la base completamente limpia después de limpiarBaseDeTest', async () => {
    await crearFixtureMinimo(prisma)
    await limpiarBaseDeTest(prisma)

    expect(await prisma.nivel.count()).toBe(0)
    expect(await prisma.usuario.count()).toBe(0)
    expect(await prisma.rol.count()).toBe(0)
    expect(await prisma.permisoNivel.count()).toBe(0)
  })
})
