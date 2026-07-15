# Convenciones — TOOLBOX

Cómo escribir código consistente con el resto del proyecto. Todo lo que sigue está
observado directamente en el código real del repo (no es un ideal aspiracional) —
donde el código real es inconsistente, está marcado explícitamente como tal en vez
de inventar una regla que en la práctica no se sigue.

---

## 1. Naming

### Modelos de Prisma y dominio: en español

`Rol`, `Usuario`, `Nivel`, `Herramienta`, `HerramientaNivel`, `PermisoNivel`,
`HistorialAcceso`, `HistorialAdministracion` — todos los modelos y sus campos
(`nombre`, `activo`, `creado_en`, `ruta`, etc.) están en español, mapeados a tablas
`snake_case` también en español (`@@map("usuarios")`, `@@map("herramientas_niveles")`).
Es consistente en las 8 tablas del proyecto, sin excepción.

Variables y parámetros de código siguen el mismo criterio: términos de dominio en
español (`usuario`, `nivel`, `herramientaId`, `permisos`), estructura/sintaxis en
inglés (`camelCase`, palabras reservadas de TS/JS). Ejemplo real:
`verificarAccesoHerramienta(usuarioId: string, herramientaId: string)`.

### Archivos backend: kebab-case, `<recurso>.<tipo>.ts`

`usuarios.controller.ts`, `usuarios.service.ts`, `usuarios.module.ts` — patrón
consistente en los 8 módulos del backend. DTOs siguen `create-<recurso>.dto.ts` /
`update-<recurso>.dto.ts` para operaciones CRUD (`create-usuario.dto.ts`,
`update-nivel.dto.ts`), o el nombre de la acción para DTOs de auth
(`login.dto.ts`, `forgot-password.dto.ts`, `change-password.dto.ts`).

**Inconsistencia real, no corregida**: dentro de `admin/`, los módulos de niveles,
herramientas, permisos e historial usan el sufijo `-admin`
(`niveles-admin.controller.ts`, `herramientas-admin.service.ts`,
`permisos-admin.module.ts`, `historial-admin.controller.ts`), pero **usuarios y
roles no lo usan** (`usuarios.controller.ts`, no `usuarios-admin.controller.ts`;
`roles.controller.ts`, no `roles-admin.controller.ts`). No hay un criterio
documentado de por qué unos sí y otros no — si se toca alguno de estos módulos, no
asumir que hay una regla clara detrás del sufijo; es simplemente así hoy.

### Frontend: PascalCase para componentes/páginas, kebab-case en ningún lado

`DashboardPage.tsx`, `NivelPage.tsx`, `UsuariosPage.tsx` (bajo `pages/admin/` para
las de administración, directo en `pages/` para el resto) — el nombre del archivo
coincide siempre con el nombre del componente exportado. La capa de API sigue
`<dominio>.api.ts` en minúsculas (`auth.api.ts`, `admin.api.ts`, `navegacion.api.ts`).
No hay una carpeta `hooks/` separada — el único hook propio (`useAuth`) vive
co-ubicado en `contexts/AuthContext.tsx`, no en un archivo aparte.

---

## 2. Estructura de un módulo NestJS

Un módulo típico de administración (ejemplo real: `admin/niveles/`):

```
admin/niveles/
├── niveles-admin.module.ts       # wiring: controller + service como providers
├── niveles-admin.controller.ts   # rutas HTTP, decorators (@Roles, @Auditable)
├── niveles-admin.service.ts      # lógica de negocio, acceso a Prisma
└── dto/
    ├── create-nivel.dto.ts
    └── update-nivel.dto.ts
```

El controller es delgado: valida con el DTO (vía `class-validator`, `ValidationPipe`
global con `whitelist: true` y `forbidNonWhitelisted: true`) y delega todo al
service. El service es el único lugar que llama a `PrismaService` — no hay acceso a
Prisma desde controllers. Los módulos de administración (`niveles`, `herramientas`,
`permisos`, `historial`) llevan `@Roles('Administrador')` a **nivel de clase** en el
controller, cubriendo todos sus métodos de una sola vez.

---

## 3. Patrón `@Auditable()`

Se aplica a nivel de método, sobre cualquier endpoint que escriba (crear, editar,
dar de baja/reactivar) en los 4 módulos de administración — 13 endpoints en total
hoy. Ejemplo real (`niveles-admin.controller.ts`):

