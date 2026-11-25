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
  const { passwordHash, fotoPublicId, sesionVersion, ...resto } = usuario;
  return resto;
}

export function crearToken(usuario) {
  return jwt.sign(
    { id: usuario.id, rol: usuario.rol, sv: usuario.sesionVersion ?? 0 },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  );
}

function conflictoDeCuenta(error) {
  const destino = Array.isArray(error?.meta?.target) ? error.meta.target.join(' ') : String(error?.meta?.target ?? '');
  if (destino.includes('nombre_usuario')) {
    return conflicto('Ese nombre de usuario ya está en uso', {
      errores: [{ campo: 'nombreUsuario', mensaje: 'Ese nombre de usuario ya está en uso' }],
    });
  }
  if (destino.includes('correo')) {
    return conflicto('Ese correo ya está registrado', {
      errores: [{ campo: 'correo', mensaje: 'Ese correo ya está registrado' }],
    });
  }
  return null;
}

export async function registrar({ nombre, correo, nombreUsuario, password }) {
  const existeCorreo = await prisma.usuario.findUnique({ where: { correo } });
  if (existeCorreo) {
    throw conflicto('Ese correo ya está registrado', {
      errores: [{ campo: 'correo', mensaje: 'Ese correo ya está registrado' }],
    });
  }

  const existeUsuario = await prisma.usuario.findUnique({ where: { nombreUsuario } });
  if (existeUsuario) {
    throw conflicto('Ese nombre de usuario ya está en uso', {
      errores: [{ campo: 'nombreUsuario', mensaje: 'Ese nombre de usuario ya está en uso' }],
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const usuario = await prisma.usuario.create({ data: { nombre, correo, nombreUsuario, passwordHash } });
    return { usuario: limpiarUsuario(usuario), token: crearToken(usuario) };
  } catch (error) {
    const conflictoConocido = error?.code === 'P2002' ? conflictoDeCuenta(error) : null;
    if (conflictoConocido) throw conflictoConocido;
    throw error;
  }
}

export async function iniciarSesion({ identificador, password }) {
  const usuario = identificador.includes('@')
    ? await prisma.usuario.findUnique({ where: { correo: identificador } })
    : await prisma.usuario.findUnique({ where: { nombreUsuario: identificador } });
  // Mismo mensaje si falla el correo, el usuario o la contraseña, para no dar pistas
  const valida = usuario && (await bcrypt.compare(password, usuario.passwordHash));
  if (!valida) throw noAutenticado('Correo, usuario o contraseña incorrectos');

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
  const actualizado = await prisma.usuario.update({
    where: { id: usuario.id },
    data: { passwordHash, sesionVersion: { increment: 1 } },
  });
  return crearToken(actualizado);
}
