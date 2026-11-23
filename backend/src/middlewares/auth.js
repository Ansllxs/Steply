import jwt from 'jsonwebtoken';
import { prisma, permisos } from '@steply/database';
import { noAutenticado } from '../services/auth.js';

// Revisa el header "Authorization: Bearer <token>" y deja el usuario en req.usuario
export async function verificarToken(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [tipo, token] = header.split(' ');
    if (tipo !== 'Bearer' || !token) throw noAutenticado('Debe iniciar sesión');

    let datos;
    try {
      datos = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      throw noAutenticado('La sesión no es válida o ya expiró');
    }

    // obtenerUsuario falla si la cuenta no existe o está suspendida
    req.usuario = await permisos.obtenerUsuario(prisma, datos.id);
    next();
  } catch (err) {
    next(err);
  }
}
