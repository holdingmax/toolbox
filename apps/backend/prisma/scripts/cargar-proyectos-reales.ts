// Reemplaza los proyectos de demo (cargados para mostrarle el módulo a
// Federico Vigo) por los proyectos reales, organizados por empresa/área.
// Hard delete confirmado explícitamente para los datos de demo (sin valor
// de auditoría real) -- excepción puntual a la regla general de baja
// lógica del proyecto.
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { ETAPAS_PIPELINE_PROYECTO } from '../../src/admin/proyectos-automatizacion/proyectos-automatizacion.constants'

function validarEntorno() {
  const url = process.env.DATABASE_URL ?? ''
  if (url.includes('neon.tech')) return
  console.error('❌ DATABASE_URL no parece ser una base de desarrollo (no contiene "neon.tech"). Abortando.')
  process.exit(1)
}
validarEntorno()

const NIVEL_PRESUPUESTO_Y_FINANZAS = 'cms622e7s0000d8qizl2owzor'
const NIVEL_FREDY_PUBLICIDAD = 'cms63ww0z0004d8qipgtlkskd'

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  const prisma = new PrismaClient({ adapter })

  // Paso 1: Radio LV12 como empresa nueva e independiente (sin relación de
  // negocio con Fredy Publicidad -- clientes distintos, cada empresa en el
  // árbol queda separada).
  const radioCreado = await prisma.nivel.create({
    data: { nombre: 'Radio LV12', tipo: 'Empresa', parent_id: null, ruta: `/placeholder-${Date.now()}/`, activo: true },
  })
  const radioLv12 = await prisma.nivel.update({
    where: { id: radioCreado.id },
    data: { ruta: `/${radioCreado.id}/` },
  })
  console.log(`Nivel creado: ${radioLv12.nombre} (${radioLv12.id})`)

  // Paso 2: borrar los proyectos de demo (hard delete confirmado). Orden
  // obligatorio por la FK Restrict: etapas antes que proyectos.
  const etapasBorradas = await prisma.proyectoEtapaEstado.deleteMany({})
  const proyectosBorrados = await prisma.proyectoAutomatizacion.deleteMany({})
  console.log(`Borrados: ${proyectosBorrados.count} proyectos de demo, ${etapasBorradas.count} filas de etapas`)

  // Paso 3: cargar los proyectos reales.
  async function crearProyecto(titulo: string, nivelId: string, observaciones?: string) {
    return prisma.proyectoAutomatizacion.create({
      data: {
        titulo,
        nivel_id: nivelId,
        observaciones,
        etapas: {
          create: ETAPAS_PIPELINE_PROYECTO.map((etapa, i) => ({
            etapa,
            estado: i === 0 ? 'en_curso' : 'no_alcanzada',
          })),
        },
      },
    })
  }

  const presupuesto = await crearProyecto(
    'Automatización del proceso que hoy hacen a mano Enrique Macchi y Flavia',
    NIVEL_PRESUPUESTO_Y_FINANZAS,
    `Prioridad confirmada por Vigo. Arranque oficial de desarrollo: ${new Date().toISOString().slice(0, 10)}.`,
  )

  // Ya viene con avance real (ya pasó relevamiento y aprobación, arranca
  // desarrollo hoy) -- no es el arranque default de "recién Iniciado".
  for (const etapa of ['iniciado', 'en_relevamiento', 'aprobado', 'en_cola', 'iniciando_desarrollo']) {
    await prisma.proyectoEtapaEstado.update({
      where: { proyecto_id_etapa: { proyecto_id: presupuesto.id, etapa } },
      data: { estado: 'completada' },
    })
  }
  await prisma.proyectoEtapaEstado.update({
    where: { proyecto_id_etapa: { proyecto_id: presupuesto.id, etapa: 'en_proceso' } },
    data: { estado: 'en_curso' },
  })
  console.log(`✓ ${presupuesto.titulo}`)

  const proyectosFredy = [
    'Reporte de Facturación',
    'Reporte de Cobranzas',
    'Reporte de Saldos Deudores',
    'Consolidación de Reportes Gerenciales',
    'Reportes e indicadores comerciales',
    'Seguimiento de Pipeline Comercial',
    'Disponibilidad y ocupación de espacios publicitarios',
    'Reportes de mantenimiento',
  ]
  for (const titulo of proyectosFredy) {
    const p = await crearProyecto(titulo, NIVEL_FREDY_PUBLICIDAD)
    console.log(`✓ ${p.titulo}`)
  }

  const proyectosRadio = [
    'Histórico/evolución de facturación a clientes',
    'Histórico/evolución/estado de proveedores',
    'Tasa de ocupación de tanda publicitaria disponible (en segundos)',
  ]
  for (const titulo of proyectosRadio) {
    const p = await crearProyecto(titulo, radioLv12.id)
    console.log(`✓ ${p.titulo}`)
  }

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
