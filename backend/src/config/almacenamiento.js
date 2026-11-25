import { crearAlmacenamientoCloudinary, crearAlmacenamientoMemoria } from '@steply/database';

// Se crea una sola vez. Si faltan las credenciales de Cloudinary (por ejemplo en
// desarrollo), las fotos se guardan en memoria y se pierden al reiniciar el proceso.
function crear(carpeta) {
  try {
    return crearAlmacenamientoCloudinary({ carpeta });
  } catch {
    return crearAlmacenamientoMemoria();
  }
}

export const almacenamientoEvidencias = crear(process.env.CLOUDINARY_CARPETA || 'steply/evidencias');
export const almacenamientoPerfiles = crear('steply/perfiles');

if (almacenamientoEvidencias.nombre === 'memoria') {
  console.warn('Aviso, no hay credenciales de Cloudinary. Las fotos se guardan en memoria (solo para desarrollo).');
}
