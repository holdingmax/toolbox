-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol_id" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL,
    CONSTRAINT "usuarios_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "niveles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "parent_id" TEXT,
    "tipo" TEXT NOT NULL,
    "ruta" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "icono_url" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL,
    CONSTRAINT "niveles_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "niveles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "herramientas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "url" TEXT NOT NULL,
    "icono_url" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "herramientas_niveles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "herramienta_id" TEXT NOT NULL,
    "nivel_id" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "herramientas_niveles_herramienta_id_fkey" FOREIGN KEY ("herramienta_id") REFERENCES "herramientas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "herramientas_niveles_nivel_id_fkey" FOREIGN KEY ("nivel_id") REFERENCES "niveles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "permisos_niveles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuario_id" TEXT NOT NULL,
    "nivel_id" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" DATETIME NOT NULL,
    CONSTRAINT "permisos_niveles_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "permisos_niveles_nivel_id_fkey" FOREIGN KEY ("nivel_id") REFERENCES "niveles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "historial_accesos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuario_id" TEXT NOT NULL,
    "herramienta_id" TEXT NOT NULL,
    "fecha_acceso" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "user_agent" TEXT,
    CONSTRAINT "historial_accesos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "historial_accesos_herramienta_id_fkey" FOREIGN KEY ("herramienta_id") REFERENCES "herramientas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_rol_id_idx" ON "usuarios"("rol_id");

-- CreateIndex
CREATE INDEX "usuarios_activo_idx" ON "usuarios"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "niveles_ruta_key" ON "niveles"("ruta");

-- CreateIndex
CREATE INDEX "niveles_parent_id_activo_orden_idx" ON "niveles"("parent_id", "activo", "orden");

-- CreateIndex
CREATE INDEX "niveles_ruta_idx" ON "niveles"("ruta");

-- CreateIndex
CREATE INDEX "niveles_tipo_idx" ON "niveles"("tipo");

-- CreateIndex
CREATE INDEX "herramientas_activo_idx" ON "herramientas"("activo");

-- CreateIndex
CREATE INDEX "herramientas_niveles_nivel_id_activo_idx" ON "herramientas_niveles"("nivel_id", "activo");

-- CreateIndex
CREATE INDEX "herramientas_niveles_herramienta_id_activo_idx" ON "herramientas_niveles"("herramienta_id", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "herramientas_niveles_herramienta_id_nivel_id_key" ON "herramientas_niveles"("herramienta_id", "nivel_id");

-- CreateIndex
CREATE INDEX "permisos_niveles_nivel_id_activo_idx" ON "permisos_niveles"("nivel_id", "activo");

-- CreateIndex
CREATE INDEX "permisos_niveles_usuario_id_activo_idx" ON "permisos_niveles"("usuario_id", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "permisos_niveles_usuario_id_nivel_id_key" ON "permisos_niveles"("usuario_id", "nivel_id");

-- CreateIndex
CREATE INDEX "historial_accesos_usuario_id_fecha_acceso_idx" ON "historial_accesos"("usuario_id", "fecha_acceso");

-- CreateIndex
CREATE INDEX "historial_accesos_herramienta_id_fecha_acceso_idx" ON "historial_accesos"("herramienta_id", "fecha_acceso");
