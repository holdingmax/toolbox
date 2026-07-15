# Arquitectura — TOOLBOX

Este documento explica cómo está diseñado Toolbox: el modelo de datos central, cómo
se resuelve la autorización, y qué es y qué NO es este sistema. El objetivo es que
alguien nuevo entienda el diseño sin tener que leer el código entero primero. Para el
estado de seguridad (qué se corrigió, qué es una limitación aceptada, qué queda
pendiente) ver [`AUDITORIA_SEGURIDAD.md`](./AUDITORIA_SEGURIDAD.md) — este documento
se enfoca en el "cómo está armado", no en el "qué tan seguro es".

---

## 1. Stack y estructura general

| Capa | Tecnología |
|---|---|
| Backend | NestJS + TypeScript |
| ORM | Prisma 7 |
| Base de datos | PostgreSQL — Neon en desarrollo (branch `local-dev` + branch dedicada para shadow database de migraciones), Render en producción. Son bases completamente separadas, nunca comparten datos. |
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Email transaccional | Resend (flujo de recupero de contraseña) |
| Deploy | Render, **manual** (Manual Deploy desde el dashboard, no se dispara solo en cada push) |

El `buildCommand` de Render corre `npx prisma migrate deploy` (no `db push`) —
cualquier cambio de schema debe llegar como una migración generada con
`npx prisma migrate dev` en local y commiteada junto con el código. Ver
`CLAUDE.md`/`AGENTS.md` para el detalle exacto del flujo de migraciones.

Estructura del repo:
```
apps/
├── backend/   # API NestJS — src/ organizado por módulo de dominio
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
└── frontend/  # React + Vite — src/pages, src/api, src/contexts
```

---

## 2. Modelo de datos central — el árbol de niveles

### `Nivel` — árbol autorreferencial

```prisma
model Nivel {
  id        String   @id @default(cuid())
  nombre    String
  parent_id String?
  tipo      String    // texto libre: "Empresa", "Área", etc. — no es un enum fijo
  ruta      String   @unique
  activo    Boolean  @default(true)
  ...
  parent Nivel?  @relation("ArbolNiveles", fields: [parent_id], references: [id])
  hijos  Nivel[] @relation("ArbolNiveles")
}
```

Cada `Nivel` apunta a su propio padre (`parent_id`). La profundidad es ilimitada y el
`tipo` es texto libre a propósito — el sistema no asume una cantidad fija de niveles
ni nombres específicos (una empresa puede tener "Gerencia → Área → Departamento", otra
puede tener solo "Empresa → Área", conviven ambas estructuras).

`ruta` es una **ruta materializada**: una cadena tipo `/id_padre/id_hijo/` que se
recalcula cada vez que se crea o mueve un nodo. Es la pieza clave de todo el sistema
de permisos — se explica en la sección de `PermisoNivel` más abajo.

Árbol real hoy (simplificado, solo nombres):
```
Correo Flash (Empresa)
└── Operaciones (Área)

Havanna (Empresa)
└── Finanzas (Área)

Administración Central (Empresa)
├── Inversiones (Área)
└── Inversiones Inmobiliarias (Área)

Empresa 3 (Empresa, inactiva)
Empresa Pendiente (Empresa, inactiva)
```

### `Herramienta` y `HerramientaNivel` — publicación muchos a muchos

Las herramientas **no forman parte del árbol**. Se vinculan a nodos mediante una
tabla intermedia:

```prisma
model HerramientaNivel {
  herramienta_id String
  nivel_id       String
  activo         Boolean @default(true)

  @@unique([herramienta_id, nivel_id])
}
```

Es una relación **muchos a muchos** con un `activo` propio por cada vínculo — una
misma herramienta puede estar publicada en varios niveles a la vez, y publicarla o
despublicarla de un nivel puntual no afecta sus otras publicaciones.

**Ejemplo real de hoy**, que muestra exactamente para qué sirve esta flexibilidad:
"Reporte de Inversiones" e "Inversiones Inmobiliarias" son dos herramientas
distintas. Originalmente ambas colgaban del mismo nodo. Para poder diferenciar el
acceso entre dos personas —José Ricci necesitaba ver ambas, Estefanía Martínez solo
una— se creó un segundo nivel hijo ("Inversiones Inmobiliarias", Área) bajo
"Administración Central", y cada herramienta se publicó en su propio nivel:

```
Administración Central
├── Inversiones                  → publicada: "Reporte de Inversiones"
└── Inversiones Inmobiliarias    → publicada: "Inversiones Inmobiliarias"
```

Con esto, otorgar el permiso de un nivel u otro (ver abajo) alcanza para diferenciar
el acceso — sin tocar código, solo reconfigurando el árbol y las publicaciones desde
el panel de administración.

### `PermisoNivel` — permisos y la regla de cascada

