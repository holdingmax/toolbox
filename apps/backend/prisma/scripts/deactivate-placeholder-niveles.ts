import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const IDS = ['cmqzxvxd9000014qig22mrqfg', 'cmqzyf93k0000jsqihu6lqfj6']

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  const prisma = new PrismaClient({ adapter })

  const result = await prisma.nivel.updateMany({
    where: { id: { in: IDS } },
    data: { activo: false },
  })
  console.log(`Niveles actualizados: ${result.count}`)

  const niveles = await prisma.nivel.findMany({ where: { id: { in: IDS } } })
  for (const n of niveles) {
    console.log(`- ${n.nombre} (${n.id}): activo=${n.activo}`)
  }

  await prisma.$disconnect()
}

main()
