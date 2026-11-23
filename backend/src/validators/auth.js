import { body } from 'express-validator';

const reglaCorreo = body('correo')
  .isString().withMessage('El correo es obligatorio')
  .trim()
  .toLowerCase()
  .isEmail().withMessage('El correo no es válido');

const usuarioPermitido = /^[\p{L}\p{N}_.]{1,30}$/u;

export const reglasRegistro = [
  body('nombre')
    .isString().withMessage('El nombre es obligatorio')
    .trim()
    .isLength({ min: 1, max: 80 }).withMessage('El nombre debe tener entre 1 y 80 caracteres'),
  body('nombreUsuario')
    .isString().withMessage('El nombre de usuario es obligatorio')
    .trim()
    .toLowerCase()
    .matches(usuarioPermitido).withMessage('El nombre de usuario solo puede tener letras, números, puntos o guiones bajos (1 a 30)'),
  reglaCorreo,
  body('password')
    .isString().withMessage('La contraseña es obligatoria')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
];

export const reglasLogin = [
  body('identificador')
    .isString().withMessage('Ingresa tu correo o usuario')
    .trim()
    .toLowerCase()
    .notEmpty().withMessage('Ingresa tu correo o usuario')
    .custom((valor) => {
      if (valor.includes('@')) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
          throw new Error('Ingresa un correo válido');
        }
        return true;
      }
      if (!usuarioPermitido.test(valor)) throw new Error('Ingresa un usuario válido');
      return true;
    }),
  body('password').isString().notEmpty().withMessage('La contraseña es obligatoria'),
];

export const reglasCambiarPassword = [
  body('actual').isString().notEmpty().withMessage('La contraseña actual es obligatoria'),
  body('nueva')
    .isString().withMessage('La contraseña nueva es obligatoria')
    .isLength({ min: 8 }).withMessage('La contraseña nueva debe tener al menos 8 caracteres'),
];