```ts
@Auditable({ entidad: 'nivel', modelo: 'nivel', accion: 'crear' })
@Post()
create(@Body() dto: CreateNivelDto) {
  return this.service.create(dto)
}

@Auditable({ entidad: 'nivel', modelo: 'nivel', accion: 'editar' })
@Patch(':id')
update(@Param('id') id: string, @Body() dto: UpdateNivelDto) {
  return this.service.update(id, dto)
}
```

`entidad` es la etiqueta que queda guardada en el registro de auditoría; `modelo` es
el nombre exacto del modelo de Prisma que el interceptor global usa para buscar el
estado "antes" del registro (no siempre coinciden — ej. `entidad: 'publicacion'`
mapea a `modelo: 'herramientaNivel'`). Si el endpoint usa un parámetro de ruta
distinto de `:id` (como `:pubId` en las publicaciones de herramientas), se indica
con `paramId`. Los endpoints de solo lectura (`GET`) nunca llevan `@Auditable()`.

`AuditoriaInterceptor` (global) redacta explícitamente `password_hash` y
`reset_token` de cualquier entidad `usuario` antes de persistir — si se agrega un
campo sensible nuevo a algún modelo auditado, sumarlo a `CAMPOS_SENSIBLES` en
`auditoria.interceptor.ts`.

---

## 4. Manejo de errores

### Backend: excepciones de NestJS lanzadas directo en el service

No hay una capa de errores custom — se usan las excepciones built-in de NestJS,
siempre con mensaje en español dirigido a mostrarse tal cual en la UI:

- `NotFoundException('X no encontrado/a')` — registro no encontrado. Consistente en
  los 4 módulos de administración y en `auth`/`accesos`/`navegacion`.
- `ConflictException('...')` — violación de regla de unicidad a nivel de
  aplicación (`'El email ya está registrado'`, `'La herramienta ya está publicada en
  ese nivel'`, `'El usuario ya tiene permiso sobre ese nivel'`) — se valida en el
  service antes de llegar a la base, no se depende solo del error de Postgres.
- `UnauthorizedException` — fallas de autenticación. A veces con mensaje
  (`'Credenciales inválidas'`, `'Token inválido o expirado'`) y a veces sin mensaje
  (los guards globales, ej. `jwt-auth.guard.ts`, lanzan `UnauthorizedException()`
  vacío).
- `ForbiddenException` — **inconsistencia real**: en `accesos.service.ts` y
  `navegacion.service.ts` se lanza vacía (`throw new ForbiddenException()`, sin
  mensaje) cuando un usuario no tiene acceso a un nivel/herramienta; en
  `roles.guard.ts` se lanza con mensaje (`'No tenés permiso para acceder a esta
  sección'`). No hay un criterio documentado de cuándo sí y cuándo no llevar
  mensaje en un 403 — si agregás un `ForbiddenException` nuevo, es una decisión
  libre hoy, no hay un patrón que copiar con seguridad.

Además, un **filtro global** (`PrismaExceptionFilter`) atrapa errores de Prisma que
se escapan sin manejar explícitamente: `P2002` (constraint única) → 409, `P2025`
(registro no encontrado) → 404. Es una red de seguridad, no reemplaza las
excepciones explícitas de arriba.

### Frontend: mismo patrón repetido en cada página con estado propio

No hay un manejador de errores centralizado más allá del interceptor de axios (ver
`RUTAS_SIN_REDIRECT`, sección 7). Cada página con un formulario de escritura repite
el mismo patrón (`UsuariosPage.tsx`, `NivelesPage.tsx`, `HerramientasPage.tsx`,
`PermisosPage.tsx`, `ConfiguracionPage.tsx` — 5 archivos, igual en todos):

```ts
catch (err: any) {
  const msg = err?.response?.data?.message ?? 'Ocurrió un error. Intentá de nuevo.'
  setError(Array.isArray(msg) ? msg.join(' · ') : msg)
}
```

El `Array.isArray` existe porque `class-validator` devuelve un array de mensajes
cuando falla más de una regla de validación a la vez — se muestran todos unidos con
`·`.

---

## 5. Convenciones de Git

**Mensajes de commit**: formato `tipo: descripción` o `tipo(alcance): descripción`,
siempre en minúscula el tipo, descripción en español. Confirmado consistente en los
31 commits del historial completo, sin excepción — tipos usados: `feat`, `fix`,
`docs`, `chore`. El alcance entre paréntesis es opcional y se usa de forma
inconsistente (a veces `fix(security): ...`, a veces `fix: ...` para algo igual de
específico) — no hay una regla clara de cuándo agregarlo, pero el prefijo de tipo en
sí es 100% consistente.

