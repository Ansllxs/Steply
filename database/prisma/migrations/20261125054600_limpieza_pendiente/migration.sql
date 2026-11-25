-- Imágenes cuya referencia ya se eliminó y falta borrarlas del almacenamiento.
CREATE TABLE "limpiezas_pendientes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "public_id" VARCHAR(255) NOT NULL,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "limpiezas_pendientes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "limpiezas_pendientes_public_id_key" ON "limpiezas_pendientes"("public_id");
