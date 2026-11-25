const SECRETO_EJEMPLO = new Set([
  'cambie-esto-por-una-clave-larga',
  'una-clave-larga-y-aleatoria',
  'changeme',
  'secret',
]);

function presente(valor) {
  return typeof valor === 'string' && valor.trim().length > 0;
}

export function credencialesCloudinary(env) {
  if (presente(env.CLOUDINARY_URL)) return 'url';
  const partes = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const completas = partes.filter((nombre) => presente(env[nombre]));
  if (completas.length === 3) return 'variables';
  if (completas.length > 0) return 'incompletas';
  return 'ninguna';
}

export function origenesPermitidos(env) {
  if (env.NODE_ENV !== 'production') return true;
  return String(env.CORS_ORIGIN || '')
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean);
}

/**
 * Revisa la configuración antes de abrir el servidor.
 * No imprime valores secretos.
 */
export function validarArranque(env) {
  const errores = [];
  const produccion = env.NODE_ENV === 'production';

  if (!presente(env.DATABASE_URL)) errores.push('Falta DATABASE_URL.');
  else if (!/^postgres(ql)?:\/\//.test(env.DATABASE_URL)) errores.push('DATABASE_URL debe ser una URL de PostgreSQL.');

  if (!presente(env.JWT_SECRET)) errores.push('Falta JWT_SECRET.');
  else if (produccion && (env.JWT_SECRET.trim().length < 32 || SECRETO_EJEMPLO.has(env.JWT_SECRET.trim()))) {
    errores.push('En producción JWT_SECRET debe ser una clave propia de al menos 32 caracteres.');
  }

  if (env.PORT && !/^\d+$/.test(String(env.PORT))) errores.push('PORT debe ser un número.');

  const cloudinary = credencialesCloudinary(env);
  if (cloudinary === 'incompletas') {
    errores.push('Cloudinary está incompleto. Defina CLOUDINARY_URL o las tres variables CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.');
  }
  if (produccion && cloudinary === 'ninguna') {
    errores.push('En producción faltan las credenciales de Cloudinary. Sin ellas las fotos no se guardan.');
  }

  if (produccion) {
    const origenes = origenesPermitidos(env);
    if (!Array.isArray(origenes) || origenes.length === 0) {
      errores.push('En producción falta CORS_ORIGIN con el origen público del frontend.');
    } else if (origenes.some((origen) => origen === '*' || !/^https?:\/\//.test(origen))) {
      errores.push('CORS_ORIGIN debe listar orígenes http o https, separados por coma, sin usar *.');
    }
  }

  return errores;
}
