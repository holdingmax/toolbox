# Auditoría de seguridad — TOOLBOX

Este documento resume el estado real de seguridad del proyecto: qué se encontró y se
corrigió, qué es una limitación de diseño aceptada a propósito (no un bug), y qué
queda pendiente de decisión. Está pensado para que cualquier persona que se sume al
proyecto entienda el terreno sin depender de que alguien se lo explique de palabra.

Se actualiza cada vez que se resuelve un hallazgo nuevo o se toma una decisión de
alcance relevante para seguridad — no es un documento de una sola vez.

---

## 1. Hallazgos resueltos

### Control de acceso

**`verificarAccesoHerramienta` no filtraba `nivel.activo`** — corregido, commit `d4e86fb`.
`POST /api/accesos` (el endpoint que efectivamente entrega la URL de una herramienta y
registra el acceso) no verificaba que el nivel donde está publicada la herramienta —ni
el nivel donde el usuario tiene el permiso— estuvieran activos. El listado de
herramientas disponibles (`getHerramientasDisponibles`) sí hacía ese filtro
correctamente, así que la UI ocultaba la herramienta con normalidad, pero el endpoint
real de acceso no reproducía esa misma regla: un usuario con permiso vigente podía
seguir abriendo una herramienta aunque el nivel que le daba ese acceso ya estuviera
desactivado (por ejemplo, al dar de baja una sucursal o empresa). Se agregó el mismo
filtro `nivel: { activo: true }` que ya usaba el listado, en las dos consultas de
`verificarAccesoHerramienta`. Reproducido el bug, corregido y verificado con un
control negativo (reactivar el nivel y confirmar que el acceso legítimo sigue
funcionando) contra el endpoint real en local-dev antes de commitear.

### Rate limiting

**`PATCH /api/auth/password` sin límite de intentos** — corregido, commit `658b899`.
A diferencia de `login`/`forgot-password`/`reset-password` (protegidos desde antes con
`LoginThrottlerGuard`, 5 intentos/min), el cambio de contraseña del propio usuario no
tenía ningún guard de throttling. Alguien con un JWT válido pero robado (sesión
filtrada, máquina compartida, token expuesto en un log) podía intentar fuerza bruta
contra la contraseña actual sin límite.

Se agregó `ChangePasswordThrottlerGuard`, mismo mecanismo (`@nestjs/throttler`,
5 req/min) pero con **tracking por usuario (`user.sub`) en vez de por IP**. La razón:
a diferencia de `login` —donde todavía no se sabe quién es el atacante y la IP es la
única señal disponible— acá el request ya llega autenticado, así que se puede (y
conviene) trackear por cuenta. Trackear por IP en este endpoint puntual tenía dos
problemas: en redes corporativas compartidas (oficina, NAT), los intentos fallidos de
un usuario cuentan contra el cupo de otro usuario detrás de la misma IP; y un atacante
que ya tiene el JWT puede rotar de IP (proxy/VPN) para resetear el contador y seguir
probando contra la misma cuenta indefinidamente. Verificado contra el endpoint real:
5 intentos responden normal, el 6° responde `429`, y un segundo usuario desde el mismo
origen no se ve afectado por el cupo agotado del primero.

**Bug relacionado, encontrado al probar el fix anterior** — corregido, commit `9e6a099`.
Al validar el rate limiting, se detectó que poner la contraseña actual mal en
`/configuracion` no mostraba el mensaje de error — deslogueaba silenciosamente sin
ninguna explicación visible. Causa: el interceptor de respuesta de axios
(`client.ts`) tiene una lista `RUTAS_SIN_REDIRECT` de endpoints cuyo 401 es un
resultado de negocio normal (credenciales inválidas), no una sesión expirada — pero
`/api/auth/password` no estaba en esa lista. Cualquier 401 de ese endpoint se trataba
como "sesión expirada": se borraba el token, se borraba el usuario, y se redirigía a
`/login` antes de que la pantalla pudiera mostrar el error. Es la misma clase de bug
ya corregida antes para `/api/auth/login` y `/api/auth/reset-password` — simplemente
faltaba agregar esta tercera ruta a la lista. Verificado con Puppeteer contra la UI
real: el banner de error se muestra, la sesión queda intacta, no hay redirect.

