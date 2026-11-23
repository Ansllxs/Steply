import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma, ErrorSteply, conflicto, sinPermiso, validacion } from '@steply/database';

// Error 401 para cuando no se sabe quién es el usuario
export function noAutenticado(mensaje) {
  const error = new ErrorSteply('NO_AUTENTICADO', mensaje);
  error.status = 401;
  return error;
}

// Quita los campos que nunca deben salir en una respuesta
export function limpiarUsuario(usuario) {
  const { passwordHash, fotoPublicId, ...resto } = usuario;
  return resto;
}

export function crearToken(usuario) {
  return jwt.sign({ id: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export async function registrar({ nombre, correo, password }) {
  const existe = await prisma.usuario.findUnique({ where: { correo } });
  if (existe) throw conflicto('Ese correo ya está registrado');

  const passwordHash = await bcrypt.hash(password, 10);
  const usuario = await prisma.usuario.create({ data: { nombre, correo, passwordHash } });
  return { usuario: limpiarUsuario(usuario), token: crearToken(usuario) };
}

export async function iniciarSesion({ correo, password }) {
  const usuario = await prisma.usuario.findUnique({ where: { correo } });
  // Mismo mensaje si falla el correo o la contraseña, para no dar pistas
  const valida = usuario && (await bcrypt.compare(password, usuario.passwordHash));
  if (!valida) throw noAutenticado('Correo o contraseña incorrectos');

  if (usuario.estado !== 'ACTIVA') throw sinPermiso('La cuenta está suspendida');

  const actualizado = await prisma.usuario.update({
    where: { id: usuario.id },
    data: { ultimoAcceso: new Date() },
  });
  return { usuario: limpiarUsuario(actualizado), token: crearToken(actualizado) };
}

export async function cambiarPassword(usuario, { actual, nueva }) {
  const valida = await bcrypt.compare(actual, usuario.passwordHash);
  if (!valida) throw validacion('La contraseña actual no es correcta');

  const passwordHash = await bcrypt.hash(nueva, 10);
  await prisma.usuario.update({ where: { id: usuario.id }, data: { passwordHash } });
}
