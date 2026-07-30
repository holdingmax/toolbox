# Auditoría completa — TOOLBOX (julio 2026)

Auditoría de punta a punta pedida antes de decidir el deploy del módulo de
Proyectos de Automatización. **Documento 100% diagnóstico** — nada de lo
encontrado acá se corrigió durante esta auditoría. Las correcciones se
planifican después, una por una, con aprobación explícita previa.

**Estado de este documento**: varias secciones (marcadas explícitamente)
quedaron **pendientes de verificación contra producción** — necesito la
connection string de producción (de solo lectura) para cerrarlas. Todo lo
que no depende de producción está verificado y cerrado.

---

## ✅ Resuelto — antes era 🔴 Prioridad crítica

### 1. Estado real de la migración `debe_cambiar_password` en producción — RESUELTO

Causa raíz confirmada: el baseline (`0_baseline`, aplicado 2026-07-10
16:43:59) es **anterior** a la migración `20260713194857_add_debe_cambiar_password_usuario`
(2026-07-13) — por cronología, el baseline no podía incluir esa columna en su
`CREATE TABLE "usuarios"` (confirmado leyendo el archivo real: no la tiene).
`_prisma_migrations` en producción solo tenía la fila del baseline.

Al mismo tiempo, la columna `debe_cambiar_password` **sí existe** en la tabla
real de `usuarios` en producción (confirmado con `information_schema.columns`)
— se agregó en algún momento por afuera de Prisma Migrate (probablemente una
alteración manual o un `db push` viejo), sin quedar nunca registrada en la
tabla de bookkeeping. Era un desfasaje de metadata, no una columna faltante
de verdad — la hipótesis que habíamos planteado.

**Corrección aplicada** (operación de bookkeeping, cero SQL de negocio, mismo
mecanismo ya usado para el baseline): `npx prisma migrate resolve --applied 20260713194857_add_debe_cambiar_password_usuario`
corrido desde la Shell de Render, con salida `"Migration marked as applied"`.
Verificado después con `npx prisma migrate status`: `"Database schema is up
to date!"` — sin ninguna migración pendiente.

**Por qué esto era crítico y no cosmético**: sin esta corrección, el próximo
`npx prisma migrate deploy` (parte del build de todo Manual Deploy) hubiera
intentado ejecutar el `ALTER TABLE ADD COLUMN` de esa migración contra una
columna que ya existe — Postgres lo rechaza con error, y el build completo
del deploy falla ahí, **antes** de llegar a aplicar la migración nueva de
Proyectos de Automatización. Quedó resuelto antes de que eso pasara.

Backup adicional confirmado antes de tocar producción: export manual desde
Render (Recovery → Export), sumado al PITR de 7 días ya documentado en
`DEPLOY.md`.

---

## 🟠 Prioridad alta

### 2. `docs/AUDITORIA_SEGURIDAD.md` tiene una sección desactualizada de forma material — no un detalle menor

Repasé el documento completo contra el código actual. **9 de 11 afirmaciones
verificadas siguen exactas.** Dos NO:

- **La sección de `debe_cambiar_password`** describe el mecanismo como un
  *"banner no bloqueante... con link directo a Configuración"*. Esto dejó de
  ser así hace varios commits: hoy es un **bloqueo total obligatorio**
  (`MustChangePasswordGuard`, un `APP_GUARD` global que devuelve 403 en
  cualquier endpoint no exceptuado, más un redirect duro en el frontend a una
  pantalla de pantalla completa — no se puede usar nada de Toolbox hasta
  cambiar la contraseña). El documento incluso dice explícitamente, en su
  sección final "Sin hallazgos adicionales", que este flag ya fue revisado
  como parte de los cambios recientes — esa afirmación específica ya no es
  cierta, el documento no reflejó la escalada de banner a bloqueo real.
- **El conteo de auditoría** dice "13 endpoints... en 4 módulos admin". Hoy
  son **16 endpoints en 5 módulos** (el módulo nuevo de Proyectos de
  Automatización no está mencionado en absoluto).

**Por qué esto importa más allá de "un número desactualizado"**: es evidencia
de un patrón — cuando una feature evoluciona (banner → bloqueo duro), nadie
volvió a `AUDITORIA_SEGURIDAD.md` a actualizar la entrada correspondiente. El
documento fue preciso cuando se escribió, pero no hay ningún hábito de
revisarlo cuando el código que describe cambia después. Vale la pena tenerlo
presente para el resto de la documentación también (`ARQUITECTURA.md`,
`CONVENCIONES.md`), no solo para este archivo puntual.