### Autenticación y contraseñas

- **JWT_SECRET sin fallback inseguro** — commit `3144e28`. El servidor se niega a
  arrancar si `JWT_SECRET` falta o tiene menos de 32 caracteres, en vez de usar un
  valor por defecto débil.
- **Rate limiting en login** — mismo commit `3144e28`. 5 intentos/min/IP vía
  `LoginThrottlerGuard` (ver arriba el detalle de por qué IP es la señal correcta ahí
  y no en cambio-de-contraseña).
- **`prisma/seed.ts` bloqueado contra producción** — commit `76de27b`. El script
  aborta si `DATABASE_URL` no corresponde a Neon (heurística: contiene `neon.tech`),
  salvo que se pase `ALLOW_SEED_PROD=yes` explícitamente. Existe porque el seed
  llegó a reactivar empresas dadas de baja y pisar datos reales en un incidente
  anterior.
- **Flujo de recupero de contraseña** — commits `aae226e` (backend), `ac16830`
  (frontend). Token crudo de 32 bytes (`crypto.randomBytes`), se almacena únicamente
  su hash SHA-256 (nunca el token en texto plano), expira a la hora, respuesta
  idéntica exista o no el email (anti-enumeración), invalidación de un solo uso
  (el token se anula tras usarse), y `reset_token`/`reset_token_expira` excluidos
  explícitamente de lo que guarda el registro de auditoría administrativa.
  Verificado de punta a punta con un email real recibido en producción.
- **Rotación de contraseñas de `admin@toolbox.com`** — sin commit (operación directa
  sobre la base, sin cambio de código). Contraseñas nuevas, aleatorias, distintas
  entre local-dev y producción, generadas y verificadas contra el endpoint real de
  login antes de guardarlas (en Bitwarden, no en archivos del repo).
- **Aviso de contraseña temporal pendiente de cambio** — commit `d15ea9c`. No es la
  corrección de una vulnerabilidad sino un refuerzo proactivo de higiene de
  contraseñas (sugerencia de Álvaro): un usuario nuevo, o alguien a quien un admin le
  reseteó la contraseña, ve un banner no bloqueante recomendándole cambiarla, con
  link directo a Configuración. El flag se limpia automáticamente tanto si el usuario
  cambia su contraseña desde Configuración como si la restablece vía el flujo de
  "olvidé mi contraseña" — en ambos casos la contraseña pasó a ser elegida por el
  propio usuario, no asignada por un tercero.

### Auditoría e higiene de datos

- **Registro de auditoría de acciones administrativas** (`historial_administracion`)
  — commit `2513e0b`. Los 13 endpoints de escritura de los 4 módulos admin
  (usuarios, niveles, herramientas, permisos) quedan auditados vía
  `@Auditable()` + `AuditoriaInterceptor` global. `password_hash` y `reset_token` se
  redactan explícitamente y nunca se persisten en el campo `cambios`, ni al crear ni
  al editar.
- **Retención automática de `historial_accesos`** — commit `51a4625`. Job semanal
  (`@Cron`) que purga físicamente registros de acceso con más de 12 meses. Es la
  única tabla del proyecto con borrado físico aceptado como excepción documentada a
  la regla general de "baja lógica, nunca física" — por ser un log de auditoría de
  accesos sin valor de negocio a largo plazo, no una entidad de negocio.
- **Poda de nodo vacío + filtro global de excepciones de Prisma** — commit `b38227e`.
  `getNivelDetalle` no verificaba que el nodo específicamente pedido (no solo sus
  hijos) tuviera contenido visible — accediendo por URL directa se podía llegar a un
  nodo que debería estar podado. Corregido para tratarlo igual que "no encontrado".
  De paso, se agregó un filtro global que mapea `P2002` (constraint única) → 409 y
  `P2025` (registro no encontrado) → 404, en vez de dejar pasar errores 500 genéricos
  de Prisma sin traducir.
