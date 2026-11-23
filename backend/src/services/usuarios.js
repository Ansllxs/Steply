import { prisma, insignias, evidencias, noEncontrado, validacion } from '@steply/database';
import { almacenamientoPerfiles } from '../config/almacenamiento.js';
import { limpiarUsuario } from './auth.js';

// Lo mínimo que se muestra de otra persona en listas y búsquedas
export const datosPublicos = { id: true, nombre: true, nombreUsuario: true, fotoUrl: true };

export async function editarPerfil(usuario, { nombre, descripcion, zonaHoraria }) {
  const actualizado = await prisma.usuario.update({
    where: { id: usuario.id },
    data: { nombre, descripcion, zonaHoraria },
  });
  return limpiarUsuario(actualizado);
}

export async function cambiarFoto(usuario, archivo) {
  if (!archivo) throw validacion('Debe adjuntar una foto en el campo foto');
  const formato = evidencias.validarArchivo(archivo);
  const foto = await almacenamientoPerfiles.subir(archivo.buffer, { formato });

  const actualizado = await prisma.usuario.update({
    where: { id: usuario.id },
    data: { fotoUrl: foto.url, fotoPublicId: foto.publicId },
  });

  // Se borra la foto anterior. Si falla no importa, el perfil ya quedó con la nueva
  if (usuario.fotoPublicId) {
    almacenamientoPerfiles.eliminar(usuario.fotoPublicId).catch(() => {});
  }
  return limpiarUsuario(actualizado);
}

export async function buscar(usuario, texto = '') {
  if (texto.length < 2) return [];
  return prisma.usuario.findMany({
    where: {
      id: { not: usuario.id },
      estado: 'ACTIVA',
      OR: [
        { nombre: { contains: texto, mode: 'insensitive' } },
        { nombreUsuario: { contains: texto.toLowerCase() } },
        { correo: { contains: texto.toLowerCase() } },
      ],
    },
    select: datosPublicos,
    orderBy: { nombre: 'asc' },
    take: 20,
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