### 3. Integridad de datos en producción — PARCIALMENTE VERIFICADO, sin hallazgos hasta el momento, resto pendiente de verificación no bloqueante

Corrido por la propia usuaria, con las queries de solo lectura preparadas
(Render Shell, sin exponer ninguna connection string):

- **Usuarios** (2/5 queries corridas): 9 en total — 8 activos, 1 inactiva
  (María García, baja lógica ya conocida y esperada). **Nadie tiene
  `debe_cambiar_password=true` pendiente hoy** — dato distinto al último
  estado documentado (que tenía a Estefanía Martínez y Jorge Artigas con el
  flag en `true`); lo más probable es que ambos ya hayan cambiado su
  contraseña temporal desde entonces, resolviendo el pendiente con
  normalidad — no es un hallazgo, es una actualización del estado conocido.
- **Niveles**: 9 en total — 7 activos, coincidiendo exactamente con la
  estructura real ya documentada (Correo Flash/Operaciones,
  Havanna/Finanzas, Administración Central/Inversiones e Inversiones
  Inmobiliarias) más los 2 inactivos ya sabidos ("Empresa 3", "Empresa
  Pendiente"). Sin nada nuevo o inesperado.

**Sin hallazgos en las 2 queries corridas.**

**Pendiente, no bloqueante** (decisión explícita: no justifica retrasar el
deploy, según el propio resumen ejecutivo de esta auditoría) — las 3 queries
restantes, ya preparadas para cuando se quiera retomar:
- Permisos huérfanos (`PermisoNivel` apuntando a un nivel inactivo con el
  permiso todavía activo).
- Herramientas publicadas en niveles inactivos.
- Publicaciones duplicadas o inactivas residuales de una misma herramienta.

---

## 🟡 Prioridad media

### 4. Cobertura de tests — confirmado: prácticamente cero, sin cambios

- **Backend**: un solo archivo de test en todo el proyecto,
  `apps/backend/src/app.controller.spec.ts` — prueba únicamente que el
  health-check raíz (`GET /`) devuelve `{status: 'ok'}`. Nada de `auth`,
  `accesos`, `navegacion`, ni ningún módulo de `admin/` tiene un solo test.
- **Frontend**: cero. No hay `vitest`/`jest`/`@testing-library` en
  `package.json`, ni un solo archivo `*.test.tsx` en todo `apps/frontend/src`.

**Partes críticas corriendo sin ninguna red automatizada**:
- Todo el flujo de autenticación (login, recupero de contraseña, cambio de
  contraseña, rate limiting, `MustChangePasswordGuard`).
- Toda la cascada de permisos (`PermisosNivelService`, `accesos.service.ts`,
  `navegacion.service.ts`) — el mecanismo que decide quién ve y accede a qué.
- El interceptor de auditoría (`AuditoriaInterceptor`) — si algo lo rompe en
  silencio, nadie se entera hasta que falta un registro en el historial.

Esto ya estaba documentado como hallazgo antes; sigue exactamente igual hoy,
sin ninguna mejora ni empeoramiento.

### 5. Estado de cada migración — local-dev cerrado, producción pendiente

**Local-dev, confirmado con una consulta real a `_prisma_migrations`:**

| Migración | Aplicada en local-dev | `finished_at` |
|---|---|---|
| `0_baseline` | ✅ Sí | 2026-07-10 |
| `20260713194857_add_debe_cambiar_password_usuario` | ✅ Sí | 2026-07-13 |
| `20260728194804_add_proyecto_automatizacion` | ✅ Sí | 2026-07-28 |

Las 3 migraciones existentes en el repo, las 3 aplicadas limpiamente en
local-dev, sin `rolled_back_at`, sin sorpresas.

**Producción: PENDIENTE** — ver hallazgo #1. No puedo completar esta tabla
para producción sin la connection string.

### 6. La inconsistencia de nomenclatura `-admin` sigue viva — y mi propio módulo nuevo la reprodujo, en una tercera variante

`CONVENCIONES.md` ya documenta que algunos módulos admin usan el sufijo
`-admin` en todos sus archivos (`niveles-admin.*`) y otros no lo usan en
ninguno (`usuarios.*`). Revisé mi propio módulo nuevo
(`admin/proyectos-automatizacion/`) y encontré que **inventé una tercera
variante**, sin querer:

```
proyectos-automatizacion.module.ts               ← sin sufijo
proyectos-automatizacion.service.ts               ← sin sufijo
proyectos-automatizacion-admin.controller.ts      ← CON sufijo
proyectos-automatizacion.controller.ts            ← sin sufijo (el de lectura)
```

No seguí ninguno de los dos patrones existentes de forma consistente. No es
grave (no afecta funcionamiento), pero sí es honesto reconocer que en vez de
resolver la inconsistencia ya documentada, agregué una variante más.

---

## 🟢 Decisiones de diseño ya aceptadas (no son bugs — confirmado que siguen vigentes)

Repasé estas contra el código actual, siguen exactamente como las documenta
`AUDITORIA_SEGURIDAD.md`:

- **JWT en `localStorage`**, no cookie httpOnly — confirmado sin cambios.
  Sigue sin haber ningún `dangerouslySetInnerHTML` en todo el frontend (grep
  completo, cero resultados), así que la falta de defensa en profundidad
  sigue sin ser un vector explotado hoy.
- **`reset_token`/`reset_token_expira` sin redactar** en
  `GET /api/admin/usuarios` — confirmado, `sanitize()` en
  `usuarios.service.ts` sigue eliminando únicamente `password_hash`.
- **Cascada de permisos todo-o-nada por rama** — confirmado sin cambios, y
  ahora extendida a un dominio más: el módulo de Proyectos de Automatización
  reutiliza la misma regla vía `PermisosNivelService` en vez de duplicarla,
  así que hereda esta misma limitación de diseño (aceptada) sin agregar una
  nueva.
- **Toolbox como organizador, no como SSO real** — sin cambios.
- **`verificarAccesoHerramienta` filtra por `nivel.activo`** — confirmado
  que el fix de la auditoría anterior sigue vigente en ambas queries.
- **Rate limiting por `user.sub` en cambio de contraseña, por IP en login**
  — confirmado sin cambios en ambos guards.
- **`JWT_SECRET`, seed.ts bloqueado contra producción, retención de 12 meses
  de `historial_accesos`, filtro global de errores de Prisma (P2002→409,
  P2025→404)** — los 4 confirmados sin cambios.

---

## 🔵 Otros hallazgos, no pedidos explícitamente pero relevantes

### 7. No hay forma de saber qué commit está realmente corriendo en producción sin adivinar ruta por ruta

Esta misma auditoría necesitó que yo probara manualmente rutas específicas
contra producción (`curl` sin credenciales, mirando 401 vs 404) para
aproximar qué tan actualizado está el deploy — no existe ningún endpoint que
lo diga directamente. Render expone automáticamente una variable de entorno
`RENDER_GIT_COMMIT` con el SHA del commit deployado, pero el código no la usa
en ningún lado (confirmé con grep, cero referencias a `RENDER_GIT_COMMIT` en
todo `apps/backend/src`).

**Sugerencia concreta** (no implementada, solo la dejo anotada): extender el
health-check (`GET /`) para incluir `commit: process.env.RENDER_GIT_COMMIT ?? 'local'`.
Es un cambio mínimo que hubiera resuelto en 5 segundos la incertidumbre de
hoy sobre qué versión está realmente en producción.

### 8. El patrón `catch {}` silencioso sigue siendo el estándar en el frontend, sin cambios de alcance

Ya documentado como hallazgo menor antes (en la sesión de Historial de
Administración). Reconfirmé el alcance: **13 bloques `catch` vacíos o con
solo un comentario** (`// ignorado`, `// manejado por interceptor`, etc.) en
`apps/frontend/src`. Sigue siendo el patrón consistente del proyecto, no algo
nuevo — lo dejo anotado acá para que quede en un solo lugar junto con el
resto, no disperso en distintas conversaciones.

### 9. Git sigue siendo una sola rama, sin PRs — confirmado, sin cambios

`git branch -a` solo muestra `main` (local y remota). Sigue siendo la
práctica documentada en `CONVENCIONES.md`: todo se commitea directo a main,
el control real pasa por el deploy manual, no por revisión de código.

---

## Resumen ejecutivo — qué hacer con esto

**El punto crítico (#1) ya está resuelto** — ver arriba. Con eso cerrado, no
queda ningún hallazgo de esta auditoría que bloquee el deploy de Proyectos de
Automatización. Los puntos #3 (integridad de datos en producción) y la parte
de #5 correspondiente a producción quedan como verificación adicional
recomendada, pero no como bloqueantes — el resto de los hallazgos son o bien
confirmado-y-sano, o confirmado-y-ya-documentado-como-aceptado, o una mejora
menor de documentación/nomenclatura sin urgencia.

Si en algún momento querés cerrar los puntos #3 y #5 con la misma certeza que
el #1, pasame la connection string de producción de solo lectura y los
completo.
