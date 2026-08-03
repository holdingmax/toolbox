-- AlterTable
ALTER TABLE "proyectos_automatizacion" ADD COLUMN "estado_general" TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE "proyectos_automatizacion" RENAME COLUMN "notas" TO "observaciones";

-- CreateTable
CREATE TABLE "proyecto_automatizacion_etapas" (
    "id" TEXT NOT NULL,
    "proyecto_id" TEXT NOT NULL,
    "etapa" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'no_alcanzada',
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proyecto_automatizacion_etapas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "proyecto_automatizacion_etapas_proyecto_id_etapa_key" ON "proyecto_automatizacion_etapas"("proyecto_id", "etapa");

-- CreateIndex
CREATE INDEX "proyectos_automatizacion_estado_general_idx" ON "proyectos_automatizacion"("estado_general");

-- AddForeignKey
ALTER TABLE "proyecto_automatizacion_etapas" ADD CONSTRAINT "proyecto_automatizacion_etapas_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos_automatizacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
