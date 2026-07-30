import { PrismaService } from '../../prisma/prisma.service'
import { crearFixtureMinimo, limpiarBaseDeTest } from '../../test/db-test-helper'
import { PermisosNivelService } from './permisos-nivel.service'

function ids(niveles: { id: string }[]): string[] {
  return niveles.map((n) => n.id).sort()
}

describe('PermisosNivelService.getVisibleNodes', () => {
  let prisma: PrismaService
  let service: PermisosNivelService

  beforeAll(async () => {
    prisma = new PrismaService()
    await prisma.$connect()
    service = new PermisosNivelService(prisma)
  })

  afterEach(async () => {
    await limpiarBaseDeTest(prisma)
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('con permiso en la empresa, ve todo su subárbol pero no la empresa hermana', async () => {
    const fixture = await crearFixtureMinimo(prisma)

    const visibles = await service.getVisibleNodes(fixture.usuarios.conPermisoEmpresa.id)

    expect(ids(visibles)).toEqual(
      ids([fixture.niveles.empresaA, fixture.niveles.areaA1, fixture.niveles.areaA2, fixture.niveles.subareaA1a]),
    )
  })

  it('con permiso en un área intermedia, ve el área y sus descendientes pero no el padre ni la hermana', async () => {
    const fixture = await crearFixtureMinimo(prisma)

    const visibles = await service.getVisibleNodes(fixture.usuarios.conPermisoArea.id)

    expect(ids(visibles)).toEqual(ids([fixture.niveles.areaA1, fixture.niveles.subareaA1a]))
  })

  it('sin ningún permiso, no ve nada', async () => {
    const fixture = await crearFixtureMinimo(prisma)

    const visibles = await service.getVisibleNodes(fixture.usuarios.sinPermisos.id)

    expect(visibles).toEqual([])
  })

  it('con un permiso existente pero inactivo, no ve nada', async () => {
    const fixture = await crearFixtureMinimo(prisma)

    const visibles = await service.getVisibleNodes(fixture.usuarios.conPermisoInactivo.id)

    expect(visibles).toEqual([])
  })

  it('un nivel inactivo dentro de una rama permitida no aparece, aunque el permiso esté activo', async () => {
    const fixture = await crearFixtureMinimo(prisma)
    await prisma.nivel.update({
      where: { id: fixture.niveles.subareaA1a.id },
      data: { activo: false },
    })

    const visibles = await service.getVisibleNodes(fixture.usuarios.conPermisoEmpresa.id)

    expect(ids(visibles)).toEqual(ids([fixture.niveles.empresaA, fixture.niveles.areaA1, fixture.niveles.areaA2]))
  })

  it('con permisos en dos ramas sin relación, ve la unión de ambos subárboles sin duplicados', async () => {
    const fixture = await crearFixtureMinimo(prisma)
    await prisma.permisoNivel.create({
      data: {
        usuario_id: fixture.usuarios.conPermisoArea.id,
        nivel_id: fixture.niveles.empresaB.id,
        activo: true,
      },
    })

    const visibles = await service.getVisibleNodes(fixture.usuarios.conPermisoArea.id)

    expect(ids(visibles)).toEqual(
      ids([fixture.niveles.areaA1, fixture.niveles.subareaA1a, fixture.niveles.empresaB]),
    )
  })
})
