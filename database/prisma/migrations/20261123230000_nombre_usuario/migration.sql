-- Agrega un nombre de usuario único sin borrar ni reescribir las cuentas existentes.
-- Las cuentas actuales reciben uno derivado de su correo; si hubiera un choque,
-- se agrega un número. Después la columna queda obligatoria y única.

ALTER TABLE "usuarios" ADD COLUMN "nombre_usuario" VARCHAR(30);

WITH prepared AS (
  SELECT
    id,
    CASE
      WHEN length(slug) = 0 THEN 'usuario'
      ELSE left(slug, 24)
    END AS base
  FROM (
    SELECT
      id,
      regexp_replace(lower(split_part("correo", '@', 1)), '[^[:alnum:]_.]', '', 'g') AS slug
    FROM "usuarios"
  ) origen
),
ranked AS (
  SELECT
    id,
    base,
    row_number() OVER (PARTITION BY base ORDER BY id) AS n
  FROM prepared
)
UPDATE "usuarios" AS usuarios
SET "nombre_usuario" = CASE
  WHEN ranked.n = 1 THEN ranked.base
  ELSE left(ranked.base, 30 - char_length(ranked.n::text)) || ranked.n::text
END
FROM ranked
WHERE usuarios.id = ranked.id;

ALTER TABLE "usuarios" ALTER COLUMN "nombre_usuario" SET NOT NULL;

CREATE UNIQUE INDEX "usuarios_nombre_usuario_key" ON "usuarios"("nombre_usuario");

ALTER TABLE "usuarios"
  ADD CONSTRAINT "usuarios_nombre_usuario_minusculas_chk"
    CHECK ("nombre_usuario" = lower("nombre_usuario")),
  ADD CONSTRAINT "usuarios_nombre_usuario_formato_chk"
    CHECK ("nombre_usuario" ~ '^[[:alnum:]_.]{1,30}$');
