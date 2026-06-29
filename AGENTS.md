# TOOLBOX — Contexto permanente de desarrollo

## Propósito de este documento

Este archivo establece el contexto funcional, arquitectónico y metodológico que debe respetar toda persona o agente de IA que trabaje en TOOLBOX. Antes de proponer, diseñar o implementar un cambio, se debe comprobar que sea coherente con estas reglas.

## Qué es TOOLBOX

TOOLBOX es el portal corporativo de acceso a herramientas y automatizaciones del Holding Max.

Su responsabilidad es:

- autenticar usuarios dentro del portal;
- construir dinámicamente la navegación disponible;
- mostrar únicamente las herramientas que cada usuario tiene permitido ver;
- registrar y auditar accesos y demás acciones relevantes;
- abrir la aplicación correspondiente.

TOOLBOX funciona como puerta de entrada, organizador y capa de control de acceso. No es una aplicación de negocio.

## Qué no es responsabilidad de TOOLBOX

TOOLBOX no debe absorber las responsabilidades de las herramientas que publica. Cada herramienta conserva:

- su propio inicio de sesión;
- su propia lógica de negocio;
- su propio modelo de datos;
- su propio ciclo de vida;
- su propia evolución y despliegue.

Por lo tanto, TOOLBOX no debe contener lógica de negocio perteneciente a esas aplicaciones ni acoplar su funcionamiento interno al del portal.

## Metodología de Federico Vigo

El trabajo debe realizarse en este orden conceptual:

1. Comprender el problema.
2. Definir el producto.
3. Diseñar la arquitectura.
4. Modelar el dominio.
5. Diseñar la base de datos.
6. Diseñar la experiencia de usuario.
7. Recién entonces implementar.

Nunca se debe comenzar a programar sin comprender antes el problema, sus reglas y el impacto de la solución.

## Arquitectura general

### Estructura organizacional

La estructura organizacional se representa mediante un árbol configurable y de profundidad variable. Un nodo puede representar, entre otros conceptos presentes o futuros:

- Holding;
- Empresa;
- Gerencia;
- Área;
- Departamento;
- Proyecto;
- Región;
- Sucursal.

El sistema no debe asumir una cantidad fija de niveles ni depender de nombres de niveles específicos.

Cada nivel o nodo debe incluir, como mínimo:

- `id`;
- `parent_id`;
- `ruta_materializada`.

`parent_id` expresa la relación jerárquica inmediata. `ruta_materializada` permite identificar y consultar eficientemente la rama y sus descendientes.

### Herramientas y publicaciones

Las herramientas no forman parte del árbol organizacional. Se vinculan con sus niveles mediante una entidad intermedia denominada **Publicación**.

Una publicación representa que una herramienta está disponible en un nodo determinado y contiene la configuración necesaria para esa disponibilidad. La navegación solo debe considerar publicaciones activas.

### Permisos

Los permisos se asignan sobre ramas del árbol organizacional, no directamente sobre herramientas. Cuando un usuario recibe acceso a un nodo, obtiene automáticamente acceso efectivo a sus descendientes.

No se deben asignar permisos directamente sobre herramientas salvo que una decisión arquitectónica futura, explícita y documentada, modifique este criterio.

### Navegación dinámica

La navegación debe construirse en tiempo de ejecución a partir de la intersección de:

1. la estructura organizacional;
2. las publicaciones activas;
3. los permisos efectivos del usuario.

La interfaz no debe codificar menús, empresas, áreas, sucursales ni herramientas de manera fija.

### Auditoría

Toda acción relevante debe poder auditarse. Como mínimo, los accesos a herramientas deben conservar información suficiente para identificar quién accedió, a qué recurso y cuándo. El modelo deberá permitir ampliar la auditoría sin rediseñar el sistema.

## Reglas que nunca deben romperse

- Comprender el problema antes de implementar.
- Priorizar configuración antes que código.
- Evitar hardcodeos de estructura, navegación, empresas, niveles y herramientas.
- Pensar primero en tablas, relaciones, reglas de dominio y restricciones.
- Mantener las herramientas desacopladas del portal.
- No guardar en TOOLBOX lógica de negocio propia de las herramientas.
- Hacer auditable toda acción relevante.
- Permitir nuevas empresas, áreas, sucursales, niveles y herramientas sin rediseño estructural.
- No asumir una cantidad fija de niveles organizacionales.
- No crear pantallas específicas hardcodeadas para una empresa.
- No asignar permisos directamente sobre herramientas salvo una decisión arquitectónica futura explícita y documentada.
- Mantener la compatibilidad conceptual entre SQLite en desarrollo y PostgreSQL en producción.
- No avanzar a una etapa de desarrollo sin contar con las definiciones necesarias de las etapas anteriores.

Si un requerimiento contradice alguna de estas reglas, no debe implementarse silenciosamente: primero se debe señalar el conflicto y proponer una alternativa compatible con la arquitectura.

## Stack técnico

- Arquitectura de repositorio: monorepo simple.
- Backend: NestJS.
- Frontend: React, Vite y TypeScript.
- Base de datos de desarrollo: SQLite.
- Base de datos prevista para producción: PostgreSQL.
- Repositorio: `holdingmax/toolbox`.
- Plataforma de despliegue: Render.

## Estructura del repositorio

```text
apps/
├── backend/   # API y servicios del portal en NestJS
└── frontend/  # Interfaz web en React + Vite + TypeScript
```

Las herramientas externas publicadas en el portal no deben incorporarse como módulos de negocio dentro de estas aplicaciones.

## Orden correcto de desarrollo

El desarrollo del producto debe avanzar en el siguiente orden:

1. Backend health check.
2. Frontend landing inicial.
3. Configuración base.
4. Prisma + SQLite.
5. Modelo de datos inicial.
6. Autenticación.
7. Dashboard.
8. Navegación dinámica.
9. Administración de niveles.
10. Administración de herramientas.
11. Publicaciones.
12. Permisos.
13. Historial de accesos.

Este orden es una dependencia de trabajo, no solo una lista de funcionalidades. Cualquier cambio debe ubicarse en la etapa que le corresponde y respetar las decisiones de arquitectura y dominio ya definidas.

## Criterio para futuros cambios

Antes de implementar, se debe poder responder con claridad:

1. ¿Qué problema resuelve el cambio?
2. ¿Pertenece realmente a la responsabilidad de TOOLBOX?
3. ¿Puede resolverse mediante configuración en lugar de hardcodeo?
4. ¿Qué entidades, relaciones, permisos y reglas de dominio afecta?
5. ¿Cómo se audita?
6. ¿Sigue funcionando con nuevos tipos y cantidades de niveles organizacionales?
7. ¿Mantiene desacopladas las herramientas publicadas?
8. ¿Es compatible con SQLite y con la futura migración a PostgreSQL?

Solo después de validar estos puntos corresponde diseñar e implementar la solución.
