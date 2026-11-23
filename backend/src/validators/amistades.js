import { body, param } from 'express-validator';

export const reglasEnviar = [
  body('usuarioId').isUUID().withMessage('Debe indicar el id del usuario'),
];

export const reglaIdAmistad = [
  param('id').isUUID().withMessage('El id de la solicitud no es válido'),
];