- **Higiene general** — commit `a750183`: passwords de `seed.ts` movidas a variables
  de entorno obligatorias (sin default), `.env.example` trackeado en git (con `.env`
  real siempre ignorado), documentación corregida de "SQLite en desarrollo" a
  "PostgreSQL vía Neon" (reflejaba un estado viejo del proyecto).
- **Historial real de migraciones de Prisma** — commit `88f832d`. No es un hallazgo
  de seguridad en sí, pero se documenta acá porque tiene impacto indirecto: antes no
  había forma confiable de versionar ni auditar cambios de schema (se usaba
  `prisma db push` contra un historial de migraciones vestigial de la era SQLite,
  desincronizado de la realidad desde hacía semanas). Ahora hay un baseline real y
  `migrate deploy` en el build de producción.

---

## 2. Limitaciones conocidas y aceptadas (decisiones de alcance, no bugs)

### Toolbox es un organizador de acceso, no una capa de seguridad real (SSO)

Decisión explícita de Federico Vigo (14/7/2026): Toolbox filtra **qué aparece** en la
navegación según niveles y permisos, pero no es ni pretende ser la barrera de
seguridad de las herramientas que publica. Cada herramienta (Control Havanna, Reporte
de Inversiones, Inversiones Inmobiliarias, CRM Reclamos Flash) tenía su propio login
independiente antes de que existiera Toolbox, y lo sigue teniendo sin modificaciones.

