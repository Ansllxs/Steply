-- Extensión necesaria para la restricción EXCLUDE de pausas (uuid + rango de fechas).
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "rol_global" AS ENUM ('USUARIO', 'ADMIN_GENERAL');

-- CreateEnum
CREATE TYPE "estado_cuenta" AS ENUM ('ACTIVA', 'SUSPENDIDA');

-- CreateEnum
CREATE TYPE "estado_amistad" AS ENUM ('PENDIENTE', 'ACEPTADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "rol_grupo" AS ENUM ('ADMIN', 'INTEGRANTE');

-- CreateEnum
CREATE TYPE "estado_invitacion" AS ENUM ('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'REVOCADA');

-- CreateEnum
CREATE TYPE "tipo_reto" AS ENUM ('PERSONAL', 'GRUPAL');

-- CreateEnum
CREATE TYPE "frecuencia" AS ENUM ('DIARIA', 'SEMANAL', 'DIAS_ESPECIFICOS');

-- CreateEnum
CREATE TYPE "estado_reto" AS ENUM ('ACTIVO', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "estado_participante" AS ENUM ('ACTIVO', 'PAUSADO', 'ABANDONADO', 'REMOVIDO');

-- CreateEnum
CREATE TYPE "estado_registro" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "periodo_castigo" AS ENUM ('SEMANAL', 'AL_FINALIZAR');

-- CreateEnum
CREATE TYPE "tipo_movimiento" AS ENUM ('CUMPLIMIENTO', 'INCUMPLIMIENTO', 'CASTIGO', 'BONO_RACHA', 'AJUSTE_ADMIN');

-- CreateEnum
CREATE TYPE "criterio_insignia" AS ENUM ('RACHA', 'PUNTOS_TOTALES', 'RETOS_COMPLETADOS', 'RETOS_GANADOS');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "correo" VARCHAR(254) NOT NULL,
    "password_hash" VARCHAR(100) NOT NULL,
    "foto_url" VARCHAR(500),
    "foto_public_id" VARCHAR(255),
    "descripcion" VARCHAR(500),
    "rol" "rol_global" NOT NULL DEFAULT 'USUARIO',
    "estado" "estado_cuenta" NOT NULL DEFAULT 'ACTIVA',
    "zona_horaria" VARCHAR(64) NOT NULL DEFAULT 'America/Costa_Rica',
    "puntos_totales" INTEGER NOT NULL DEFAULT 0,
    "ultimo_acceso" TIMESTAMPTZ(3),
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens_recuperacion" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "token_hash" VARCHAR(128) NOT NULL,
    "expira_en" TIMESTAMPTZ(3) NOT NULL,
    "usado_en" TIMESTAMPTZ(3),
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_recuperacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amistades" (
    "id" UUID NOT NULL,
    "solicitante_id" UUID NOT NULL,
    "receptor_id" UUID NOT NULL,
    "estado" "estado_amistad" NOT NULL DEFAULT 'PENDIENTE',
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondido_en" TIMESTAMPTZ(3),

    CONSTRAINT "amistades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupos" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "descripcion" VARCHAR(500),
    "foto_url" VARCHAR(500),
    "creador_id" UUID,
    "codigo_invitacion" VARCHAR(32) NOT NULL,
    "solo_admins_crean_retos" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "grupos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "miembros_grupo" (
    "grupo_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "rol" "rol_grupo" NOT NULL DEFAULT 'INTEGRANTE',
    "unido_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "miembros_grupo_pkey" PRIMARY KEY ("grupo_id","usuario_id")
);

-- CreateTable
CREATE TABLE "invitaciones" (
    "id" UUID NOT NULL,
    "grupo_id" UUID NOT NULL,
    "invitador_id" UUID NOT NULL,
    "invitado_id" UUID NOT NULL,
    "estado" "estado_invitacion" NOT NULL DEFAULT 'PENDIENTE',
    "expira_en" TIMESTAMPTZ(3),
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondido_en" TIMESTAMPTZ(3),

    CONSTRAINT "invitaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retos" (
    "id" UUID NOT NULL,
    "tipo" "tipo_reto" NOT NULL,
    "grupo_id" UUID,
    "creador_id" UUID NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "descripcion" VARCHAR(1000),
    "meta" VARCHAR(200),
    "frecuencia" "frecuencia" NOT NULL,
    "veces_por_semana" SMALLINT,
    "dias_semana" SMALLINT[] DEFAULT ARRAY[]::SMALLINT[],
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE,
    "puntos_por_cumplimiento" INTEGER NOT NULL DEFAULT 10,
    "puntos_por_incumplimiento" INTEGER NOT NULL DEFAULT 0,
    "bono_racha_cada" INTEGER,
    "bono_racha_puntos" INTEGER NOT NULL DEFAULT 0,
    "requiere_evidencia" BOOLEAN NOT NULL DEFAULT false,
    "requiere_aprobacion" BOOLEAN NOT NULL DEFAULT false,
    "dias_gracia_registro" SMALLINT NOT NULL DEFAULT 0,
    "porcentaje_minimo_cumplimiento" SMALLINT NOT NULL DEFAULT 100,
    "permite_abandono" BOOLEAN NOT NULL DEFAULT true,
    "castigo_descripcion" VARCHAR(500),
    "castigo_puntos" INTEGER NOT NULL DEFAULT 0,
    "castigo_periodo" "periodo_castigo",
    "estado" "estado_reto" NOT NULL DEFAULT 'ACTIVO',
    "finalizado_en" TIMESTAMPTZ(3),
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "retos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participantes_reto" (
    "id" UUID NOT NULL,
    "reto_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "estado" "estado_participante" NOT NULL DEFAULT 'ACTIVO',
    "fecha_ingreso" DATE NOT NULL,
    "puntos" INTEGER NOT NULL DEFAULT 0,
    "racha_actual" INTEGER NOT NULL DEFAULT 0,
    "mejor_racha" INTEGER NOT NULL DEFAULT 0,
    "ultimo_cumplimiento" DATE,
    "completado" BOOLEAN,
    "posicion_final" INTEGER,
    "unido_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "salida_en" TIMESTAMPTZ(3),

    CONSTRAINT "participantes_reto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pausas" (
    "id" UUID NOT NULL,
    "participante_id" UUID NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE,
    "motivo" VARCHAR(300),
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pausas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_cumplimiento" (
    "id" UUID NOT NULL,
    "participante_id" UUID NOT NULL,
    "fecha" DATE NOT NULL,
    "cumplido" BOOLEAN NOT NULL,
    "estado" "estado_registro" NOT NULL DEFAULT 'APROBADO',
    "automatico" BOOLEAN NOT NULL DEFAULT false,
    "nota" VARCHAR(500),
    "registrado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revisado_por_id" UUID,
    "revisado_en" TIMESTAMPTZ(3),
    "motivo_rechazo" VARCHAR(300),

    CONSTRAINT "registros_cumplimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidencias" (
    "id" UUID NOT NULL,
    "registro_id" UUID NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "public_id" VARCHAR(255) NOT NULL,
    "formato" VARCHAR(10) NOT NULL,
    "bytes" INTEGER NOT NULL,
    "ancho" INTEGER,
    "alto" INTEGER,
    "subida_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_puntos" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "participante_id" UUID,
    "reto_id" UUID,
    "grupo_id" UUID,
    "registro_id" UUID,
    "tipo" "tipo_movimiento" NOT NULL,
    "puntos" INTEGER NOT NULL,
    "descripcion" VARCHAR(500) NOT NULL,
    "clave" VARCHAR(100),
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_puntos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "castigos_aplicados" (
    "id" UUID NOT NULL,
    "participante_id" UUID NOT NULL,
    "periodo" "periodo_castigo" NOT NULL,
    "periodo_inicio" DATE NOT NULL,
    "periodo_fin" DATE NOT NULL,
    "requeridos" INTEGER NOT NULL,
    "cumplidos" INTEGER NOT NULL,
    "descripcion" VARCHAR(500),
    "puntos" INTEGER NOT NULL DEFAULT 0,
    "saldado" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "castigos_aplicados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insignias" (
    "id" UUID NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "descripcion" VARCHAR(300) NOT NULL,
    "icono_url" VARCHAR(500),
    "criterio" "criterio_insignia" NOT NULL,
    "umbral" INTEGER NOT NULL,

    CONSTRAINT "insignias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insignias_usuario" (
    "usuario_id" UUID NOT NULL,
    "insignia_id" UUID NOT NULL,
    "reto_id" UUID,
    "obtenida_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insignias_usuario_pkey" PRIMARY KEY ("usuario_id","insignia_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_recuperacion_token_hash_key" ON "tokens_recuperacion"("token_hash");

-- CreateIndex
CREATE INDEX "tokens_recuperacion_usuario_id_idx" ON "tokens_recuperacion"("usuario_id");

-- CreateIndex
CREATE INDEX "amistades_receptor_id_estado_idx" ON "amistades"("receptor_id", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "amistades_solicitante_id_receptor_id_key" ON "amistades"("solicitante_id", "receptor_id");

-- CreateIndex
CREATE UNIQUE INDEX "grupos_codigo_invitacion_key" ON "grupos"("codigo_invitacion");

-- CreateIndex
CREATE INDEX "miembros_grupo_usuario_id_idx" ON "miembros_grupo"("usuario_id");

-- CreateIndex
CREATE INDEX "invitaciones_invitado_id_estado_idx" ON "invitaciones"("invitado_id", "estado");

-- CreateIndex
CREATE INDEX "invitaciones_grupo_id_idx" ON "invitaciones"("grupo_id");

-- CreateIndex
CREATE INDEX "retos_grupo_id_estado_idx" ON "retos"("grupo_id", "estado");

-- CreateIndex
CREATE INDEX "retos_creador_id_idx" ON "retos"("creador_id");

-- CreateIndex
CREATE INDEX "retos_estado_fecha_fin_idx" ON "retos"("estado", "fecha_fin");

-- CreateIndex
CREATE INDEX "participantes_reto_usuario_id_estado_idx" ON "participantes_reto"("usuario_id", "estado");

-- CreateIndex
CREATE INDEX "participantes_reto_reto_id_puntos_idx" ON "participantes_reto"("reto_id", "puntos" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "participantes_reto_reto_id_usuario_id_key" ON "participantes_reto"("reto_id", "usuario_id");

-- CreateIndex
CREATE INDEX "pausas_participante_id_idx" ON "pausas"("participante_id");

-- CreateIndex
CREATE INDEX "registros_cumplimiento_estado_idx" ON "registros_cumplimiento"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "registros_cumplimiento_participante_id_fecha_key" ON "registros_cumplimiento"("participante_id", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "evidencias_public_id_key" ON "evidencias"("public_id");

-- CreateIndex
CREATE INDEX "evidencias_registro_id_idx" ON "evidencias"("registro_id");

-- CreateIndex
CREATE INDEX "movimientos_puntos_usuario_id_creado_en_idx" ON "movimientos_puntos"("usuario_id", "creado_en");

-- CreateIndex
CREATE INDEX "movimientos_puntos_grupo_id_usuario_id_idx" ON "movimientos_puntos"("grupo_id", "usuario_id");

-- CreateIndex
CREATE INDEX "movimientos_puntos_registro_id_idx" ON "movimientos_puntos"("registro_id");

-- CreateIndex
CREATE UNIQUE INDEX "movimientos_puntos_participante_id_clave_key" ON "movimientos_puntos"("participante_id", "clave");

-- CreateIndex
CREATE UNIQUE INDEX "castigos_aplicados_participante_id_periodo_periodo_inicio_key" ON "castigos_aplicados"("participante_id", "periodo", "periodo_inicio");

-- CreateIndex
CREATE UNIQUE INDEX "insignias_codigo_key" ON "insignias"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "insignias_criterio_umbral_key" ON "insignias"("criterio", "umbral");

-- AddForeignKey
ALTER TABLE "tokens_recuperacion" ADD CONSTRAINT "tokens_recuperacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amistades" ADD CONSTRAINT "amistades_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amistades" ADD CONSTRAINT "amistades_receptor_id_fkey" FOREIGN KEY ("receptor_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupos" ADD CONSTRAINT "grupos_creador_id_fkey" FOREIGN KEY ("creador_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "miembros_grupo" ADD CONSTRAINT "miembros_grupo_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "miembros_grupo" ADD CONSTRAINT "miembros_grupo_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitaciones" ADD CONSTRAINT "invitaciones_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitaciones" ADD CONSTRAINT "invitaciones_invitador_id_fkey" FOREIGN KEY ("invitador_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitaciones" ADD CONSTRAINT "invitaciones_invitado_id_fkey" FOREIGN KEY ("invitado_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retos" ADD CONSTRAINT "retos_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retos" ADD CONSTRAINT "retos_creador_id_fkey" FOREIGN KEY ("creador_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participantes_reto" ADD CONSTRAINT "participantes_reto_reto_id_fkey" FOREIGN KEY ("reto_id") REFERENCES "retos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participantes_reto" ADD CONSTRAINT "participantes_reto_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pausas" ADD CONSTRAINT "pausas_participante_id_fkey" FOREIGN KEY ("participante_id") REFERENCES "participantes_reto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_cumplimiento" ADD CONSTRAINT "registros_cumplimiento_participante_id_fkey" FOREIGN KEY ("participante_id") REFERENCES "participantes_reto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_cumplimiento" ADD CONSTRAINT "registros_cumplimiento_revisado_por_id_fkey" FOREIGN KEY ("revisado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidencias" ADD CONSTRAINT "evidencias_registro_id_fkey" FOREIGN KEY ("registro_id") REFERENCES "registros_cumplimiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_puntos" ADD CONSTRAINT "movimientos_puntos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_puntos" ADD CONSTRAINT "movimientos_puntos_participante_id_fkey" FOREIGN KEY ("participante_id") REFERENCES "participantes_reto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_puntos" ADD CONSTRAINT "movimientos_puntos_reto_id_fkey" FOREIGN KEY ("reto_id") REFERENCES "retos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_puntos" ADD CONSTRAINT "movimientos_puntos_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_puntos" ADD CONSTRAINT "movimientos_puntos_registro_id_fkey" FOREIGN KEY ("registro_id") REFERENCES "registros_cumplimiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "castigos_aplicados" ADD CONSTRAINT "castigos_aplicados_participante_id_fkey" FOREIGN KEY ("participante_id") REFERENCES "participantes_reto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insignias_usuario" ADD CONSTRAINT "insignias_usuario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insignias_usuario" ADD CONSTRAINT "insignias_usuario_insignia_id_fkey" FOREIGN KEY ("insignia_id") REFERENCES "insignias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insignias_usuario" ADD CONSTRAINT "insignias_usuario_reto_id_fkey" FOREIGN KEY ("reto_id") REFERENCES "retos"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- =============================================================================
--  Restricciones de integridad adicionales (no expresables en Prisma)
-- =============================================================================

-- ---------- usuarios ----------
ALTER TABLE "usuarios"
  ADD CONSTRAINT "usuarios_correo_minusculas_chk" CHECK ("correo" = lower("correo")),
  ADD CONSTRAINT "usuarios_correo_formato_chk"   CHECK ("correo" ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  ADD CONSTRAINT "usuarios_nombre_no_vacio_chk"  CHECK (length(btrim("nombre")) > 0);

-- ---------- tokens ----------
ALTER TABLE "tokens_recuperacion"
  ADD CONSTRAINT "tokens_expira_despues_chk" CHECK ("expira_en" > "creado_en");

-- ---------- amistades ----------
ALTER TABLE "amistades"
  ADD CONSTRAINT "amistades_distintos_chk" CHECK ("solicitante_id" <> "receptor_id");
-- Una sola relación por pareja, sin importar la dirección (A→B o B→A).
CREATE UNIQUE INDEX "amistades_pareja_unica_idx"
  ON "amistades" (LEAST("solicitante_id", "receptor_id"), GREATEST("solicitante_id", "receptor_id"));

-- ---------- grupos ----------
ALTER TABLE "grupos"
  ADD CONSTRAINT "grupos_nombre_no_vacio_chk" CHECK (length(btrim("nombre")) > 0);

-- ---------- invitaciones ----------
-- Solo puede haber una invitación PENDIENTE por grupo e invitado.
CREATE UNIQUE INDEX "invitaciones_pendiente_unica_idx"
  ON "invitaciones" ("grupo_id", "invitado_id") WHERE "estado" = 'PENDIENTE';
ALTER TABLE "invitaciones"
  ADD CONSTRAINT "invitaciones_distintos_chk" CHECK ("invitador_id" <> "invitado_id");

-- ---------- retos ----------
ALTER TABLE "retos"
  ADD CONSTRAINT "retos_nombre_no_vacio_chk" CHECK (length(btrim("nombre")) > 0),
  -- PERSONAL ⇔ sin grupo; GRUPAL ⇔ con grupo.
  ADD CONSTRAINT "retos_tipo_grupo_chk" CHECK (
    ("tipo" = 'PERSONAL' AND "grupo_id" IS NULL) OR
    ("tipo" = 'GRUPAL'   AND "grupo_id" IS NOT NULL)
  ),
  -- CU-07 2a: la fecha de fin no puede ser anterior a la de inicio.
  ADD CONSTRAINT "retos_fechas_chk" CHECK ("fecha_fin" IS NULL OR "fecha_fin" >= "fecha_inicio"),
  -- Frecuencia coherente con sus parámetros. (Ojo: en un CHECK, NULL cuenta
  -- como "cumple", por eso se exige IS NOT NULL de forma explícita.)
  ADD CONSTRAINT "retos_frecuencia_chk" CHECK (
    ("frecuencia" = 'DIARIA'
       AND "veces_por_semana" IS NULL AND cardinality("dias_semana") = 0) OR
    ("frecuencia" = 'SEMANAL'
       AND "veces_por_semana" IS NOT NULL AND "veces_por_semana" BETWEEN 1 AND 7
       AND cardinality("dias_semana") = 0) OR
    ("frecuencia" = 'DIAS_ESPECIFICOS'
       AND "veces_por_semana" IS NULL
       AND cardinality("dias_semana") BETWEEN 1 AND 7
       AND "dias_semana" <@ ARRAY[1,2,3,4,5,6,7]::smallint[])
  ),
  ADD CONSTRAINT "retos_puntos_chk" CHECK (
    "puntos_por_cumplimiento"   BETWEEN 0 AND 10000 AND
    "puntos_por_incumplimiento" BETWEEN 0 AND 10000 AND
    "bono_racha_puntos"         BETWEEN 0 AND 10000 AND
    "castigo_puntos"            BETWEEN 0 AND 10000
  ),
  ADD CONSTRAINT "retos_bono_racha_chk" CHECK ("bono_racha_cada" IS NULL OR "bono_racha_cada" >= 1),
  ADD CONSTRAINT "retos_gracia_chk" CHECK ("dias_gracia_registro" BETWEEN 0 AND 7),
  ADD CONSTRAINT "retos_porcentaje_chk" CHECK ("porcentaje_minimo_cumplimiento" BETWEEN 1 AND 100),
  -- La aprobación de evidencias solo tiene sentido en retos grupales.
  ADD CONSTRAINT "retos_aprobacion_grupal_chk" CHECK (NOT "requiere_aprobacion" OR "tipo" = 'GRUPAL'),
  -- Un castigo "al finalizar" necesita una fecha de fin.
  ADD CONSTRAINT "retos_castigo_final_chk" CHECK ("castigo_periodo" IS DISTINCT FROM 'AL_FINALIZAR' OR "fecha_fin" IS NOT NULL),
  -- Si hay castigo debe tener descripción o puntos.
  ADD CONSTRAINT "retos_castigo_definido_chk" CHECK (
    "castigo_periodo" IS NULL OR "castigo_puntos" > 0 OR "castigo_descripcion" IS NOT NULL
  );

-- ---------- participantes ----------
ALTER TABLE "participantes_reto"
  ADD CONSTRAINT "participantes_rachas_chk" CHECK ("racha_actual" >= 0 AND "mejor_racha" >= "racha_actual"),
  ADD CONSTRAINT "participantes_posicion_chk" CHECK ("posicion_final" IS NULL OR "posicion_final" >= 1);

-- ---------- pausas ----------
ALTER TABLE "pausas"
  ADD CONSTRAINT "pausas_fechas_chk" CHECK ("fecha_fin" IS NULL OR "fecha_fin" >= "fecha_inicio"),
  -- RN-02: las pausas de un participante no se traslapan (fin nulo = abierta).
  ADD CONSTRAINT "pausas_sin_traslape_excl" EXCLUDE USING gist (
    "participante_id" WITH =,
    daterange("fecha_inicio", "fecha_fin", '[]') WITH &&
  );

-- ---------- registros ----------
ALTER TABLE "registros_cumplimiento"
  -- Un "no lo completé" nunca queda pendiente de aprobación.
  ADD CONSTRAINT "registros_estado_chk" CHECK ("cumplido" OR "estado" = 'APROBADO'),
  ADD CONSTRAINT "registros_revision_chk" CHECK (
    ("revisado_en" IS NULL) = ("revisado_por_id" IS NULL)
  );

-- ---------- evidencias ----------
ALTER TABLE "evidencias"
  ADD CONSTRAINT "evidencias_formato_chk" CHECK ("formato" IN ('jpg', 'jpeg', 'png', 'webp', 'heic')),
  -- Límite de 5 MB por archivo (CU-08 2a).
  ADD CONSTRAINT "evidencias_bytes_chk" CHECK ("bytes" > 0 AND "bytes" <= 5242880),
  ADD CONSTRAINT "evidencias_url_https_chk" CHECK ("url" LIKE 'https://%');

-- ---------- movimientos de puntos ----------
ALTER TABLE "movimientos_puntos"
  ADD CONSTRAINT "movimientos_puntos_no_cero_chk" CHECK ("puntos" <> 0),
  ADD CONSTRAINT "movimientos_signo_chk" CHECK (
    ("tipo" IN ('CUMPLIMIENTO', 'BONO_RACHA') AND "puntos" > 0) OR
    ("tipo" IN ('INCUMPLIMIENTO', 'CASTIGO')  AND "puntos" < 0) OR
    ("tipo" = 'AJUSTE_ADMIN')
  );

-- ---------- castigos aplicados ----------
ALTER TABLE "castigos_aplicados"
  ADD CONSTRAINT "castigos_periodo_chk" CHECK ("periodo_fin" >= "periodo_inicio"),
  ADD CONSTRAINT "castigos_conteos_chk" CHECK ("requeridos" > 0 AND "cumplidos" >= 0 AND "cumplidos" < "requeridos"),
  ADD CONSTRAINT "castigos_puntos_chk" CHECK ("puntos" >= 0);

-- ---------- insignias ----------
ALTER TABLE "insignias"
  ADD CONSTRAINT "insignias_umbral_chk" CHECK ("umbral" >= 1);

-- =============================================================================
--  Triggers de integridad entre tablas
-- =============================================================================

-- Un participante de un reto GRUPAL debe ser miembro del grupo; en un reto
-- PERSONAL solo puede participar su creador (RNF-04, privacidad).
CREATE FUNCTION "validar_participante_reto"() RETURNS trigger AS $$
DECLARE
  r RECORD;
BEGIN
  SELECT "tipo", "grupo_id", "creador_id" INTO r FROM "retos" WHERE "id" = NEW."reto_id";
  IF r."tipo" = 'PERSONAL' AND NEW."usuario_id" <> r."creador_id" THEN
    RAISE EXCEPTION 'Solo el creador puede participar en un reto personal'
      USING ERRCODE = 'check_violation', CONSTRAINT = 'participantes_reto_personal_chk';
  END IF;
  IF r."tipo" = 'GRUPAL' AND NOT EXISTS (
       SELECT 1 FROM "miembros_grupo"
        WHERE "grupo_id" = r."grupo_id" AND "usuario_id" = NEW."usuario_id") THEN
    RAISE EXCEPTION 'El participante debe ser miembro del grupo del reto'
      USING ERRCODE = 'check_violation', CONSTRAINT = 'participantes_reto_miembro_chk';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "participantes_reto_validar_trg"
  BEFORE INSERT ON "participantes_reto"
  FOR EACH ROW EXECUTE FUNCTION "validar_participante_reto"();

-- Un grupo nunca se queda sin administrador mientras tenga miembros:
--  * Degradar al último ADMIN está prohibido (hay que nombrar otro antes).
--  * Si el último ADMIN sale o elimina su cuenta, se asciende automáticamente
--    al integrante más antiguo.
CREATE FUNCTION "impedir_degradar_ultimo_admin"() RETURNS trigger AS $$
BEGIN
  IF OLD."rol" = 'ADMIN' AND NEW."rol" <> 'ADMIN' AND NOT EXISTS (
       SELECT 1 FROM "miembros_grupo"
        WHERE "grupo_id" = OLD."grupo_id" AND "rol" = 'ADMIN' AND "usuario_id" <> OLD."usuario_id") THEN
    RAISE EXCEPTION 'El grupo debe conservar al menos un administrador'
      USING ERRCODE = 'check_violation', CONSTRAINT = 'miembros_grupo_ultimo_admin_chk';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "miembros_grupo_degradar_admin_trg"
  BEFORE UPDATE OF "rol" ON "miembros_grupo"
  FOR EACH ROW EXECUTE FUNCTION "impedir_degradar_ultimo_admin"();

CREATE FUNCTION "ascender_admin_si_falta"() RETURNS trigger AS $$
BEGIN
  IF OLD."rol" = 'ADMIN' AND NOT EXISTS (
       SELECT 1 FROM "miembros_grupo" WHERE "grupo_id" = OLD."grupo_id" AND "rol" = 'ADMIN') THEN
    UPDATE "miembros_grupo" SET "rol" = 'ADMIN'
     WHERE ("grupo_id", "usuario_id") = (
       SELECT "grupo_id", "usuario_id" FROM "miembros_grupo"
        WHERE "grupo_id" = OLD."grupo_id"
        ORDER BY "unido_en", "usuario_id" LIMIT 1);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "miembros_grupo_ascender_admin_trg"
  AFTER DELETE ON "miembros_grupo"
  FOR EACH ROW EXECUTE FUNCTION "ascender_admin_si_falta"();
