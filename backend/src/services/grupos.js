import { randomBytes } from 'node:crypto';
import { prisma, permisos, retos, sinPermiso, noEncontrado, conflicto, validacion } from '@steply/database';
import { datosPublicos } from './usuarios.js';

function generarCodigo() {
  return randomBytes(6).toString('hex').toUpperCase();
}

// Prueba con códigos nuevos si por casualidad el código ya existe (error P2002 de Prisma)
async function conCodigoUnico(operacion) {
  for (let intento = 0; intento < 5; intento++) {
    try {
      return await operacion(generarCodigo());
    } catch (err) {
      if (err.code !== 'P2002') throw err;
    }
  }
  throw conflicto('No se pudo generar un código de invitación, intente de nuevo');
}

// Lanza error si el usuario no es admin del grupo ni admin general
async function exigirAdminGrupo(usuario, grupoId) {
  const membresia = await permisos.exigirMiembro(prisma, grupoId, usuario);
  if (!permisos.esAdminGeneral(usuario) && membresia?.rol !== 'ADMIN') {
    throw sinPermiso('Solo un administrador del grupo puede hacer esto');
  }
}

export async function crear(usuario, { nombre, descripcion, soloAdminsCreanRetos }) {
  // El grupo y la membresía del creador como ADMIN se guardan en una sola operación
  return conCodigoUnico((codigoInvitacion) =>
    prisma.grupo.create({
      data: {
        nombre,
        descripcion,
        soloAdminsCreanRetos,
        codigoInvitacion,
        creadorId: usuario.id,
        miembros: { create: { usuarioId: usuario.id, rol: 'ADMIN' } },
      },
    }),
  );
}

export async function listarMios(usuario) {
  const membresias = await prisma.miembroGrupo.findMany({
    where: { usuarioId: usuario.id },
    include: { grupo: { include: { _count: { select: { miembros: true } } } } },
    orderBy: { unidoEn: 'desc' },
  });

  return membresias.map(({ grupo, rol }) => {
    const { _count, codigoInvitacion, ...datos } = grupo;
    return {
      ...datos,
      miRol: rol,
      cantidadMiembros: _count.miembros,
      // El código solo lo ven los admins, que son quienes invitan
      codigoInvitacion: rol === 'ADMIN' ? codigoInvitacion : undefined,
    };
  });
}

export async function obtener(usuario, grupoId) {
  const membresia = await permisos.exigirMiembro(prisma, grupoId, usuario);
  const grupo = await prisma.grupo.findUnique({
    where: { id: grupoId },
    include: {
      miembros: { include: { usuario: { select: datosPublicos } }, orderBy: { unidoEn: 'asc' } },
    },
  });
  if (!grupo) throw noEncontrado('Grupo no encontrado');

  const esAdmin = membresia?.rol === 'ADMIN' || permisos.esAdminGeneral(usuario);
  const { miembros, codigoInvitacion, ...datos } = grupo;
  return {
    ...datos,
    miRol: membresia?.rol ?? null,
    codigoInvitacion: esAdmin ? codigoInvitacion : undefined,
    miembros: miembros.map((m) => ({ ...m.usuario, rol: m.rol })),
  };
}

export async function unirse(usuario, codigo) {
  const grupo = await prisma.grupo.findUnique({ where: { codigoInvitacion: codigo } });
  if (!grupo) throw noEncontrado('El código de invitación no es válido');

  const yaEsMiembro = await permisos.obtenerMembresia(prisma, grupo.id, usuario.id);
  if (yaEsMiembro) throw conflicto('Ya es miembro de este grupo');

  await prisma.miembroGrupo.create({ data: { grupoId: grupo.id, usuarioId: usuario.id } });
  return obtener(usuario, grupo.id);
}

export async function editar(usuario, grupoId, { nombre, descripcion, soloAdminsCreanRetos }) {
  await exigirAdminGrupo(usuario, grupoId);
  await prisma.grupo.update({ where: { id: grupoId }, data: { nombre, descripcion, soloAdminsCreanRetos } });
  return obtener(usuario, grupoId);
}

export async function regenerarCodigo(usuario, grupoId) {
  await exigirAdminGrupo(usuario, grupoId);
  const grupo = await conCodigoUnico((codigoInvitacion) =>
    prisma.grupo.update({ where: { id: grupoId }, data: { codigoInvitacion } }),
  );
  return { codigoInvitacion: grupo.codigoInvitacion };
}

