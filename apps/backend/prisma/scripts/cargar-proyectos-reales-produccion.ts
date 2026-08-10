// Carga los 12 proyectos reales directamente en PRODUCCIÓN. A diferencia de
// cargar-proyectos-reales.ts (pensado para local-dev/demo-vigo), este
// script NO borra nada (no hay datos de demo en producción) y NO crea
// niveles (ya se crearon a mano desde el panel de administración) -- solo
// inserta los 12 proyectos, usando los ids reales de producción.
//
// Pensado para correr desde la Shell de Render del propio servicio: usa
// process.env.DATABASE_URL tal cual ya lo tiene configurado el servicio,
// sin cargar ningún .env.
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { ETAPAS_PIPELINE_PROYECTO } from '../../src/admin/proyectos-automatizacion/proyectos-automatizacion.constants'

const NIVEL_FREDY_PUBLICIDAD = 'cmsnfl067001y1xq9i37x9xx1'
const NIVEL_RADIO_LV12 = 'cmsnfnr3p00221xq9mfj52tsb'
const NIVEL_PRESUPUESTO_Y_FINANZAS = 'cmsnfpum900241xq95u89326k'

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  const prisma = new PrismaClient({ adapter })

  // Chequeo de seguridad: este script asume una tabla vacía. Si ya hay
  // proyectos cargados (por ejemplo, si se corre dos veces por error), se
  // aborta en vez de duplicar todo.
  const existentes = await prisma.proyectoAutomatizacion.count()
  if (existentes > 0) {
    console.error(
      `❌ Ya hay ${existentes} proyecto(s) en la base. Este script asume una tabla vacía -- abortando para no duplicar.`,
    )
    process.exit(1)
  }

  // Chequeo de seguridad: confirmar que los 3 niveles reales existen con el
  // nombre esperado antes de escribir nada -- si el id está mal tipeado o
  // apunta a otra cosa, se aborta con un error claro en vez de crear el
  // proyecto colgado de un nivel equivocado.
  const niveles = await prisma.nivel.findMany({
    where: { id: { in: [NIVEL_FREDY_PUBLICIDAD, NIVEL_RADIO_LV12, NIVEL_PRESUPUESTO_Y_FINANZAS] } },
  })
  const esperados: Record<string, string> = {
    [NIVEL_FREDY_PUBLICIDAD]: 'Fredy Publicidad',
    [NIVEL_RADIO_LV12]: 'Radio LV12',
    [NIVEL_PRESUPUESTO_Y_FINANZAS]: 'Presupuesto y Finanzas',
  }
  for (const [id, nombreEsperado] of Object.entries(esperados)) {
    const nivel = niveles.find((n) => n.id === id)
    if (!nivel) {
      console.error(`❌ No se encontró el nivel ${id} (esperado: "${nombreEsperado}"). Abortando.`)
      process.exit(1)
    }
    if (nivel.nombre !== nombreEsperado) {
      console.error(`❌ El nivel ${id} se llama "${nivel.nombre}", no "${nombreEsperado}" como se esperaba. Abortando.`)
      process.exit(1)
    }
  }
  console.log('✓ Niveles verificados correctamente.')

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
    const p = await crearProyecto(titulo, NIVEL_RADIO_LV12)
    console.log(`✓ ${p.titulo}`)
  }

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
