import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { PermisosNivelService } from '../common/permisos-nivel/permisos-nivel.service'
import { PrismaService } from '../prisma/prisma.service'
import { crearFixtureMinimo, limpiarBaseDeTest } from '../test/db-test-helper'
import { AccesosService } from './accesos.service'

async function crearHerramienta(prisma: PrismaService, activo = true) {
  return prisma.herramienta.create({
    data: { nombre: 'Herramienta (test)', url: 'https://herramienta.test', activo },
  })
}

async function publicar(prisma: PrismaService, herramientaId: string, nivelId: string, activo = true) {
  return prisma.herramientaNivel.create({
    data: { herramienta_id: herramientaId, nivel_id: nivelId, activo },
  })
}

describe('AccesosService', () => {
  let prisma: PrismaService
  let service: AccesosService
  let permisosNivelService: PermisosNivelService

  beforeAll(async () => {
    prisma = new PrismaService()
    await prisma.$connect()
    service = new AccesosService(prisma)
    permisosNivelService = new PermisosNivelService(prisma)
  })

  afterEach(async () => {
    await limpiarBaseDeTest(prisma)
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('getHerramientasDisponibles', () => {
    it('con permiso en la empresa, devuelve las herramientas activas publicadas en todo el subárbol', async () => {
      const fixture = await crearFixtureMinimo(prisma)
      const enElSubarbol = await crearHerramienta(prisma)
      await publicar(prisma, enElSubarbol.id, fixture.niveles.areaA1.id)
      const enOtraEmpresa = await crearHerramienta(prisma)
      await publicar(prisma, enOtraEmpresa.id, fixture.niveles.empresaB.id)

      const resultado = await service.getHerramientasDisponibles(fixture.usuarios.conPermisoEmpresa.id)

      expect(resultado.total).toBe(1)
      expect(resultado.herramientas.map((h) => h.id)).toEqual([enElSubarbol.id])
    })

    it('la misma herramienta publicada en dos niveles de la rama permitida aparece una sola vez', async () => {
      const fixture = await crearFixtureMinimo(prisma)
      const herramienta = await crearHerramienta(prisma)
      await publicar(prisma, herramienta.id, fixture.niveles.areaA1.id)
      await publicar(prisma, herramienta.id, fixture.niveles.subareaA1a.id)

      const resultado = await service.getHerramientasDisponibles(fixture.usuarios.conPermisoEmpresa.id)

      expect(resultado.total).toBe(1)
    })

    it('una publicación inactiva no aparece aunque el nivel y el permiso estén bien', async () => {
      const fixture = await crearFixtureMinimo(prisma)
      const herramienta = await crearHerramienta(prisma)
      await publicar(prisma, herramienta.id, fixture.niveles.areaA1.id, false)

      const resultado = await service.getHerramientasDisponibles(fixture.usuarios.conPermisoEmpresa.id)

      expect(resultado.total).toBe(0)
    })

    it('una herramienta con activo:false no aparece aunque la publicación esté activa', async () => {
      const fixture = await crearFixtureMinimo(prisma)
      const herramienta = await crearHerramienta(prisma, false)
      await publicar(prisma, herramienta.id, fixture.niveles.areaA1.id, true)

      const resultado = await service.getHerramientasDisponibles(fixture.usuarios.conPermisoEmpresa.id)

      expect(resultado.total).toBe(0)
    })
  })

  describe('registrar', () => {
    it('con permiso vigente, tiene éxito, crea historial_accesos y devuelve la url', async () => {
      const fixture = await crearFixtureMinimo(prisma)
      const herramienta = await crearHerramienta(prisma)
      await publicar(prisma, herramienta.id, fixture.niveles.areaA1.id)

      const resultado = await service.registrar(
        fixture.usuarios.conPermisoEmpresa.id,
        herramienta.id,
        '127.0.0.1',
        'jest',
      )

      expect(resultado).toEqual({ url: herramienta.url })
      const historial = await prisma.historialAcceso.findMany({
        where: { usuario_id: fixture.usuarios.conPermisoEmpresa.id, herramienta_id: herramienta.id },
      })
      expect(historial).toHaveLength(1)
    })

    it('sin ningún permiso relacionado, lanza ForbiddenException', async () => {
      const fixture = await crearFixtureMinimo(prisma)
      const herramienta = await crearHerramienta(prisma)
      await publicar(prisma, herramienta.id, fixture.niveles.areaA1.id)

      await expect(
        service.registrar(fixture.usuarios.sinPermisos.id, herramienta.id, null, null),
      ).rejects.toThrow(ForbiddenException)
    })

    it('con la publicación en activo:false, lanza ForbiddenException aunque el permiso esté bien', async () => {
      const fixture = await crearFixtureMinimo(prisma)
      const herramienta = await crearHerramienta(prisma)
      await publicar(prisma, herramienta.id, fixture.niveles.areaA1.id, false)

      await expect(
        service.registrar(fixture.usuarios.conPermisoEmpresa.id, herramienta.id, null, null),
      ).rejects.toThrow(ForbiddenException)
    })

    it('con la herramienta en activo:false, lanza NotFoundException antes de chequear permisos', async () => {
      const fixture = await crearFixtureMinimo(prisma)
      const herramienta = await crearHerramienta(prisma, false)
      await publicar(prisma, herramienta.id, fixture.niveles.areaA1.id)

      await expect(
        service.registrar(fixture.usuarios.conPermisoEmpresa.id, herramienta.id, null, null),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('simetría con PermisosNivelService.getVisibleNodes', () => {
    it('mismo escenario válido: navegación lo muestra y accesos lo deja abrir', async () => {
      const fixture = await crearFixtureMinimo(prisma)
      const herramienta = await crearHerramienta(prisma)
      await publicar(prisma, herramienta.id, fixture.niveles.areaA1.id)

      const visibles = await permisosNivelService.getVisibleNodes(fixture.usuarios.conPermisoEmpresa.id)
      expect(visibles.map((n) => n.id)).toContain(fixture.niveles.areaA1.id)

      await expect(
        service.registrar(fixture.usuarios.conPermisoEmpresa.id, herramienta.id, null, null),
      ).resolves.toEqual({ url: herramienta.url })
    })

    // Documenta una inconsistencia real y ya identificada (no un bug de seguridad:
    // bloquea de más, no expone de más — ver docs/ARQUITECTURA.md, sección 3).
    // niveles-admin.service.ts.toggleEstado() no cascadea a los hijos: un padre
    // puede quedar activo:false con hijos activo:true. getVisibleNodes filtra el
    // activo del nivel DESTINO pero no el del nivel donde está anclado el permiso,
    // así que sigue mostrando la rama del hijo activo. verificarAccesoHerramienta
    // sí filtra nivel:{activo:true} del lado del permiso, así que bloquea el
    // acceso real. Resultado: la tarjeta aparece en la navegación y al abrirla
    // da 403. Se deja documentado tal cual está hoy — no se corrige en este commit.
    it('permiso anclado en un nivel ya desactivado: la navegación sigue mostrando el hijo activo, pero el acceso real lo bloquea', async () => {
      const fixture = await crearFixtureMinimo(prisma)
      const herramienta = await crearHerramienta(prisma)
      await publicar(prisma, herramienta.id, fixture.niveles.areaA1.id)
      await prisma.nivel.update({
        where: { id: fixture.niveles.empresaA.id },
        data: { activo: false },
      })

      const visibles = await permisosNivelService.getVisibleNodes(fixture.usuarios.conPermisoEmpresa.id)
      expect(visibles.map((n) => n.id)).toContain(fixture.niveles.areaA1.id)
      expect(visibles.map((n) => n.id)).not.toContain(fixture.niveles.empresaA.id)

      await expect(
        service.registrar(fixture.usuarios.conPermisoEmpresa.id, herramienta.id, null, null),
      ).rejects.toThrow(ForbiddenException)
    })
  })
})
