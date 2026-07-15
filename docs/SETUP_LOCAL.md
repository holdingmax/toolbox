# Setup local — TOOLBOX

Guía para levantar Toolbox en tu máquina desde cero. Los comandos de este documento
están tomados directamente de los `package.json` reales de `apps/backend` y
`apps/frontend` — no son genéricos.

---

## 1. Requisitos previos

- **Node.js** — el repo no fija una versión (no hay `.nvmrc` ni `engines` en ningún
  `package.json`), pero se desarrolla y prueba con Node **v25**. Usá Node 20 LTS o
  más nuevo — las dependencias son recientes (Vite 8, React 19, TypeScript ~6) y
  versiones viejas de Node pueden dar problemas raros al instalar o buildear.
- **npm** (viene con Node, no se usa yarn/pnpm en este repo — hay `package-lock.json`
  en cada app).
- **Cuenta de Neon** (Postgres) con acceso al proyecto — vas a necesitar **dos
  branches**: una para desarrollo (`local-dev`) y otra dedicada solo a shadow
  database de migraciones (ver sección 3). Pedímelas a mí o consultá quien
  administra el proyecto en Neon.
- **Cuenta de Resend** — opcional para desarrollo. Solo hace falta si vas a probar
  el flujo de "olvidé mi contraseña" con envío de email real. Sin `RESEND_API_KEY`
  configurada, el resto de la app funciona igual (el envío de email falla
  silenciosamente del lado del servidor, sin romper nada).
- La CLI de Prisma **no** se instala global — ya está como devDependency
  (`prisma` en `apps/backend/package.json`) y se invoca con `npx prisma ...`.

---

## 2. Clonar y variables de entorno

```bash
git clone <repo>
cd toolbox
```

Cada app tiene su propio `.env`, a partir de su `.env.example` (commiteado, sin
secretos reales). **Nunca commitees el `.env` real** — ya está en `.gitignore`.

### `apps/backend/.env`

| Variable | Qué es |
|---|---|
| `DATABASE_URL` | Connection string de la branch `local-dev` de Neon. |
| `SHADOW_DATABASE_URL` | Connection string de una branch de Neon **separada y vacía**, dedicada solo a que `prisma migrate dev` detecte drift al generar migraciones. Nunca la misma base que `DATABASE_URL`. |
| `JWT_SECRET` | Mínimo 32 caracteres — el servidor no arranca si falta o es más corto. Generar uno propio con `openssl rand -base64 32`, no reusar el de otro entorno. |
| `JWT_EXPIRES_IN` | Duración del token, ej. `8h`. |
| `FRONTEND_URL` | `http://localhost:5173` en local — se usa para armar el link del email de recupero de contraseña. |
| `SEED_ADMIN_PASSWORD` / `SEED_OPERADOR_PASSWORD` | Contraseñas que usa `prisma/seed.ts` al crear los usuarios iniciales. Sin valor por defecto — el seed aborta si faltan. |
| `RESEND_API_KEY` | Key de Resend (opcional en local, ver arriba). |
| `MAIL_FROM` | Opcional, default `TOOLBOX <onboarding@resend.dev>`. |

### `apps/frontend/.env`

| Variable | Qué es |
|---|---|
| `VITE_API_URL` | `http://localhost:3000` en local (dónde corre el backend). En producción no se define — el frontend es servido por el mismo backend, así que usa rutas relativas. |

**Los valores reales** (connection strings de Neon, `JWT_SECRET`, `RESEND_API_KEY`)
se piden directamente a mí, o se sacan de donde correspondan según el entorno — las
credenciales de producción están en Bitwarden, nunca en un archivo del repo ni en
ningún chat.

---

## 3. Base de datos local

Conectate con `DATABASE_URL` apuntando a la branch `local-dev` de Neon (**nunca** a
producción — son bases completamente separadas y no comparten datos).

Instalá dependencias y generá el cliente de Prisma:
```bash
cd apps/backend
npm install
npx prisma generate
```

### Migraciones — flujo real de este proyecto

El proyecto usa un historial real de Prisma Migrate, baselineado en julio 2026.
**`prisma db push` está retirado — no se usa más, ni en desarrollo ni en
producción.** Cualquier cambio de schema pasa por una migración versionada:

```bash
npx prisma migrate dev --name descripcion_del_cambio
```