Esto significa, en concreto: **cualquier persona con las credenciales propias de una
herramienta puede entrar directo por su URL, sin pasar por Toolbox y sin que el
sistema de niveles/permisos intervenga en absoluto.** El control de acceso de Toolbox
decide si un botón aparece en el menú de alguien — no impide que esa misma persona (u
otra con las credenciales correctas) llegue a la herramienta por su cuenta. Es
coherente con la responsabilidad documentada del proyecto ("TOOLBOX no interviene en
la autenticación de aplicaciones externas") y no se considera un hallazgo a resolver.

Si en el futuro se necesita que Toolbox sea una barrera de seguridad real (no solo
organizador), las opciones a evaluar serían: (a) SSO real con validación de token en
cada herramienta, (b) un gateway/proxy obligatorio delante de cada herramienta, o
(c) restricción de red/VPN. Ninguna está implementada ni planificada hoy.

### Cascada de permisos por nivel (todo o nada por rama)

`accesos.service.ts` y `navegacion.service.ts` verifican acceso comparando
`ruta.startsWith(permiso.nivel.ruta)`. Esto implica que otorgar un permiso sobre un
nivel padre da acceso a **todo** su subárbol — hoy no hay forma de otorgar un nivel
"solo para navegar/agrupar" sin heredar automáticamente el acceso a todo lo que cuelga
debajo. Es una decisión de arquitectura documentada desde el modelo de datos
original (regla: "otorgar un permiso sobre un nodo habilita visibilidad de TODO su
subárbol"), no un bug.

Se evaluó (14/7/2026) separar "mostrar en navegación" de "otorgar acceso real" como
cambio de arquitectura mayor — afecta los mismos 4 puntos del código que resuelven
hoy ambas cosas a la vez, requeriría un campo nuevo en `PermisoNivel` para no romper
los permisos ya existentes (17 de los 20 permisos activos en producción hoy dependen
de la cascada completa), y no tiene test automatizado que amortigüe el riesgo de
regresión. Se decidió no apurarlo — quedó pendiente de retomar más adelante con el
tiempo que un cambio en el mecanismo central de control de acceso necesita. El caso
puntual de negocio que lo había motivado (diferenciar el acceso de dos personas a dos
herramientas del mismo grupo) ya se resolvió con el mecanismo actual, separando esas
herramientas en niveles hermanos independientes — sin necesitar este cambio.

---

## 3. Pendientes de decisión (riesgo bajo, sin apuro)

- **`reset_token` expuesto en `GET /api/admin/usuarios`**: `UsuariosService.sanitize()`
  solo elimina `password_hash` de la respuesta — `reset_token` (el hash SHA-256, no
  el token crudo) y `reset_token_expira` viajan sin redactar en el listado y el
  detalle de usuarios del panel admin. No es explotable directamente (el hash no se
  puede revertir al token real), pero es inconsistente con que ese mismo campo sí se
  redacta explícitamente en el registro de auditoría (`CAMPOS_SENSIBLES` en
  `auditoria.interceptor.ts`). Fix sugerido: agregar `reset_token` y
  `reset_token_expira` a lo que `sanitize()` elimina, igual que `password_hash`.
- **JWT en `localStorage` en vez de cookie httpOnly**: no hay ningún vector de XSS
  activo detectado en el frontend (sin `dangerouslySetInnerHTML` en todo el código),
  así que no es un bug explotado hoy — es una falta de defensa en profundidad. Un XSS
  futuro (una dependencia, un campo de texto enriquecido sin sanitizar) permitiría
  robar la sesión completa sin ninguna mitigación, porque `localStorage` es legible
  por cualquier script que corra en la página. Cambiarlo es un cambio de arquitectura
  de autenticación mayor (cookies httpOnly + SameSite + posible CSRF token), no un
  parche chico — por eso queda como pendiente de decisión, no como fix inmediato.

---

## 4. Prácticas de seguridad vigentes (mantenerlas al tocar este código)

- **Consistencia entre capas de acceso**: cualquier filtro que aplique
  `navegacion.service.ts` para decidir qué se muestra debe reflejarse exactamente
  igual en `accesos.service.ts` para decidir qué acceso real se otorga (y viceversa).
  El hallazgo de `nivel.activo` de la sección 1 existió precisamente porque esto no
  se cumplía entre ambos archivos — no vuelvas a dejar que un filtro exista en un
  lado sin el espejo exacto en el otro.
- **Rate limiting por identidad de usuario cuando el request ya está autenticado, no
  por IP**: usar `req.ip` como clave de throttling es correcto solo cuando todavía no
  se conoce la identidad (login). En cualquier endpoint autenticado donde haga falta
  throttling, trackear por `user.sub` (ver `ChangePasswordThrottlerGuard`), nunca por
  IP — redes corporativas comparten IP entre muchos usuarios legítimos, y un atacante
  con sesión puede rotar de IP para evadir el límite.
- **Interceptor de axios — `RUTAS_SIN_REDIRECT`**: cualquier endpoint de auth que
  legítimamente pueda devolver 401 como resultado de negocio normal (credenciales
  inválidas, token de reset inválido/expirado, contraseña actual incorrecta) tiene
  que estar en esa lista en `client.ts`, o el interceptor lo va a tratar como sesión
  expirada y va a desloguear silencioso sin mostrar el error real. Si se agrega un
  endpoint nuevo bajo `/api/auth/` que pueda devolver 401 sin que eso signifique
  "la sesión expiró", agregarlo ahí.
- **Resiliencia del log de auditoría**: un fallo al escribir en
  `historial_administracion` nunca debe bloquear ni revertir la acción real del
  admin — se loguea el error del lado del servidor y se sigue. La acción de negocio
  (crear un usuario, cambiar un permiso, etc.) tiene prioridad sobre poder auditarla.
- **Anti-enumeración en endpoints de auth públicos**: `forgot-password` responde
  exactamente igual exista o no el email; los mensajes de error de auth no deben
  distinguir "el usuario no existe" de "la contraseña está mal" ni variantes que
  permitan a alguien de afuera inferir qué cuentas son reales.

---

## Sin hallazgos adicionales

Se revisó el código actual (incluyendo los cambios más recientes: el fix de
`verificarAccesoHerramienta`, el rate limiting de cambio de contraseña, y el flag
`debe_cambiar_password`) buscando específicamente algo nuevo que agregar acá. No se
encontró ningún hallazgo adicional más allá de los ya documentados en este archivo.
