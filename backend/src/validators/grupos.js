import { body, param } from 'express-validator';

// Son funciones porque cada ruta necesita su propia copia de la regla
const nombre = () => body('nombre').isString().withMessage('El nombre es obligatorio').bail().trim()
  .isLength({ min: 1, max: 80 }).withMessage('El nombre debe tener entre 1 y 80 caracteres');
const descripcion = () => body('descripcion').optional({ values: 'null' }).isString().trim()
  .isLength({ max: 500 }).withMessage('La descripción puede tener como máximo 500 caracteres');
const soloAdmins = () => body('soloAdminsCreanRetos').optional().isBoolean({ strict: true })
  .withMessage('soloAdminsCreanRetos debe ser true o false');

export const reglaIdGrupo = [param('id').isUUID().withMessage('El id del grupo no es válido')];

export const reglasCrear = [nombre(), descripcion(), soloAdmins()];
export const reglasEditar = [...reglaIdGrupo, nombre().optional(), descripcion(), soloAdmins()];

export const reglasUnirse = [
  body('codigo').isString().withMessage('El código es obligatorio').trim().toUpperCase()
    .isLength({ min: 1, max: 32 }).withMessage('El código no es válido'),
];

export const reglasMiembro = [
  ...reglaIdGrupo,
  param('usuarioId').isUUID().withMessage('El id del usuario no es válido'),
];

export const reglasCambiarRol = [
  ...reglasMiembro,
  body('rol').isIn(['ADMIN', 'INTEGRANTE']).withMessage('El rol debe ser ADMIN o INTEGRANTE'),
];
