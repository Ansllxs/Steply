import { ErrorSteply, traducirErrorBD, noEncontrado, validacion } from '@steply/database';

// Se usa cuando ninguna ruta coincide con la dirección pedida
export function rutaNoEncontrada(req, res, next) {
  next(noEncontrado(`No existe la ruta ${req.method} ${req.originalUrl}`));
}

// Manejador central de errores. Todas las respuestas de error salen con el mismo formato
export function manejadorErrores(err, req, res, next) {
  // JSON mal escrito en el cuerpo de la petición
  if (err.type === 'entity.parse.failed') {
    err = validacion('El cuerpo de la petición no es un JSON válido');
  }

  // Errores de multer, por ejemplo una foto de más de 5 MB o demasiadas fotos
  if (err.name === 'MulterError') {
    const mensajes = {
      LIMIT_FILE_SIZE: 'La imagen debe pesar como máximo 5 MB',
      LIMIT_FILE_COUNT: 'Se permiten como máximo 5 fotos',
    };
    err = validacion(mensajes[err.code] || 'No se pudo procesar el archivo', { campo: err.field });
  }

  // Errores de multer, por ejemplo una foto de más de 5 MB o demasiadas fotos
  if (err.name === 'MulterError') {
    const mensajes = { LIMIT_FILE_SIZE: 'La imagen debe pesar como máximo 5 MB', LIMIT_FILE_COUNT: 'Se permiten como máximo 5 fotos' };
    err = validacion(mensajes[err.code] || 'No se pudo procesar el archivo', { campo: err.field });
  }

  const error = traducirErrorBD(err);

  if (error instanceof ErrorSteply) {
    return res.status(error.status).json({
      codigo: error.codigo,
      mensaje: error.message,
      detalles: error.detalles ?? {},
    });
  }

  console.error(err);
  res.status(500).json({ codigo: 'ERROR_INTERNO', mensaje: 'Ocurrió un error inesperado' });
}