// Al borrar el grupo, la base borra en cascada sus miembros y sus retos
export async function eliminar(usuario, grupoId) {
  await exigirAdminGrupo(usuario, grupoId);
  await prisma.grupo.delete({ where: { id: grupoId } });
}

async function exigirQueSeaMiembro(grupoId, usuarioId) {
  const membresia = await permisos.obtenerMembresia(prisma, grupoId, usuarioId);
  if (!membresia) throw noEncontrado('Esa persona no es miembro del grupo');
}

export async function cambiarRol(usuario, grupoId, usuarioId, rol) {
  await exigirAdminGrupo(usuario, grupoId);
  await exigirQueSeaMiembro(grupoId, usuarioId);
  try {
    await prisma.miembroGrupo.update({
      where: { grupoId_usuarioId: { grupoId, usuarioId } },
      data: { rol },
    });
  } catch (err) {
    // La base no deja quitarle el rol al último admin del grupo
    if (String(err.message).includes('conservar al menos un administrador')) {
      throw validacion('El grupo debe tener al menos un administrador. Nombre a otro admin primero');
    }
    throw err;
  }
  return obtener(usuario, grupoId);
}

// Retos activos del grupo en los que la persona sigue participando
function participacionesEnGrupo(grupoId, usuarioId) {
  return prisma.participanteReto.findMany({
    where: { usuarioId, estado: { in: ['ACTIVO', 'PAUSADO'] }, reto: { grupoId, estado: 'ACTIVO' } },
    include: { reto: { select: { id: true, nombre: true, permiteAbandono: true } } },
  });
}

// Cuando el grupo se queda sin nadie se anota la hora. Si sigue vacío unos días,
// la tarea de cada hora lo borra (ver borrarGruposVacios)
async function marcarSiQuedoVacio(grupoId) {
  const quedan = await prisma.miembroGrupo.count({ where: { grupoId } });
  if (quedan === 0) {
    await prisma.grupo.update({ where: { id: grupoId }, data: { actualizadoEn: new Date() } });
  }
}

// El admin quita a alguien. También se le saca de los retos del grupo (queda REMOVIDO
// y se conserva su historial), para que no lo sigan penalizando ni salga en el ranking
export async function quitarMiembro(usuario, grupoId, usuarioId) {
  await exigirAdminGrupo(usuario, grupoId);
  await exigirQueSeaMiembro(grupoId, usuarioId);

  for (const p of await participacionesEnGrupo(grupoId, usuarioId)) {
    await retos.removerParticipante(usuario.id, p.reto.id, usuarioId);
  }
  await prisma.miembroGrupo.delete({ where: { grupoId_usuarioId: { grupoId, usuarioId } } });
  await marcarSiQuedoVacio(grupoId);
}

// Salir del grupo es abandonar todos sus retos (quedan ABANDONADO). Si algún reto no
// permite abandonarlo, no se puede salir todavía, así nadie usa la salida para escaparse.
// Si sale el último admin, la base nombra admin al integrante más antiguo
export async function salir(usuario, grupoId) {
  const membresia = await permisos.obtenerMembresia(prisma, grupoId, usuario.id);
  if (!membresia) throw noEncontrado('Grupo no encontrado');

  const participaciones = await participacionesEnGrupo(grupoId, usuario.id);
  const bloqueados = participaciones.filter((p) => !p.reto.permiteAbandono).map((p) => p.reto.nombre);
  if (bloqueados.length > 0) {
    const lista = bloqueados.join(', ');
    throw conflicto(`No puede salir del grupo porque estos retos no permiten abandonarlos: ${lista}`, { retos: bloqueados });
  }

  for (const p of participaciones) {
    await retos.abandonarReto(usuario.id, p.reto.id);
  }
  await prisma.miembroGrupo.delete({ where: { grupoId_usuarioId: { grupoId, usuarioId: usuario.id } } });
  await marcarSiQuedoVacio(grupoId);
}

// Borra los grupos que llevan cierto tiempo sin ningún miembro. Lo llama la tarea de cada hora
export const DIAS_GRUPO_VACIO = 7;

export async function borrarGruposVacios() {
  const limite = new Date(Date.now() - DIAS_GRUPO_VACIO * 24 * 60 * 60 * 1000);
  const { count } = await prisma.grupo.deleteMany({
    where: { miembros: { none: {} }, actualizadoEn: { lt: limite } },
  });
  return count;
}
