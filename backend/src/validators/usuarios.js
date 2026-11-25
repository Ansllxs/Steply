import { body, param, query } from 'express-validator';

function esZonaHoraria(valor) {
  try {
    new Intl.DateTimeFormat('es', { timeZone: valor });
    return true;
  } catch {
    throw new Error('La zona horaria no es válida, por ejemplo America/Costa_Rica');
  }
}

export const reglasEditarPerfil = [
  body('nombre').optional().isString().trim()
    .isLength({ min: 1, max: 80 }).withMessage('El nombre debe tener entre 1 y 80 caracteres'),
  body('descripcion').optional({ values: 'null' }).isString().trim()
    .isLength({ max: 500 }).withMessage('La descripción puede tener como máximo 500 caracteres'),
  body('zonaHoraria').optional().isString().custom(esZonaHoraria),
  body('nombreUsuario').optional().isString().trim().toLowerCase()
    .matches(/^[\p{L}\p{N}_.]{1,30}$/u)
    .withMessage('El nombre de usuario solo puede tener letras, números, puntos o guiones bajos (1 a 30)'),
];

export const reglasBuscar = [
  query('buscar').optional().isString().trim().isLength({ max: 30 }).withMessage('La búsqueda admite máximo 30 caracteres'),
];

export const reglaIdUsuario = [
  param('id').isUUID().withMessage('El id de usuario no es válido'),
];
