// Comprobaciones de permisos a nivel de datos. El backend (Integrante 2)
// autentica y obtiene el id del usuario de la sesión; estos servicios
// verifican que ese usuario tenga derecho sobre el dato concreto.

import { noEncontrado, sinPermiso } from '../errores.js';

export async function obtenerUsuario(db, usuarioId) {
  const usuario = await db.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) throw noEncontrado('Usuario no encontrado');
  if (usuario.estado !== 'ACTIVA') throw sinPermiso('La cuenta está suspendida');
  return usuario;
}

export function esAdminGeneral(usuario) {
  return usuario?.rol === 'ADMIN_GENERAL';
}

export async function obtenerMembresia(db, grupoId, usuarioId) {
  if (!grupoId) return null;
  return db.miembroGrupo.findUnique({ where: { grupoId_usuarioId: { grupoId, usuarioId } } });
}

/** Puede editar/eliminar el reto, gestionar participantes y revisar evidencias:
 *  su creador, un admin del grupo o el admin general. */
export async function puedeGestionarReto(db, reto, usuario) {
  if (esAdminGeneral(usuario) || reto.creadorId === usuario.id) return true;
  if (reto.tipo !== 'GRUPAL') return false;
  const m = await obtenerMembresia(db, reto.grupoId, usuario.id);
  return m?.rol === 'ADMIN';
}

/** RNF-04: lo personal solo lo ve su dueño; lo grupal, los miembros del grupo. */
export async function puedeVerReto(db, reto, usuario) {
  if (esAdminGeneral(usuario) || reto.creadorId === usuario.id) return true;
  if (reto.tipo !== 'GRUPAL') return false;
  return Boolean(await obtenerMembresia(db, reto.grupoId, usuario.id));
}

export async function exigirGestionReto(db, reto, usuario) {
  if (!(await puedeGestionarReto(db, reto, usuario))) {
    throw sinPermiso('Solo el creador del reto o un administrador del grupo puede hacer esto');
  }
}

export async function exigirVerReto(db, reto, usuario) {
  // Se responde "no encontrado" para no revelar que el reto existe.
  if (!(await puedeVerReto(db, reto, usuario))) throw noEncontrado('Reto no encontrado');
}

export async function exigirMiembro(db, grupoId, usuario) {
  const m = await obtenerMembresia(db, grupoId, usuario.id);
  if (!m && !esAdminGeneral(usuario)) throw noEncontrado('Grupo no encontrado');
  return m;
}
