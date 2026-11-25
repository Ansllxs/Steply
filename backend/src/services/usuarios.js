import { prisma, insignias, evidencias, noEncontrado, validacion, conflicto } from '@steply/database';
import { almacenamientoPerfiles } from '../config/almacenamiento.js';
import { limpiarUsuario } from './auth.js';

// Lo mínimo que se muestra de otra persona en listas y búsquedas
export const datosPublicos = { id: true, nombre: true, nombreUsuario: true, fotoUrl: true };

export async function editarPerfil(usuario, { nombre, descripcion, zonaHoraria, nombreUsuario }) {
  const data = {};
  if (nombre !== undefined) data.nombre = nombre;
  if (descripcion !== undefined) data.descripcion = descripcion;
  if (zonaHoraria !== undefined) data.zonaHoraria = zonaHoraria;
  if (nombreUsuario !== undefined) {
    const limpio = String(nombreUsuario).trim().toLowerCase();
    if (limpio !== usuario.nombreUsuario) {
      const ocupado = await prisma.usuario.findUnique({ where: { nombreUsuario: limpio } });
      if (ocupado) {
        throw conflicto('Ese nombre de usuario ya está en uso', {
          errores: [{ campo: 'nombreUsuario', mensaje: 'Ese nombre de usuario ya está en uso' }],
        });
      }
      data.nombreUsuario = limpio;
    }
  }

  const actualizado = await prisma.usuario.update({
    where: { id: usuario.id },
    data,
  });
  return limpiarUsuario(actualizado);
}

export async function cambiarFoto(usuario, archivo) {
  if (!archivo) throw validacion('Debe adjuntar una foto en el campo foto');
  const formato = evidencias.validarArchivo(archivo);
  const foto = await almacenamientoPerfiles.subir(archivo.buffer, { formato });
  const fotoUrl = almacenamientoPerfiles.nombre === 'memoria'
    ? `${process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`}/api/medios?id=${encodeURIComponent(foto.publicId)}&origen=perfil`
    : foto.url;

  let actualizado;
  try {
    actualizado = await prisma.usuario.update({
      where: { id: usuario.id },
      data: { fotoUrl, fotoPublicId: foto.publicId },
    });
  } catch (error) {
    await almacenamientoPerfiles.eliminar(foto.publicId).catch(() => {});
    throw error;
  }

  // La foto anterior se borra solo después de guardar la nueva.
  if (usuario.fotoPublicId && usuario.fotoPublicId !== foto.publicId) {
    almacenamientoPerfiles.eliminar(usuario.fotoPublicId).catch(() => {});
  }
  return limpiarUsuario(actualizado);
}

export async function buscar(usuario, texto = '') {
  const consulta = texto.trim().toLowerCase();
  if (consulta.length < 2 || consulta.length > 30) return [];

  const usuarios = await prisma.usuario.findMany({
    where: {
      id: { not: usuario.id },
      estado: 'ACTIVA',
      nombreUsuario: { contains: consulta },
    },
    select: datosPublicos,
    orderBy: { nombreUsuario: 'asc' },
    take: 20,
  });
  if (!usuarios.length) return [];

  const ids = usuarios.map((item) => item.id);
  const amistades = await prisma.amistad.findMany({
    where: {
      OR: [
        { solicitanteId: usuario.id, receptorId: { in: ids } },
        { receptorId: usuario.id, solicitanteId: { in: ids } },
      ],
    },
  });

  return usuarios.map((item) => {
    const fila = amistades.find((amistad) => amistad.solicitanteId === item.id || amistad.receptorId === item.id);
    let relacion = null;
    if (fila?.estado === 'ACEPTADA') relacion = { amistadId: fila.id, estado: 'AMIGOS' };
    else if (fila?.estado === 'PENDIENTE' && fila.solicitanteId === usuario.id) {
      relacion = { amistadId: fila.id, estado: 'ENVIADA' };
    } else if (fila?.estado === 'PENDIENTE') relacion = { amistadId: fila.id, estado: 'RECIBIDA' };
    return { ...item, relacion };
  });
}

export async function perfilPublico(id) {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: { ...datosPublicos, descripcion: true, puntosTotales: true, estado: true },
  });
  if (!usuario || usuario.estado !== 'ACTIVA') throw noEncontrado('Usuario no encontrado');

  const todas = await insignias.listarInsignias(prisma, id);
  const { estado, ...perfil } = usuario;
  return { ...perfil, insignias: todas.filter((i) => i.obtenida) };
}
