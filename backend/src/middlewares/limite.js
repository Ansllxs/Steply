// Límite sencillo en memoria para rutas públicas de autenticación.
// No sustituye un límite del hosting, pero frena ráfagas en un solo proceso.
export function limitarIntentos({ max = 10, ventanaMs = 10 * 60 * 1000 } = {}) {
  const golpes = new Map();

  return function limitar(req, res, next) {
    const ahora = Date.now();
    const clave = req.ip || req.socket?.remoteAddress || 'local';
    const recientes = (golpes.get(clave) || []).filter((marca) => ahora - marca < ventanaMs);
    if (recientes.length >= max) {
      res.setHeader('Retry-After', String(Math.ceil(ventanaMs / 1000)));
      res.status(429).json({
        codigo: 'LIMITE',
        mensaje: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
        detalles: {},
      });
      return;
    }
    recientes.push(ahora);
    golpes.set(clave, recientes);
    next();
  };
}
