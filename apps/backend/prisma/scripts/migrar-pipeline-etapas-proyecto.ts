// Migra los proyectos existentes (estado lineal viejo, 1 solo valor) al
// pipeline nuevo de 8 etapas con semáforo por etapa. Todo lo anterior a la
// etapa activa queda "completada"; la propia etapa activa queda "en_curso"
// (salvo "finalizado", que marca las 8 como "completada"); el resto
// "no_alcanzada". `pausado` no tiene mapeo automático -- el modelo viejo no
// guarda en qué etapa se pausó (0 casos en este dataset; revisar a mano si
// aparece en el futuro).
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

function validarEntorno() {
  const url = process.env.DATABASE_URL ?? ''
  if (url.includes('neon.tech')) return
  console.error('❌ DATABASE_URL no parece ser una base de desarrollo (no contiene "neon.tech"). Abortando.')
  process.exit(1)
}
validarEntorno()

const ETAPAS_PIPELINE = [
  'iniciado',
  'en_relevamiento',
  'aprobado',
  'en_cola',
  'iniciando_desarrollo',
  'en_proceso',
  'en_pruebas',
  'finalizado',
] as const

const ETAPA_ACTIVA_POR_ESTADO_VIEJO: Record<string, (typeof ETAPAS_PIPELINE)[number]> = {
  pendiente: 'iniciado',
  iniciado: 'iniciando_desarrollo',
  en_proceso: 'en_proceso',
  testing: 'en_pruebas',
  finalizado: 'finalizado',
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  const prisma = new PrismaClient({ adapter })

  // $queryRaw, no prisma.proyectoAutomatizacion.findMany(): la columna
  // "estado" vieja ya no existe en schema.prisma (se dropea en el paso D),
  // así que el Prisma Client generado no la tipa más. Esto solo funciona
  // corrido ENTRE el paso A (agrega lo nuevo) y el paso D (dropea "estado")
  // de la migración — exactamente la ventana en la que se usó acá, y la
  // misma ventana que va a hacer falta reabrir el día que esto se migre a
  // producción.
  const proyectos = await prisma.$queryRaw<{ id: string; titulo: string; estado: string }[]>`
    SELECT id, titulo, estado FROM proyectos_automatizacion
  `
  console.log(`Proyectos a migrar: ${proyectos.length}`)

  for (const proyecto of proyectos) {
    const etapaActiva = ETAPA_ACTIVA_POR_ESTADO_VIEJO[proyecto.estado]

    if (!etapaActiva) {
      console.warn(
        `⚠️  "${proyecto.titulo}" tiene estado="${proyecto.estado}" sin mapeo automático -- se deja sin filas de etapas, revisar a mano.`,
      )
      continue
    }

    const indiceActiva = ETAPAS_PIPELINE.indexOf(etapaActiva)

    for (let i = 0; i < ETAPAS_PIPELINE.length; i++) {
      const etapa = ETAPAS_PIPELINE[i]
      let estado: string
      if (proyecto.estado === 'finalizado') {
        estado = 'completada'
      } else if (i < indiceActiva) {
        estado = 'completada'
      } else if (i === indiceActiva) {
        estado = 'en_curso'
      } else {
        estado = 'no_alcanzada'
      }

      await prisma.proyectoEtapaEstado.upsert({
        where: { proyecto_id_etapa: { proyecto_id: proyecto.id, etapa } },
        update: { estado },
        create: { proyecto_id: proyecto.id, etapa, estado },
      })
    }

    console.log(`✓ ${proyecto.titulo}: estado="${proyecto.estado}" -> etapa activa "${etapaActiva}"`)
  }

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
