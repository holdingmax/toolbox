import { randomUUID } from 'node:crypto'
import type { Nivel, Usuario } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

// Orden pensado para respetar las foreign keys (`onDelete: Restrict` en todo
// el schema): primero las tablas "hoja", recién al final roles/usuarios/niveles.
const TABLAS_EN_ORDEN_DE_BORRADO = [
  'historialAdministracion',
  'historialAcceso',
  'proyectoAutomatizacion',
  'permisoNivel',
  'herramientaNivel',
  'herramienta',
  'nivel',
  'usuario',
  'rol',
] as const

export async function limpiarBaseDeTest(prisma: PrismaService): Promise<void> {
  for (const modelo of TABLAS_EN_ORDEN_DE_BORRADO) {
    await (prisma as unknown as Record<string, { deleteMany: (args: object) => Promise<unknown> }>)[
      modelo
    ].deleteMany({})
  }
}

export interface FixtureMinimo {
  niveles: {
    empresaA: Nivel
    areaA1: Nivel
    subareaA1a: Nivel
    areaA2: Nivel
    empresaB: Nivel
  }
  usuarios: {
    // Permiso directo sobre la empresa → debe ver toda Empresa A (áreas y sub-área).
    conPermisoEmpresa: Usuario
    // Permiso solo sobre Área A1 → debe ver Área A1 y su sub-área, pero NO Área A2 ni Empresa A/B.
    conPermisoArea: Usuario
    // Cero filas en permisos_niveles → no debe ver nada.
    sinPermisos: Usuario
    // Tiene una fila de permiso, pero con activo=false → debe comportarse igual que sin permisos.
    conPermisoInactivo: Usuario
  }
}

// Fixture deliberadamente mínimo: solo lo necesario para ejercitar la cascada
// de permisos (rama con nietos, rama hermana sin acceso, empresa sin acceso,
// permiso inactivo). Se recrea entero en cada test — no se reusa entre tests.
export async function crearFixtureMinimo(prisma: PrismaService): Promise<FixtureMinimo> {
  const rol = await prisma.rol.create({
    data: { nombre: 'Operador', descripcion: 'Rol de test', activo: true },
  })

  const empresaA = await crearNivel(prisma, { nombre: 'Empresa A (test)', tipo: 'Empresa', parent_id: null })
  const areaA1 = await crearNivel(prisma, {
    nombre: 'Área A1 (test)',
    tipo: 'Área',
    parent_id: empresaA.id,
    rutaPadre: empresaA.ruta,
  })
  const subareaA1a = await crearNivel(prisma, {
    nombre: 'Sub-área A1a (test)',
    tipo: 'Departamento',
    parent_id: areaA1.id,
    rutaPadre: areaA1.ruta,
  })
  const areaA2 = await crearNivel(prisma, {
    nombre: 'Área A2 (test)',
    tipo: 'Área',
    parent_id: empresaA.id,
    rutaPadre: empresaA.ruta,
  })
  const empresaB = await crearNivel(prisma, { nombre: 'Empresa B (test)', tipo: 'Empresa', parent_id: null })

  const conPermisoEmpresa = await crearUsuario(prisma, rol.id, 'con-permiso-empresa')
  await prisma.permisoNivel.create({
    data: { usuario_id: conPermisoEmpresa.id, nivel_id: empresaA.id, activo: true },
  })

  const conPermisoArea = await crearUsuario(prisma, rol.id, 'con-permiso-area')
  await prisma.permisoNivel.create({
    data: { usuario_id: conPermisoArea.id, nivel_id: areaA1.id, activo: true },
  })

  const sinPermisos = await crearUsuario(prisma, rol.id, 'sin-permisos')

  const conPermisoInactivo = await crearUsuario(prisma, rol.id, 'con-permiso-inactivo')
  await prisma.permisoNivel.create({
    data: { usuario_id: conPermisoInactivo.id, nivel_id: empresaA.id, activo: false },
  })

  return {
    niveles: { empresaA, areaA1, subareaA1a, areaA2, empresaB },
    usuarios: { conPermisoEmpresa, conPermisoArea, sinPermisos, conPermisoInactivo },
  }
}

async function crearNivel(
  prisma: PrismaService,
  opts: { nombre: string; tipo: string; parent_id: string | null; rutaPadre?: string },
) {
  // `ruta` depende del id generado por la propia fila, así que se crea con un
  // valor placeholder único y se corrige con un update inmediatamente después
  // (misma técnica que ya usa niveles-admin.service.ts al crear un nodo real).
  const creado = await prisma.nivel.create({
    data: {
      nombre: opts.nombre,
      tipo: opts.tipo,
      parent_id: opts.parent_id,
      ruta: `/placeholder-${randomUUID()}/`,
      activo: true,
    },
  })
  const ruta = `${opts.rutaPadre ?? '/'}${creado.id}/`
  return prisma.nivel.update({ where: { id: creado.id }, data: { ruta } })
}

async function crearUsuario(prisma: PrismaService, rolId: string, nombreCorto: string) {
  return prisma.usuario.create({
    data: {
      nombre: `Usuario ${nombreCorto} (test)`,
      email: `${nombreCorto}.test@toolbox.local`,
      password_hash: 'no-se-usa-en-este-test',
      rol_id: rolId,
      activo: true,
    },
  })
}
