import { validationResult } from 'express-validator';
import { validacion } from '@steply/database';

// Se pone después de las reglas de express-validator en cada ruta.
// Si alguna regla falló, responde 400 con la lista de campos y mensajes.
export function validar(req, res, next) {
  const resultado = validationResult(req);
  if (resultado.isEmpty()) return next();

  const errores = resultado.array().map((e) => ({ campo: e.path, mensaje: e.msg }));
  next(validacion(errores[0].mensaje, { errores }));
}
