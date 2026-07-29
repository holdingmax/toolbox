-- CreateTable
CREATE TABLE "proyectos_automatizacion" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "fecha_inicio" TIMESTAMP(3),
    "notas" TEXT,
    "nivel_id" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proyectos_automatizacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "proyectos_automatizacion_nivel_id_activo_idx" ON "proyectos_automatizacion"("nivel_id", "activo");

-- CreateIndex
CREATE INDEX "proyectos_automatizacion_estado_idx" ON "proyectos_automatizacion"("estado");

-- AddForeignKey
ALTER TABLE "proyectos_automatizacion" ADD CONSTRAINT "proyectos_automatizacion_nivel_id_fkey" FOREIGN KEY ("nivel_id") REFERENCES "niveles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
