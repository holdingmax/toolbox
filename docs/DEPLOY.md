# Deploy — TOOLBOX

Cómo se despliega Toolbox a producción. Es un paso sensible (base de datos real,
usuarios reales) — leer completo antes de tocar nada, no improvisar sobre la marcha.

---

## 1. Modelo de deploy: MANUAL, no automático

**El deploy a producción se dispara a mano, desde el dashboard de Render (Manual
Deploy). No se dispara solo con cada push a `main`.** Un push a `main` deja el
código listo para desplegar, pero no lo despliega por sí solo — alguien tiene que
entrar al dashboard y disparar el deploy explícitamente, en el momento que se decida.

Esto es intencional: separa "el código está listo" de "el código está en
producción", para tener control deliberado sobre cuándo se libera un cambio — no
depender de que un push (que puede pasar en cualquier momento, incluso por error)
dispare automáticamente algo contra la base real y los usuarios reales.

**Nota de verificación honesta**: el `render.yaml` de este repo no tiene seteado
`autoDeploy: false` explícitamente. Si el comportamiento manual está garantizado hoy,
es porque está configurado del lado del dashboard de Render (Settings → Auto-Deploy),
no en este archivo. **Confirmar ese setting en el dashboard** si hay alguna duda —
no asumir que "manual" está protegido solo porque así se viene trabajando hasta
ahora.

---

## 2. `render.yaml` — qué hace el build real

```yaml
buildCommand: >-
  cd apps/frontend && npm install --include=dev && npm run build &&
  cd ../backend && npm install --include=dev &&
  npx prisma generate &&
  npx prisma migrate deploy &&
  npm run build
startCommand: node apps/backend/dist/main.js
```

En orden: instala y buildea el frontend, instala el backend, regenera el cliente de
Prisma, **aplica las migraciones pendientes con `migrate deploy`**, y recién ahí
buildea el backend. `migrate deploy` es el comando pensado para CI/CD: no usa shadow
database, no pregunta nada de forma interactiva, y solo aplica en orden las
migraciones que ya existen en `prisma/migrations/` — no genera nada nuevo.

**Esto reemplazó a `prisma db push`**, que se usó desde el cambio a PostgreSQL hasta
julio 2026. El proyecto tiene ahora un historial real de migraciones, baselineado
contra el schema real de producción, y verificado en el primer deploy real con este
comando (confirmado en los logs: sin migraciones pendientes que aplicar, arrancó
limpio).

**Riesgo real y concreto si alguien revierte esto a `db push`**: se pierde por
completo el control de versionado de schema. `db push` sincroniza el schema
directamente sin dejar ningún registro de qué cambió ni cuándo, puede generar
advertencias de posible pérdida de datos sin que quede ningún historial para
auditar después, y puede terminar en que local-dev y producción tengan estructuras
distintas sin que nada lo detecte automáticamente — exactamente el problema que
existía antes de julio 2026 y que se resolvió a propósito. **No revertir esta línea
del build command sin una razón documentada y discutida.**

---

## 3. Checklist pre-deploy

Antes de disparar un Manual Deploy, confirmar:

- [ ] **Si hay cambio de schema**: la migración correspondiente ya se generó con
      `npx prisma migrate dev --name ...` en local, se aplicó y se probó contra
      `local-dev`, y la carpeta de la migración nueva está commiteada — no alcanza
      con haber editado `schema.prisma`, tiene que existir el archivo de migración
      real en el repo.
- [ ] **Ningún cambio de schema sin su migración**: si `schema.prisma` cambió pero
      no hay una migración nueva en `prisma/migrations/` para ese cambio, `migrate
      deploy` no va a aplicar nada — producción queda desincronizada del código sin
      ningún error visible en el momento del deploy.
- [ ] **Variables de entorno nuevas, si el cambio las necesita**: `render.yaml` solo
      declara `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `NODE_ENV`,
      `FRONTEND_URL`. Cualquier otra (`RESEND_API_KEY`, `MAIL_FROM`, o lo que se
      agregue a futuro) hay que cargarla a mano en el dashboard de Render **antes**
      de que el código que la usa llegue a producción — si no, el feature falla en
      producción aunque local-dev funcione perfecto.
- [ ] El commit que se va a desplegar ya pasó por el flujo normal de esta
      conversación: diagnóstico → diff mostrado → aprobado → probado en local-dev →
      commiteado. No desplegar algo que no se probó primero contra `local-dev`.

---

## 4. Proceso de deploy paso a paso

1. Confirmar que el checklist de la sección 3 está completo.
2. Entrar al dashboard de Render → el servicio `toolbox` → botón **Manual Deploy**
   → **Deploy latest commit** (toma el último commit de la rama conectada, `main` —
   no un commit específico elegido a mano salvo que se use la opción de deploy de
   un commit anterior).
3. Seguir los logs del build en tiempo real desde el dashboard. Confirmar que:
   - El build del frontend y del backend terminan sin errores.
   - El paso de `npx prisma migrate deploy` corre y **no tira ningún error** —
     si hay migraciones pendientes las aplica una por una y lo reporta; si no hay
     ninguna pendiente, lo indica sin aplicar nada (esto es lo esperado en la
     mayoría de los deploys que no tocan schema).
   - El proceso levanta al final (`node apps/backend/dist/main.js`) y el servicio
     pasa a estado **Live**.
4. Verificación post-deploy: probar un login real y abrir alguna herramienta,
   confirmar que el sitio responde en la URL de producción. Si el deploy incluyó un
   cambio de schema, verificar directamente contra la base de producción (de solo
   lectura) que la migración se aplicó — mismo criterio que se usó para el baseline
   de julio 2026.

---

## 5. Bases de datos — separación estricta

Local-dev (Neon) y producción (Render) son **bases completamente independientes**.
Nunca comparten datos, nunca se tocan cruzadas. Esto no es solo una buena práctica
general — es una regla operativa concreta de este proyecto:

- **Jamás correr una migración, un script, o cualquier comando apuntando a la
  connection string de producción sin haber seguido antes el flujo completo**:
  diagnóstico (qué se va a hacer y por qué) → plan mostrado y aprobado → prueba
  real contra local-dev primero → recién ahí, con confirmación explícita, contra
  producción.
- Ningún script de un solo uso se deja commiteado apuntando a producción — se
  escribe, se corre, se verifica el resultado, y se borra. `prisma/seed.ts` en
  particular tiene una traba propia que aborta si `DATABASE_URL` no parece ser de
  desarrollo (no contiene `neon.tech`), justamente para evitar correrlo por error
  contra producción — no confiar únicamente en esa traba como excusa para no
  verificar manualmente antes de cualquier operación.

---

## 6. Rollback

**Del lado de Render**: se puede volver a un deploy anterior desde el historial de
deploys del dashboard (redesplegar un commit previo). Esto revierte el código y el
build, pero **no revierte la base de datos**.

**Limitación real de las migraciones de Prisma**: no hay rollback automático. Si una
migración ya corrió contra producción (`migrate deploy` la aplicó), volver atrás el
código a un commit anterior **no deshace el cambio de schema** — la migración ya se
ejecutó, la tabla/columna ya existe (o ya se borró, según el caso) en la base real.

Si hace falta revertir un cambio de schema que ya llegó a producción, la única forma
correcta es **escribir una migración nueva que revierta el cambio** (por ejemplo,
una migración que borra la columna que agregó la migración anterior), generarla con
`migrate dev` en local, probarla, y desplegarla igual que cualquier otro cambio —
nunca editar o borrar a mano una migración ya aplicada, y nunca tocar la estructura
de producción directamente para "deshacer" algo fuera del flujo de migraciones.
