# TOOLBOX — Referencia permanente de desarrollo

Este archivo es la fuente de verdad para cualquier sesión de desarrollo. Leerlo completo antes de proponer, diseñar o implementar cualquier cambio.

---

## Qué es TOOLBOX

TOOLBOX es el portal corporativo centralizado de acceso a herramientas y automatizaciones del Holding Max. Su función es:

- Autenticar usuarios dentro del portal.
- Construir dinámicamente la navegación según permisos.
- Mostrar únicamente las herramientas que cada usuario tiene habilitadas.
- Registrar y auditar accesos.
- Abrir la aplicación correspondiente en una ventana nueva.

TOOLBOX funciona como puerta de entrada, organizador y capa de control de acceso. **No es una aplicación de negocio.**

### Qué NO es responsabilidad de TOOLBOX

TOOLBOX no absorbe responsabilidades de las herramientas que publica. Cada herramienta conserva su propio login, su propia lógica de negocio, su propio modelo de datos y su propio ciclo de vida. TOOLBOX no interviene en la autenticación de aplicaciones externas.

---

## Contexto organizacional

El sistema será utilizado por un grupo empresario compuesto por múltiples empresas, unidades de negocio y áreas. Empresas identificadas inicialmente: Correo Flash, Havanna, Brillante. Pueden incorporarse más en el futuro.

Federico Vigo y la dirección definen qué personas tienen acceso y a qué herramientas. TOOLBOX debe pensarse como plataforma multiempresa y multiárea con permisos configurables.

---

## Regla central: VER ≠ ACCEDER

`permisos_niveles` controla únicamente qué recuadros se renderizan en la interfaz. El ingreso real a cada aplicación lo decide el login propio de esa app. TOOLBOX no interviene en ese proceso.

---

## Stack fijado — no cambiar

| Capa | Tecnología |
|---|---|
| Backend | NestJS + TypeScript |
| Base de datos (desarrollo) | PostgreSQL (Neon, branch `local-dev`) |
| Base de datos (producción) | PostgreSQL (Render) |
| Frontend | React + TypeScript + Vite |
| ORM | Prisma |
| Deploy | Render |
| Repositorio | GitHub HoldingMax (`holdingmax/toolbox`) |

**No ofrecer alternativas de stack. Está fijado.**

Desarrollo y producción son bases PostgreSQL separadas — nunca comparten datos.

### Nota Prisma 7

La versión instalada es Prisma 7. La URL de conexión ya no va en `schema.prisma` sino en `prisma.config.ts` (archivo en `apps/backend/`). El schema solo declara `provider`.

### Migraciones de schema (Prisma Migrate)

El proyecto tiene un historial real de migraciones en `apps/backend/prisma/migrations/`, baselineado contra el schema real tanto en desarrollo como en producción (ver commit `88f832d`).

- **Cambio de schema en local**: editar `schema.prisma` → `npx prisma migrate dev --name <descripcion>`. Esto genera la migración y la aplica automáticamente contra la base de desarrollo (Neon `local-dev`). Requiere `SHADOW_DATABASE_URL` configurada en `.env` (una branch de Neon dedicada, separada de `local-dev` — nunca la misma base). Commitear la carpeta de migración nueva junto con el cambio de código.
- **Producción**: nunca se toca el schema a mano ni se corre nada manualmente. El `buildCommand` de Render corre `npx prisma migrate deploy`, que aplica automáticamente cualquier migración pendiente en cada deploy.
- **`prisma db push` queda retirado para este proyecto.** No usarlo más, ni en desarrollo ni en el build de producción — todo cambio de schema debe pasar por una migración versionada y commiteada.

---

## Modelo de datos — respetar nombres exactos

```
roles(id PK, nombre, descripcion, activo)

usuarios(id PK, nombre, email único, password_hash, rol_id FK→roles, activo, creado_en, actualizado_en)

niveles(id PK, nombre, descripcion, parent_id FK→niveles, tipo, ruta, orden, icono_url, activo, creado_en, actualizado_en)

herramientas(id PK, nombre, descripcion, url, icono_url, orden, activo, creado_en, actualizado_en)

herramientas_niveles(id PK, herramienta_id FK, nivel_id FK, activo) — único(herramienta_id, nivel_id)

permisos_niveles(id PK, usuario_id FK, nivel_id FK, activo, creado_en, actualizado_en) — único(usuario_id, nivel_id)

historial_accesos(id PK, usuario_id FK, herramienta_id FK, fecha_acceso, ip, user_agent)
```

