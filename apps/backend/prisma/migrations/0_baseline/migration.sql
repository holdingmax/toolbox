-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol_id" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "reset_token" TEXT,
    "reset_token_expira" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "niveles" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "parent_id" TEXT,
    "tipo" TEXT NOT NULL,
    "ruta" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "icono_url" TEXT,
    "color_fondo" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "niveles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "herramientas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "url" TEXT NOT NULL,
    "icono_url" TEXT,
    "soporte" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "estado_servicio" TEXT NOT NULL DEFAULT 'desconocido',
    "ultima_verificacion" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "herramientas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "herramientas_niveles" (
    "id" TEXT NOT NULL,
    "herramienta_id" TEXT NOT NULL,
    "nivel_id" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "herramientas_niveles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permisos_niveles" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "nivel_id" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permisos_niveles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_accesos" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "herramienta_id" TEXT NOT NULL,
    "fecha_acceso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "historial_accesos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_administracion" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidad_id" TEXT NOT NULL,
    "cambios" JSONB,
    "ip" TEXT,
    "user_agent" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_administracion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_reset_token_key" ON "usuarios"("reset_token");

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

-- CreateIndex
CREATE INDEX "historial_administracion_usuario_id_fecha_idx" ON "historial_administracion"("usuario_id", "fecha");

-- CreateIndex
CREATE INDEX "historial_administracion_entidad_entidad_id_fecha_idx" ON "historial_administracion"("entidad", "entidad_id", "fecha");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "niveles" ADD CONSTRAINT "niveles_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "niveles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "herramientas_niveles" ADD CONSTRAINT "herramientas_niveles_herramienta_id_fkey" FOREIGN KEY ("herramienta_id") REFERENCES "herramientas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "herramientas_niveles" ADD CONSTRAINT "herramientas_niveles_nivel_id_fkey" FOREIGN KEY ("nivel_id") REFERENCES "niveles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permisos_niveles" ADD CONSTRAINT "permisos_niveles_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permisos_niveles" ADD CONSTRAINT "permisos_niveles_nivel_id_fkey" FOREIGN KEY ("nivel_id") REFERENCES "niveles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_accesos" ADD CONSTRAINT "historial_accesos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_accesos" ADD CONSTRAINT "historial_accesos_herramienta_id_fkey" FOREIGN KEY ("herramienta_id") REFERENCES "herramientas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_administracion" ADD CONSTRAINT "historial_administracion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