```prisma
model PermisoNivel {
  usuario_id String
  nivel_id   String
  activo     Boolean @default(true)

  @@unique([usuario_id, nivel_id])
}
```

Los permisos se asignan sobre **nodos del árbol**, nunca directamente sobre
herramientas (regla de negocio explícita — asignar un permiso a una herramienta
puntual requeriría una decisión arquitectónica futura documentada, no existe hoy).

**Regla de cascada actual**: otorgar un permiso sobre un nodo habilita visibilidad y
acceso a **todo su subárbol**, sin distinción. Esto se implementa comparando la
`ruta` del nodo objetivo contra la `ruta` de cada nivel donde el usuario tiene
permiso, con `ruta.startsWith(...)`:

```
permiso en "Administración Central"  (ruta: /admin_central/)
        │
        ├── da acceso a → "Inversiones"                (ruta: /admin_central/inversiones/)
        └── da acceso a → "Inversiones Inmobiliarias"   (ruta: /admin_central/inv_inmob/)
```

Es decir: **hoy no existe forma de otorgar un nodo "solo para navegar/agrupar" sin
heredar automáticamente el acceso a todo lo que cuelga debajo.** Es una decisión de
diseño documentada desde el modelo de datos original, no un bug — evaluada como
posible cambio de arquitectura a futuro (no urgente), ver el detalle completo en
[`AUDITORIA_SEGURIDAD.md`](./AUDITORIA_SEGURIDAD.md#2-limitaciones-conocidas-y-aceptadas-decisiones-de-alcance-no-bugs).

---

## 3. Flujo de autorización

Hay **dos servicios que resuelven la misma pregunta desde dos ángulos distintos**, y
eso es importante tenerlo presente:

```
                    ┌─────────────────────────┐
                    │      PermisoNivel        │
                    │  (usuario ↔ nivel, ruta)  │
                    └────────────┬─────────────┘
                                 │
              ┌──────────────────┴──────────────────┐
              │                                      │
              ▼                                      ▼
  navegacion.service.ts                    accesos.service.ts
  "¿QUÉ SE MUESTRA?"                        "¿QUÉ ACCESO SE OTORGA DE VERDAD?"
  ─────────────────────                     ──────────────────────────────────
  getVisibleNodes()                         getHerramientasDisponibles()
  getNivelDetalle()                         verificarAccesoHerramienta()
  → arma el árbol/dashboard                 → decide si POST /api/accesos
  → decide qué niveles/cards                  entrega la URL real de la
    aparecen en la navegación                 herramienta
```

Ambos servicios usan **la misma lógica de cascada por `ruta.startsWith`** — es una
decisión consciente, no una casualidad. Pero al estar duplicada en dos archivos,
**la simetría entre ambos es crítica**: cualquier filtro adicional que se agregue en
uno (por ejemplo, "el nivel tiene que estar activo") tiene que replicarse
exactamente igual en el otro, o queda un hueco real de seguridad — no solo un
detalle cosmético.

Esto no es teórico: ya pasó. `getHerramientasDisponibles` filtraba correctamente por
`nivel.activo` desde el principio; `verificarAccesoHerramienta` no lo hacía. La UI
ocultaba la herramienta con normalidad al desactivar un nivel, pero el endpoint que
de verdad entrega la URL seguía funcionando para cualquiera con un permiso vigente.
Se corrigió (commit `d4e86fb`, detalle completo en `AUDITORIA_SEGURIDAD.md`), pero
sirve como advertencia concreta para quien toque cualquiera de estos dos archivos en
el futuro: **si cambiás un filtro en uno, revisá el otro.**

---

## 4. Autenticación y sesión

- **JWT** firmado por el backend en `POST /api/auth/login`, guardado hoy en
  `localStorage` del navegador (claves `toolbox_token` / `toolbox_user`). Es una
  limitación conocida y aceptada, no un bug — sin cookie httpOnly no hay protección
  adicional si alguna vez aparece un XSS. Detalle y motivo de por qué no se cambió
  todavía en `AUDITORIA_SEGURIDAD.md`.
- **Cambio de contraseña** (`PATCH /api/auth/password`, usuario ya logueado) y
  **recupero de contraseña** (`POST /api/auth/forgot-password` + `/reset-password`,
  sin sesión, vía link de un solo uso enviado por Resend) son dos flujos distintos
  que convergen en el mismo resultado: una contraseña elegida por el propio usuario.
- **`debe_cambiar_password`**: campo en `Usuario` que distingue una contraseña
  asignada por un admin (alta de usuario, o reset de contraseña de alguien
  existente) de una elegida por el propio usuario. Se pone en `true` al crear un
  usuario o al resetearle la contraseña desde el panel admin; se limpia a `false`
  automáticamente apenas el usuario cambia su contraseña por cualquiera de los dos
  caminos de arriba. El frontend muestra un banner no bloqueante en el dashboard
  mientras el flag sea `true`, con link directo a Configuración — desaparece solo,
  sin necesidad de volver a loguearse, apenas el cambio de contraseña responde bien.
- **Rate limiting por identidad, no por IP**: tanto `login` como
  `PATCH /api/auth/password` están protegidos con throttling (5 intentos/min), pero
  con criterios distintos a propósito. `login` trackea por IP porque todavía no se
  sabe qué cuenta se está atacando. `PATCH /api/auth/password` trackea por
  `user.sub` (el usuario ya está autenticado) — así cada cuenta tiene su propio
  cupo independiente, sin que usuarios detrás de la misma IP corporativa se
  bloqueen entre sí, y sin que alguien con un token robado pueda evadir el límite
  rotando de IP.
- **Cierre de sesión por inactividad** (`InactivityGuard`, montado dentro del
  `BrowserRouter` en `AppRouter.tsx`): 30 minutos sin actividad (mouse, teclado,
  click, scroll) cierran la sesión sola; a los 29 minutos aparece un aviso con
  cuenta regresiva de 1 minuto y un botón "Seguir conectado". Mientras el aviso
  está visible, la actividad pasiva ya no alcanza para extender la sesión — solo
  el clic explícito en el botón cuenta, a propósito (evita que alguien se aleje
  y el mouse de otra persona/proceso resetee el conteo sin que haya una decisión
  real de seguir conectado). Es una política 100% del lado del cliente — el JWT
  en sí sigue siendo válido contra la API hasta su expiración real de 8hs;
  cerrar sesión acá solo limpia el `localStorage` del navegador.

  **Caso borde conocido, sin resolver a propósito**: si Toolbox está abierto en
  **más de una pestaña** del mismo navegador, cada pestaña corre su propio timer
  de inactividad de forma independiente. Como el token vive en `localStorage`
  (compartido entre pestañas del mismo origen), la pestaña que quede inactiva va
  a cerrar la sesión igual — y eso también desloguea a la pestaña que sí estaba
  en uso activo, porque comparten el mismo `localStorage`. Se decidió aceptar
  este trade-off en vez de agregar coordinación entre pestañas (vía `storage`
  event o `BroadcastChannel`), por mantener la implementación simple. Si esto
  se vuelve un problema real en el uso diario, ahí es donde habría que mirar.

---

## 5. Auditoría

- **`historial_administracion`**: registra automáticamente las 13 acciones de
  escritura de los 4 módulos de administración (usuarios, niveles, herramientas,
  permisos), vía el decorator `@Auditable({ entidad, modelo, accion })` leído por un
  interceptor global (`AuditoriaInterceptor`). Guarda un snapshot redactado al crear,
  y un diff campo a campo al editar — `password_hash` y `reset_token` nunca se
  persisten ahí, se excluyen explícitamente.

  **Patrón importante**: un fallo al escribir el registro de auditoría **nunca**
  bloquea ni revierte la acción real del admin — se loguea el error del lado del
  servidor (swallow silencioso) y la operación de negocio sigue su curso. La
  prioridad es que la acción se ejecute; poder auditarla es secundario a que
  funcione.

- **`historial_accesos`**: un registro por cada apertura de herramienta
  (usuario, herramienta, fecha, IP, user agent). Tiene un job semanal (`@Cron`,
  `RetencionAccesosService`) que purga físicamente los registros con más de 12
  meses — es la única tabla del proyecto con borrado físico aceptado como
  excepción documentada a la regla general de "baja lógica, nunca física", por
  tratarse de un log de auditoría de accesos sin valor de negocio a largo plazo.

---

## 6. Alcance y límites del sistema

**Toolbox es un portal organizador de acceso a herramientas ya existentes — no es,
ni pretende ser, una capa de seguridad real (SSO) sobre esas herramientas.**

Cada herramienta que Toolbox publica (Control Havanna, Reporte de Inversiones,
Inversiones Inmobiliarias, CRM Reclamos Flash, y las que se agreguen) tenía su
propio login independiente antes de que existiera Toolbox, y lo sigue teniendo sin
ninguna modificación. El árbol de niveles y el sistema de permisos deciden **qué
aparece en la navegación de cada usuario** — no impiden que cualquier persona con
las credenciales propias de una herramienta entre directo por su URL, sin pasar por
Toolbox en absoluto.

Esta es una decisión explícita de Federico Vigo (14/7/2026), coherente con la
responsabilidad documentada del proyecto: TOOLBOX no absorbe la autenticación de las
aplicaciones que publica. El detalle completo de esta decisión, y las opciones que se
evaluarían si en el futuro se necesitara que Toolbox sí sea una barrera de seguridad
real, están en
[`AUDITORIA_SEGURIDAD.md`](./AUDITORIA_SEGURIDAD.md#toolbox-es-un-organizador-de-acceso-no-una-capa-de-seguridad-real-sso).