### Campos clave en `niveles`

- `parent_id`: relación jerárquica inmediata. Nivel raíz tiene `parent_id NULL`.
- `ruta`: ruta materializada (ej. `/id1/id8/id15/`). Debe recalcularse al crear o mover un nodo. Tiene índice para consultas de prefijo (`WHERE ruta LIKE '/id1/%'`).
- `tipo`: texto libre, no hardcodeado. Puede representar holding, empresa, gerencia, área, departamento, proyecto, región, sucursal, etc.

---

## Arquitectura del árbol y permisos

### Árbol organizacional

La estructura se representa con `niveles` autorecursivo vía `parent_id`. La profundidad es ilimitada. El sistema no asume cantidad fija de niveles ni nombres de nivel específicos.

### Herramientas y publicaciones

Las herramientas no forman parte del árbol. Se vinculan a nodos mediante `herramientas_niveles`. Una herramienta puede estar asociada a múltiples nodos.

### Permisos sobre ramas

Los permisos se asignan sobre nodos del árbol (`permisos_niveles`), no directamente sobre herramientas. Otorgar acceso a un nodo habilita visibilidad de todo su subárbol.

### Poda de ramas vacías

Un nodo se muestra en la interfaz solo si por debajo tiene al menos una herramienta activa y visible para el usuario.

---

## Reglas de negocio — nunca romper

1. El árbol de `niveles` es de profundidad ilimitada vía `parent_id`.
2. `niveles.ruta` es ruta materializada. Recalcular siempre al crear o mover un nodo.
3. Una herramienta puede colgar de uno o más nodos vía `herramientas_niveles`.
4. Otorgar un permiso sobre un nodo habilita visibilidad de TODO su subárbol.
5. Un nodo se muestra solo si por debajo hay al menos una herramienta visible y activa.
6. Baja lógica con campo `activo` en todas las tablas. **Nunca borrado físico.**
7. Registrar cada apertura en `historial_accesos` (usuario, herramienta, fecha, ip, user_agent).
8. Nada hardcodeado: empresas, niveles, herramientas, usuarios y URLs se cargan por configuración.
9. No asignar permisos directamente sobre herramientas salvo decisión arquitectónica futura explícita y documentada.
10. No crear pantallas específicas hardcodeadas para ninguna empresa.

---

## Lógica de navegación dinámica

1. Usuario inicia sesión en TOOLBOX.
2. Se calculan los niveles visibles: por cada fila de `permisos_niveles` del usuario, ese nodo más todo su subárbol (filas de `niveles` cuya `ruta` empieza con la ruta del nodo otorgado).
3. Pantalla de inicio: nodos raíz dentro del conjunto visible que tengan al menos una herramienta activa por debajo.
4. Al clickear un nodo: mostrar hijos visibles y recuadros de herramientas asociadas a ese nodo.
5. Al clickear una herramienta: registrar en `historial_accesos` y abrir URL en ventana nueva.

---

## Diseño de pantallas

### Estilo global
- Tema dark mode obligatorio en toda la aplicación.
- Fondo: `#0f1117`. Sidebar oscuro. Acentos en púrpura/violeta.
- Badges de estado: verde = Activo, rojo = Inactivo.
- Layout: sidebar izquierdo fijo + header superior + contenido principal.
- Todo se carga dinámicamente desde la API. Nada hardcodeado en el frontend.

### Pantalla 1 — Login
- Logo TOOLBOX centrado + tagline "Portal central de herramientas corporativas".
- Campos: Usuario, Contraseña (toggle ver/ocultar), checkbox "Recordarme", link "¿Olvidaste tu contraseña?".
- Botón "Ingresar →" en púrpura.
- Footer: HoldingMax con logo.

### Pantalla 2 — Home / Dashboard
- Header: logo TOOLBOX, ícono menú hamburguesa, badge "Empresa activa" con logo.
- Sidebar: Inicio, Mis Herramientas, Administración (expandible), Historial, Configuración.
- Saludo personalizado con nombre del usuario.
- Sección de empresas/niveles raíz con recuadros visuales (logo grande, nombre).
- Sección "Accesos rápidos": recuadros con ícono, nombre, descripción corta y flecha.
- Footer de usuario: avatar, nombre, rol.

