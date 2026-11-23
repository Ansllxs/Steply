import { param } from 'express-validator';

// Revisa que los ids que vienen en la dirección sean uuid. Sin esto, un id mal
// escrito llegaría a Prisma y terminaría en un error 500.
export function idsEnRuta(...nombres) {
  return nombres.map((nombre) => param(nombre).isUUID().withMessage(`El parámetro ${nombre} no es válido`));
}
