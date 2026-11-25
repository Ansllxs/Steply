-- Las sesiones emitidas antes de un cambio de contraseña dejan de coincidir.
ALTER TABLE "usuarios" ADD COLUMN "sesion_version" INTEGER NOT NULL DEFAULT 0;