### Pantalla 3 — Detalle / Acceso a herramienta
- Breadcrumb con navegación hacia atrás.
- Header: ícono, nombre de herramienta, badge "Activa".
- Descripción, URL visible, botón "Abrir herramienta →" en púrpura.
- Panel de información: empresa/nivel, área, última actualización.
- Al abrir: registrar en `historial_accesos` + abrir URL en ventana nueva.

### Pantalla 4 — Administración / Usuarios
- Tabla: ID, Nombre, Email, Rol, Estado, Acciones (editar, info).
- Botón "+ Nuevo usuario". Paginación.

### Pantalla 5 — Administración / Niveles (antes "Empresas / Áreas")
- Tabla: ID, Nombre, Tipo, Ruta, Nivel padre, Estado, Acciones.
- Botón "+ Nuevo nivel". Paginación.

### Pantalla 6 — Administración / Herramientas
- Tabla: ID, Nombre, URL (clickeable), Nivel(es), Estado, Acciones.
- Botón "+ Nueva herramienta". Paginación.

### Pantalla 7 — Administración / Permisos
- Asignación de niveles visibles por usuario.
- Sin borrado físico. Toggle activo/inactivo.

### Pantalla 8 — Historial de accesos
- Filtros: Usuario, Herramienta, Nivel, rango de fechas.
- Tabla: Fecha y hora, Usuario, Herramienta, Nivel, IP.
- Paginación.

### Pantalla 9 — Perfil / Configuración de usuario
- Panel "Información personal": avatar, nombre, email, rol (solo lectura).
- Panel "Cambiar contraseña": contraseña actual, nueva, confirmar.

---

## Orden de desarrollo

Respetar esta secuencia como dependencia de trabajo, no solo como lista de funcionalidades:

```
✅ 1.  Backend health check
✅ 2.  Frontend landing inicial
✅ 3.  Configuración base
✅ 4.  Prisma + PostgreSQL
✅ 5.  Modelo de datos inicial
✅ 6.  Autenticación
✅ 7.  Dashboard
✅ 8.  Navegación dinámica
✅ 9.  Administración de niveles (y usuarios)
✅ 10. Administración de herramientas
✅ 11. Publicaciones (herramientas_niveles)
✅ 12. Permisos
✅ 13. Historial de accesos
```

No avanzar a una etapa sin contar con las definiciones de las etapas anteriores.

---

## Metodología de Federico Vigo

El trabajo debe realizarse en este orden conceptual:

1. Comprender el problema.
2. Definir el producto.
3. Diseñar la arquitectura.
4. Modelar el dominio.
5. Diseñar la base de datos.
6. Diseñar la experiencia de usuario.
7. Recién entonces implementar.

**Nunca comenzar a programar sin comprender antes el problema, sus reglas y el impacto de la solución.**

---

## Criterio para evaluar cualquier cambio

Antes de implementar, responder con claridad:

1. ¿Qué problema resuelve el cambio?
2. ¿Pertenece realmente a la responsabilidad de TOOLBOX?
3. ¿Puede resolverse mediante configuración en lugar de hardcodeo?
4. ¿Qué entidades, relaciones, permisos y reglas de dominio afecta?
5. ¿Cómo se audita?
6. ¿Sigue funcionando con nuevos tipos y cantidades de niveles organizacionales?
7. ¿Mantiene desacopladas las herramientas publicadas?
8. ¿Es compatible con PostgreSQL en desarrollo (Neon) y en producción (Render)?

Si un requerimiento contradice alguna regla: **señalar el conflicto y proponer alternativa antes de implementar.**

---

## Preguntas abiertas (pendientes de validar con Federico Vigo / Jorge Artigas)

- ¿Un usuario puede pertenecer a varios nodos raíz (varias empresas)?
- ¿Quién será administrador inicial de TOOLBOX?
- ¿Se requerirá recuperación de contraseña en el MVP?
- ¿Se utilizará SSO o autenticación unificada en el futuro?
- ¿Qué nivel mínimo de auditoría se requiere para el MVP?
- ¿Las herramientas pueden pertenecer a múltiples niveles simultáneamente?

---

## Estructura del repositorio

```
toolbox/
├── apps/
│   ├── backend/          # API NestJS
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── prisma.config.ts
│   │   └── src/
│   └── frontend/         # React + Vite + TypeScript
├── AGENTS.md             # Contexto adicional de arquitectura
└── CLAUDE.md             # Este archivo
```
