// Errores de dominio. El backend puede convertirlos directamente en
// respuestas HTTP usando `error.status` y `error.codigo`.
//
//   app.use((err, req, res, next) => {
//     if (err instanceof ErrorSteply) {
//       return res.status(err.status).json({ codigo: err.codigo, mensaje: err.message, detalles: err.detalles });
//     }
//     next(err);
//   });

export const CODIGOS = Object.freeze({
  VALIDACION: 400,
  SIN_PERMISO: 403,
  NO_ENCONTRADO: 404,
  CONFLICTO: 409,
  FUERA_DE_TIEMPO: 422,
});

export class ErrorSteply extends Error {
  /**
   * @param {keyof typeof CODIGOS} codigo
   * @param {string} mensaje  texto apto para mostrar al usuario
   * @param {object} [detalles]
   */
  constructor(codigo, mensaje, detalles) {
    super(mensaje);
    this.name = 'ErrorSteply';
    this.codigo = codigo;
    this.status = CODIGOS[codigo] ?? 400;
    this.detalles = detalles;
  }
}

export const validacion = (msg, detalles) => new ErrorSteply('VALIDACION', msg, detalles);
export const sinPermiso = (msg = 'No tienes permiso para realizar esta acción') =>
  new ErrorSteply('SIN_PERMISO', msg);
export const noEncontrado = (msg = 'Recurso no encontrado') => new ErrorSteply('NO_ENCONTRADO', msg);
export const conflicto = (msg, detalles) => new ErrorSteply('CONFLICTO', msg, detalles);
export const fueraDeTiempo = (msg) => new ErrorSteply('FUERA_DE_TIEMPO', msg);

/**
 * Convierte errores de Prisma/PostgreSQL en ErrorSteply cuando se reconocen.
 * Útil en el middleware de errores del backend.
 */
export function traducirErrorBD(error) {
  if (error instanceof ErrorSteply) return error;
  const codigo = error?.code;
  if (codigo === 'P2002') return conflicto('Ya existe un registro con esos datos', { campos: error.meta?.target });
  if (codigo === 'P2003') return validacion('Referencia inválida a otro registro', { campo: error.meta?.field_name });
  if (codigo === 'P2025') return noEncontrado();
  const texto = String(error?.message ?? '');
  const restriccion = texto.match(/"?([a-z_]+_(?:chk|excl|idx))"?/)?.[1];
  if (restriccion || /violates check constraint|exclusion constraint|check_violation|23514|23P01/i.test(texto)) {
    return validacion('Los datos no cumplen las reglas de integridad', { restriccion });
  }
  return error;
}
