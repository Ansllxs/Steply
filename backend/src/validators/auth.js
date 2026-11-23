import { body } from 'express-validator';

const reglaCorreo = body('correo')
  .isString().withMessage('El correo es obligatorio')
  .trim()
  .toLowerCase()
  .isEmail().withMessage('El correo no es válido');

export const reglasRegistro = [
  body('nombre')
    .isString().withMessage('El nombre es obligatorio')
    .trim()
    .isLength({ min: 1, max: 80 }).withMessage('El nombre debe tener entre 1 y 80 caracteres'),
  reglaCorreo,
  body('password')
    .isString().withMessage('La contraseña es obligatoria')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
];

export const reglasLogin = [
  reglaCorreo,
  body('password').isString().notEmpty().withMessage('La contraseña es obligatoria'),
];

export const reglasCambiarPassword = [
  body('actual').isString().notEmpty().withMessage('La contraseña actual es obligatoria'),
  body('nueva')
    .isString().withMessage('La contraseña nueva es obligatoria')
    .isLength({ min: 8 }).withMessage('La contraseña nueva debe tener al menos 8 caracteres'),
];