**Ramas**: no hay ninguna estrategia de branching en uso — el repo tiene una sola
rama, `main`, y **todo el historial se commitea directo ahí**. El control real sobre
qué llega a producción no pasa por ramas ni PRs, pasa por que el deploy es manual
(ver `DEPLOY.md`). Si el equipo crece, esto es candidato a revisar — hoy es
simplemente el estado real, no una decisión documentada en ningún lado.

**Flujo de trabajo** (esto sí es una práctica consistente observada en cómo se
trabajó todo el proyecto): mostrar el diff completo antes de commitear, confirmar
explícitamente antes de cada `git push`, y nunca hacer `git add -A` — se agregan los
archivos específicos de cada cambio, dejando afuera cualquier script o archivo
suelto que no pertenezca a ese commit puntual.

---

## 6. Frontend — estructura y patrones

- **Páginas** en `pages/` (autenticadas de uso general) y `pages/admin/`
  (requieren rol Administrador, protegidas además por el componente `AdminRoute` en
  el router). Cada página maneja su propio estado con `useState`/`useEffect` —
  no hay una librería de manejo de estado global (ni Redux ni Zustand ni similar).
- **Estado de sesión**: un único React Context (`AuthContext`), con `token` y
  `usuario` persistidos en `localStorage` (`toolbox_token` / `toolbox_user`).
  `AuthContext` expone `login()`, `logout()`, y `actualizarUsuario()` (este último
  para reflejar cambios del lado del cliente sin necesitar un nuevo login — ej.
  limpiar `debe_cambiar_password` apenas el usuario cambia su contraseña).
- **Capa de API** (`src/api/`): un archivo por dominio (`auth.api.ts`,
  `admin.api.ts`, `navegacion.api.ts`), cada función hace
  `client.<método>(url, ...).then((r) => r.data)` — el unwrap de `response.data`
  pasa siempre en la capa de API, nunca en el componente. Los tipos de
  request/response viven en el mismo archivo, no en una carpeta `types/` separada.
  Todas las rutas usan el prefijo `/api/...`.
- **`client.ts`**: instancia única de axios. Interceptor de request inyecta el
  Bearer token desde `localStorage`. Interceptor de response: cualquier 401 fuera
  de `RUTAS_SIN_REDIRECT` se trata como sesión expirada (borra `localStorage`,
  redirect duro a `/login`). Si agregás un endpoint de auth nuevo que pueda
  devolver 401 como resultado de negocio normal (no como sesión expirada), agregarlo
  a esa lista — ya hubo 3 bugs reales por olvidar esto (`login`, `reset-password`,
  `change-password`).
- **Sin librería de componentes compartida**: no existen `Button.tsx`, `Input.tsx`,
  `Modal.tsx`, etc. Cada página define sus propias constantes de clases Tailwind
  (`inputClass`, `sectionClass`) y repite el mismo patrón de modal
  (`fixed inset-0 bg-black/60 flex items-center justify-center z-50`) de forma
  independiente en cada archivo que lo necesita. No es un patrón a imitar por
  elegancia — es simplemente el estado actual; si se agregan más pantallas con
  formularios/modales, vale la pena evaluar extraer componentes compartidos en vez
  de seguir copiando el mismo bloque una vez más.

---

## 7. Reglas de negocio transversales

- **Los permisos se asignan solo sobre niveles, nunca directamente sobre
  herramientas** — asignar un permiso a una herramienta puntual requeriría una
  decisión arquitectónica futura explícita y documentada; hoy no existe ese camino
  en el código.
- **Los fallos de auditoría nunca bloquean la acción real**: si
  `AuditoriaInterceptor` falla al escribir en `historial_administracion`, se loguea
  el error del lado del servidor y la operación de negocio sigue — nunca se revierte
  ni se le devuelve un error al usuario por esto.
- **Simetría crítica entre `accesos.service.ts` y `navegacion.service.ts`**:
  ambos implementan la misma lógica de cascada de permisos por `ruta.startsWith`,
  pero en archivos separados — uno decide qué se muestra, el otro qué acceso se
  otorga de verdad. Cualquier filtro de seguridad que se agregue en uno (por
  ejemplo, `nivel.activo`) tiene que replicarse exactamente igual en el otro. Ya
  hubo un bug real de producción por no cumplir esto (`verificarAccesoHerramienta`
  no filtraba por nivel activo mientras `getHerramientasDisponibles` sí) — ver
  detalle completo en `AUDITORIA_SEGURIDAD.md` y `ARQUITECTURA.md`.
