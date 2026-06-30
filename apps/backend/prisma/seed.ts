import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as bcrypt from 'bcrypt'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // ── Roles ──────────────────────────────────────────────────────────────────
  const rolAdmin = await prisma.rol.upsert({
    where: { id: 'cmqzf83w20000f4qiv61kgqh5' },
    update: {},
    create: {
      id: 'cmqzf83w20000f4qiv61kgqh5',
      nombre: 'Administrador',
      descripcion: 'Acceso total',
      activo: true,
    },
  })
  console.log(`Rol: ${rolAdmin.nombre}`)

  const existingOperador = await prisma.rol.findFirst({ where: { nombre: 'Operador' } })
  if (!existingOperador) {
    await prisma.rol.create({
      data: { nombre: 'Operador', descripcion: 'Acceso operativo sin administración', activo: true },
    })
    console.log('Rol: Operador (creado)')
  } else {
    console.log('Rol: Operador (ya existe)')
  }

  // ── Usuarios ───────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin2026!', 10)
  const adminUser = await prisma.usuario.upsert({
    where: { email: 'admin@toolbox.com' },
    update: {},
    create: {
      id: 'cmqzf83wi0001f4qi943je1ut',
      nombre: 'Admin TOOLBOX',
      email: 'admin@toolbox.com',
      password_hash: adminHash,
      rol_id: 'cmqzf83w20000f4qiv61kgqh5',
      activo: true,
    },
  })
  console.log(`Usuario: ${adminUser.nombre}`)

  const mariaHash = await bcrypt.hash('Toolbox2026!', 10)
  const mariaUser = await prisma.usuario.upsert({
    where: { email: 'maria@toolbox.com' },
    update: {},
    create: {
      id: 'cmqzhe3u200002cqif8nh9l00',
      nombre: 'María García',
      email: 'maria@toolbox.com',
      password_hash: mariaHash,
      rol_id: 'cmqzf83w20000f4qiv61kgqh5',
      activo: false,
    },
  })
  console.log(`Usuario: ${mariaUser.nombre} (inactivo)`)

  // ── Niveles ────────────────────────────────────────────────────────────────
  // Primero los raíz (sin parent)
  const niveles = [
    {
      id: 'cmqzfghpa00009kqi7ff5k08w',
      nombre: 'Correo Flash',
      descripcion: null,
      parent_id: null,
      tipo: 'empresa',
      ruta: '/cmqzfghpa00009kqi7ff5k08w/',
      orden: 1,
      icono_url: '/flash-logo.webp',
      color_fondo: null,
      activo: true,
    },
    {
      id: 'cmqzfghq200019kqi18fi2mbq',
      nombre: 'Havanna',
      descripcion: null,
      parent_id: null,
      tipo: 'empresa',
      ruta: '/cmqzfghq200019kqi18fi2mbq/',
      orden: 2,
      icono_url: '/havanna-logo.webp',
      color_fondo: null,
      activo: true,
    },
    {
      id: 'cmqzxvxd9000014qig22mrqfg',
      nombre: 'Empresa 3',
      descripcion: 'Empresa pendiente de configuración',
      parent_id: null,
      tipo: 'empresa',
      ruta: '/cmqzxvxd9000014qig22mrqfg/',
      orden: 3,
      icono_url: null,
      color_fondo: '#2a2a3a',
      activo: true,
    },
    {
      id: 'cmqzyf93k0000jsqihu6lqfj6',
      nombre: 'Empresa Pendiente',
      descripcion: 'Empresa pendiente de configuración — renombrar desde ABM de Niveles',
      parent_id: null,
      tipo: 'empresa',
      ruta: '/cmqzyf93k0000jsqihu6lqfj6/',
      orden: 4,
      icono_url: null,
      color_fondo: '#3a3a4a',
      activo: true,
    },
    // Hijos — después de los raíz
    {
      id: 'cmqzfghql00029kqioihk2cwb',
      nombre: 'Operaciones',
      descripcion: null,
      parent_id: 'cmqzfghpa00009kqi7ff5k08w',
      tipo: 'area',
      ruta: '/cmqzfghpa00009kqi7ff5k08w/cmqzfghql00029kqioihk2cwb/',
      orden: 1,
      icono_url: null,
      color_fondo: null,
      activo: true,
    },
    {
      id: 'cmqzudwja00005sqi10bwnlja',
      nombre: 'Finanzas',
      descripcion: null,
      parent_id: 'cmqzfghq200019kqi18fi2mbq',
      tipo: 'Área',
      ruta: '/cmqzfghq200019kqi18fi2mbq/cmqzudwja00005sqi10bwnlja/',
      orden: 0,
      icono_url: null,
      color_fondo: null,
      activo: true,
    },
    {
      id: 'cmqzyf9410001jsqiak7yr5s4',
      nombre: 'Inversiones',
      descripcion: null,
      parent_id: 'cmqzyf93k0000jsqihu6lqfj6',
      tipo: 'area',
      ruta: '/cmqzyf93k0000jsqihu6lqfj6/cmqzyf9410001jsqiak7yr5s4/',
      orden: 1,
      icono_url: null,
      color_fondo: null,
      activo: true,
    },
  ]

  for (const nivel of niveles) {
    await prisma.nivel.upsert({
      where: { id: nivel.id },
      update: {},
      create: nivel,
    })
    console.log(`Nivel: ${nivel.nombre}`)
  }

  // ── Herramientas ───────────────────────────────────────────────────────────
  const herramientas = [
    {
      id: 'cmqzfghr200039kqiyb5vnooq',
      nombre: 'CRM Reclamos Flash',
      descripcion: 'Gestión de envíos diarios',
      url: 'https://cxflash.misenviosapp.com.ar/login',
      icono_url: null,
      soporte: 'Leticia Aráoz',
      orden: 1,
      activo: true,
    },
    {
      id: 'cmqzfghra00049kqi6vp567vo',
      nombre: 'Reporte de Inversiones',
      descripcion: 'Reportes de operación mensual',
      url: 'https://reporteinversiones.onrender.com',
      icono_url: null,
      soporte: 'Federico Vigo',
      orden: 2,
      activo: true,
    },
    {
      id: 'cmqzfghri00059kqi29e8oum3',
      nombre: 'Control Havanna',
      descripcion: 'Gestión de clientes',
      url: 'https://controlhavanna.onrender.com',
      icono_url: null,
      soporte: 'Jorge Artigas',
      orden: 1,
      activo: true,
    },
  ]

  for (const h of herramientas) {
    await prisma.herramienta.upsert({
      where: { id: h.id },
      update: {},
      create: h,
    })
    console.log(`Herramienta: ${h.nombre}`)
  }

  // ── Herramientas ↔ Niveles ─────────────────────────────────────────────────
  const publicaciones = [
    // CRM Reclamos Flash → Operaciones (activo)
    { id: 'cmqzfghrt00069kqio89pmm13', herramienta_id: 'cmqzfghr200039kqiyb5vnooq', nivel_id: 'cmqzfghql00029kqioihk2cwb', activo: true },
    // Reporte de Inversiones → Operaciones (inactivo)
    { id: 'cmqzfghs200079kqics6en2yq', herramienta_id: 'cmqzfghra00049kqi6vp567vo', nivel_id: 'cmqzfghql00029kqioihk2cwb', activo: false },
    // Control Havanna → Havanna (activo)
    { id: 'cmqzfghs900089kqi4z7o4ghm', herramienta_id: 'cmqzfghri00059kqi29e8oum3', nivel_id: 'cmqzfghq200019kqi18fi2mbq', activo: true },
    // CRM Reclamos Flash → Correo Flash (activo)
    { id: 'cmqznhaqj000038qigp51jt7q', herramienta_id: 'cmqzfghr200039kqiyb5vnooq', nivel_id: 'cmqzfghpa00009kqi7ff5k08w', activo: true },
    // Control Havanna → Operaciones (inactivo)
    { id: 'cmqznkc74000338qipmgwt7uj', herramienta_id: 'cmqzfghri00059kqi29e8oum3', nivel_id: 'cmqzfghql00029kqioihk2cwb', activo: false },
    // Reporte de Inversiones → Finanzas (activo)
    { id: 'cmqzx4vsm0000h4qiicdczsll', herramienta_id: 'cmqzfghra00049kqi6vp567vo', nivel_id: 'cmqzudwja00005sqi10bwnlja', activo: true },
    // Reporte de Inversiones → Inversiones (activo)
    { id: 'cmqzyf94x0002jsqiwrnqtsav', herramienta_id: 'cmqzfghra00049kqi6vp567vo', nivel_id: 'cmqzyf9410001jsqiak7yr5s4', activo: true },
  ]

  for (const p of publicaciones) {
    await prisma.herramientaNivel.upsert({
      where: { id: p.id },
      update: {},
      create: p,
    })
  }
  console.log(`Publicaciones: ${publicaciones.length} herramientas_niveles`)

  // ── Permisos ───────────────────────────────────────────────────────────────
  const permisos = [
    // Admin TOOLBOX → Correo Flash
    { id: 'cmqzfghsk00099kqiyk859dev', usuario_id: 'cmqzf83wi0001f4qi943je1ut', nivel_id: 'cmqzfghpa00009kqi7ff5k08w', activo: true },
    // Admin TOOLBOX → Havanna
    { id: 'cmqzfghss000a9kqi5sxqra2d', usuario_id: 'cmqzf83wi0001f4qi943je1ut', nivel_id: 'cmqzfghq200019kqi18fi2mbq', activo: true },
    // Admin TOOLBOX → Empresa 3
    { id: 'cmqzxvxeh000114qi1vfomu0i', usuario_id: 'cmqzf83wi0001f4qi943je1ut', nivel_id: 'cmqzxvxd9000014qig22mrqfg', activo: true },
    // Admin TOOLBOX → Empresa Pendiente
    { id: 'cmqzyf9570003jsqindiaumtv', usuario_id: 'cmqzf83wi0001f4qi943je1ut', nivel_id: 'cmqzyf93k0000jsqihu6lqfj6', activo: true },
  ]

  for (const perm of permisos) {
    await prisma.permisoNivel.upsert({
      where: { id: perm.id },
      update: {},
      create: perm,
    })
  }
  console.log(`Permisos: ${permisos.length} permisos_niveles`)

  console.log('\nSeed completado.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
