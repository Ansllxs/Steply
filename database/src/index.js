// Punto de entrada del paquete @steply/database.
//
//   import { prisma, retos, registros, puntos, cierre, evidencias } from '@steply/database';
//
// Todas las funciones de servicio reciben primero el id del usuario
// autenticado (lo obtiene el backend de la sesión) y validan permisos sobre
// los datos. Los errores de dominio son instancias de ErrorSteply.

export { prisma, desconectar } from './cliente.js';
export * from './errores.js';

export * as retos from './servicios/retos.js';
export * as registros from './servicios/registros.js';
export * as evidencias from './servicios/evidencias.js';
export * as puntos from './servicios/puntos.js';
export * as cierre from './servicios/cierre.js';
export * as insignias from './servicios/insignias.js';
export * as permisos from './servicios/permisos.js';

export * as reglas from './logica/reglas.js';
export { calcularRacha } from './logica/rachas.js';
export * as fechas from './utils/fechas.js';

export { crearAlmacenamientoCloudinary, crearAlmacenamientoMemoria } from './almacenamiento/cloudinary.js';
