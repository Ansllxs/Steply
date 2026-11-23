import { sinPermiso } from '@steply/database';

// Uso: router.get('/ruta', verificarToken, permitirRoles('ADMIN_GENERAL'), controlador)
// Va siempre después de verificarToken, porque necesita req.usuario
export function permitirRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.rol)) {
      return next(sinPermiso('No tienes permiso para realizar esta acción'));
    }
    next();
  };
}
