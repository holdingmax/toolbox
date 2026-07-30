import * as dotenv from 'dotenv'
import * as path from 'path'

// NOTA: package.json fija "maxWorkers": 1 a propósito. Todas las suites que
// tocan esta branch de test comparten la misma base física y limpian TODAS
// las tablas en su afterEach (ver db-test-helper.ts) — con más de un worker,
// una suite puede borrar los datos de otra a mitad de camino (ya pasó: unique
// constraint en el seed de una, foreign key violation en la otra). Correr en
// serie es la restricción, no un ajuste de performance.

// Carga primero .env (local-dev) solo para poder comparar contra ella abajo —
// nunca se usa como fuente real de conexión en los tests.
const envLocalDev = dotenv.config({ path: path.resolve(__dirname, '../../.env') })
const urlLocalDev = envLocalDev.parsed?.DATABASE_URL

const envTest = dotenv.config({
  path: path.resolve(__dirname, '../../.env.test'),
  override: true,
})

if (envTest.error) {
  throw new Error(
    'Falta apps/backend/.env.test. Los tests de integración necesitan una branch de Neon dedicada ' +
      '(separada de local-dev) — ver docs de test-coverage antes de correr `npm test`.',
  )
}

if (!process.env.DATABASE_URL) {
  throw new Error('.env.test existe pero no define DATABASE_URL.')
}

if (urlLocalDev && process.env.DATABASE_URL === urlLocalDev) {
  throw new Error(
    'DATABASE_URL de .env.test es idéntica a la de .env (local-dev). ' +
      'Los tests de integración hacen deleteMany() de TODAS las tablas — se aborta para no borrar ' +
      'datos reales de desarrollo. Revisá que .env.test apunte a la branch "test" de Neon, no a local-dev.',
  )
}
