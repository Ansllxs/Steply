import { prisma, permisos, noEncontrado, conflicto, sinPermiso, validacion } from '@steply/database';
import { datosPublicos } from './usuarios.js';

async function exigirAdmin(usuario, grupoId) {
  const membresia = await permisos.exigirMiembro(prisma, grupoId, usuario);
  if (!permisos.esAdminGeneral(usuario) && membresia?.rol !== 'ADMIN') {
    throw sinPermiso('Solo un administrador del grupo puede invitar');
  }
}

export async function invitar(usuario, grupoId, invitadoId) {
  if (!invitadoId) throw validacion('Debe indicar a quién invitar', { campo: 'usuarioId' });
  if (invitadoId === usuario.id) throw validacion('No puedes invitarte a ti mismo', { campo: 'usuarioId' });
  await exigirAdmin(usuario, grupoId);

  const invitado = await prisma.usuario.findUnique({ where: { id: invitadoId } });
  if (!invitado || invitado.estado !== 'ACTIVA') throw noEncontrado('Usuario no encontrado');

  const amistad = await prisma.amistad.findFirst({
    where: {
      estado: 'ACEPTADA',
      OR: [
        { solicitanteId: usuario.id, receptorId: invitadoId },
        { solicitanteId: invitadoId, receptorId: usuario.id },
      ],
    },
  });
  if (!amistad) throw validacion('Solo puedes invitar a tus amigos', { campo: 'usuarioId' });

  const miembro = await permisos.obtenerMembresia(prisma, grupoId, invitadoId);
  if (miembro) throw conflicto('Esa persona ya es parte del grupo');

  const pendiente = await prisma.invitacion.findFirst({
    where: { grupoId, invitadoId, estado: 'PENDIENTE' },
  });
  if (pendiente) throw conflicto('Ya hay una invitación pendiente para esa persona');

  try {
    return await prisma.invitacion.create({
      data: { grupoId, invitadorId: usuario.id, invitadoId },
      include: {
        invitado: { select: datosPublicos },
        grupo: { select: { id: true, nombre: true } },
      },
    });
  } catch (err) {
    if (err.code === 'P2002') throw conflicto('Ya hay una invitación pendiente para esa persona');
    throw err;
  }
}

export async function listarDeGrupo(usuario, grupoId) {
  await exigirAdmin(usuario, grupoId);
  return prisma.invitacion.findMany({
    where: { grupoId, estado: 'PENDIENTE' },
    include: { invitado: { select: datosPublicos } },
    orderBy: { creadoEn: 'desc' },
  });
}

export async function listarMias(usuario) {
  return prisma.invitacion.findMany({
    where: { invitadoId: usuario.id, estado: 'PENDIENTE' },
    include: {
      grupo: { select: { id: true, nombre: true, descripcion: true } },
      invitador: { select: datosPublicos },
    },
    orderBy: { creadoEn: 'desc' },
  });
}

export async function aceptar(usuario, invitacionId) {
  return prisma.$transaction(async (tx) => {
    const invitacion = await tx.invitacion.findUnique({ where: { id: invitacionId } });
    if (!invitacion || invitacion.invitadoId !== usuario.id) throw noEncontrado('Invitación no encontrada');
    if (invitacion.estado !== 'PENDIENTE') throw conflicto('Esa invitación ya fue respondida');

    const yaEsMiembro = await tx.miembroGrupo.findUnique({
      where: { grupoId_usuarioId: { grupoId: invitacion.grupoId, usuarioId: usuario.id } },
    });
    if (!yaEsMiembro) {
      await tx.miembroGrupo.create({
        data: { grupoId: invitacion.grupoId, usuarioId: usuario.id, rol: 'INTEGRANTE' },
      });
    }

    return tx.invitacion.update({
      where: { id: invitacionId },
      data: { estado: 'ACEPTADA', respondidoEn: new Date() },
    });
  });
}

export async function rechazar(usuario, invitacionId) {
  const invitacion = await prisma.invitacion.findUnique({ where: { id: invitacionId } });
  if (!invitacion || invitacion.invitadoId !== usuario.id) throw noEncontrado('Invitación no encontrada');
  if (invitacion.estado !== 'PENDIENTE') throw conflicto('Esa invitación ya fue respondida');

  return prisma.invitacion.update({
    where: { id: invitacionId },
    data: { estado: 'RECHAZADA', respondidoEn: new Date() },
  });
}
