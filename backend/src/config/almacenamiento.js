import {
  crearAlmacenamientoCloudinary,
  crearAlmacenamientoMemoria,
  crearAlmacenamientoNoDisponible,
} from '@steply/database';
import { credencialesCloudinary } from './entorno.js';

// Desarrollo sin credenciales usa memoria y las fotos se pierden al reiniciar.
// Producción sin credenciales no arranca: validarArranque lo impide.
// Si las credenciales existen pero el proveedor falla, la subida responde error
// y no marca la foto como guardada.
export function resolverAlmacenamiento(carpeta, env = process.env) {
  const modo = credencialesCloudinary(env);
  if (modo === 'incompletas') {
    throw new Error('Cloudinary está incompleto. Defina CLOUDINARY_URL o las tres variables CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.');
  }
  if (modo === 'url' || modo === 'variables') {
    return crearAlmacenamientoCloudinary({
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      apiKey: env.CLOUDINARY_API_KEY,
      apiSecret: env.CLOUDINARY_API_SECRET,
      carpeta,
    });
  }
  if (env.NODE_ENV === 'production') return crearAlmacenamientoNoDisponible();
  return crearAlmacenamientoMemoria({ carpeta });
}

export const almacenamientoEvidencias = resolverAlmacenamiento(process.env.CLOUDINARY_CARPETA || 'steply/evidencias');
export const almacenamientoPerfiles = resolverAlmacenamiento('steply/perfiles');

if (almacenamientoEvidencias.nombre === 'memoria') {
  console.warn('Aviso, no hay credenciales de Cloudinary. Las fotos se guardan en memoria y se pierden al reiniciar el proceso. Solo para desarrollo.');
}