Esto genera la migración y la aplica automáticamente contra `local-dev`. Para que
funcione necesita la `SHADOW_DATABASE_URL` configurada (branch dedicada — en este
proyecto se usa una llamada `shadow-migrate-dev`, creada específicamente para esto).
Sin esa variable, `migrate dev` se cuelga tratando de crear una shadow database
temporal — ver troubleshooting más abajo.

Si es la primera vez que levantás el proyecto (base recién creada, sin tablas
todavía), `migrate dev` sin `--name` va a aplicar todas las migraciones existentes
del repo una por una hasta dejar la base al día.

### Datos iniciales (seed)

```bash
npx prisma db seed
```

Corre `prisma/seed.ts`. Antes de tocar la base, el script valida que `DATABASE_URL`
contenga `neon.tech` — si no lo detecta, aborta (protección para no correrlo por
error contra producción). Crea, de forma idempotente (podés correrlo varias veces
sin duplicar nada):
- 2 roles: `Administrador`, `Operador`.
- 2 usuarios: `admin@toolbox.com` (activo) y `maria@toolbox.com` (inactivo).
- 5 niveles raíz (Correo Flash, Havanna, Empresa 3, Empresa Pendiente,
  Administración Central) y sus niveles hijos.
- 4 herramientas y sus publicaciones.
- Permisos del usuario admin sobre todos los niveles raíz.

---

## 4. Levantar backend y frontend

Son dos procesos independientes, cada uno en su propia terminal (no hay un script
raíz que levante ambos a la vez).

**Backend** (puerto `3000` por default, configurable con `PORT`):
```bash
cd apps/backend
npm run start:dev
```
Corre `nest start --watch`. Cuando está arriba, loguea
`Nest application successfully started` y queda escuchando en el puerto.

**Frontend** (puerto `5173`, default de Vite):
```bash
cd apps/frontend
npm run dev
```

### Verificar que están conectados

```bash
curl http://localhost:3000/api/auth/me
```
Debería responder `401` (sin token) — confirma que el backend está arriba y
respondiendo, no que falló. Un `curl: (7) Failed to connect` significa que el
backend no levantó.

Abrí `http://localhost:5173` en el navegador y entrá a `/login` — si el login tira
un error de red (no un 401 de credenciales inválidas), revisá que
`VITE_API_URL` en `apps/frontend/.env` apunte al puerto correcto del backend.

---

## 5. Usuario admin local

Después de correr el seed (sección 3), ya existe `admin@toolbox.com` con el rol
Administrador. La contraseña es el valor que hayas puesto en `SEED_ADMIN_PASSWORD`
en tu `.env` — **el seed no te la muestra en ningún lado**, es exactamente el valor
que vos mismo definiste antes de correrlo.

No hay ningún otro mecanismo para crear un admin en local — es siempre a través del
seed. Si necesitás un segundo usuario admin de prueba, la forma más simple es entrar
al panel (`/admin/usuarios`) ya logueado como `admin@toolbox.com` y crear uno nuevo
con rol `Administrador` desde ahí.

---

## 6. Troubleshooting común

### `EADDRINUSE: address already in use :::3000`

Un proceso anterior quedó vivo ocupando el puerto (muy común si el backend se
crasheó sin cerrar limpio, o si corriste `start:dev` dos veces sin darte cuenta).

```bash
netstat -ano | findstr :3000      # Windows — te da el PID en la última columna
taskkill /PID <numero> /F
```
Confirmá que quedó libre (`netstat -ano | findstr :3000` sin salida) antes de
volver a levantar el backend.

### `prisma migrate dev` se queda colgado sin avanzar

Falta `SHADOW_DATABASE_URL` en tu `.env`, o apunta a una base que no existe/no es
alcanzable. `migrate dev` la necesita para poder detectar drift al generar cada
migración nueva. Solución: crear una branch de Neon dedicada y vacía (nunca la misma
que `DATABASE_URL`), y configurar su connection string en `SHADOW_DATABASE_URL`.

### Errores de TypeScript sobre un campo que "no existe" después de agregarlo al schema

Si editaste `schema.prisma` (agregaste un campo, por ejemplo) y el build empieza a
tirar errores tipo `Object literal may only specify known properties, and 'x' does
not exist in type...`, el cliente de Prisma no se regeneró todavía con los tipos
nuevos. Corré:
```bash
npx prisma generate
```
`migrate dev` lo hace automático la mayoría de las veces, pero si el proceso de
`start:dev` ya estaba corriendo en paralelo desde antes, a veces no toma los tipos
nuevos hasta que lo corrés a mano una vez.
