import { prisma, validacion, noEncontrado, conflicto } from '@steply/database';
import { datosPublicos } from './usuarios.js';

// Busca la fila de la pareja sin importar quién envió la solicitud
function buscarEntre(a, b) {
  return prisma.amistad.findFirst({
    where: {
      OR: [
        { solicitanteId: a, receptorId: b },
        { solicitanteId: b, receptorId: a },
      ],
    },
  });
}

export async function enviarSolicitud(usuario, receptorId) {
  if (receptorId === usuario.id) throw validacion('No puede enviarse una solicitud a sí mismo');

  const receptor = await prisma.usuario.findUnique({ where: { id: receptorId } });
  if (!receptor || receptor.estado !== 'ACTIVA') throw noEncontrado('Usuario no encontrado');

  const existente = await buscarEntre(usuario.id, receptorId);
  if (existente?.estado === 'ACEPTADA') throw conflicto('Ya son amigos');
  if (existente?.estado === 'PENDIENTE') throw conflicto('Ya existe una solicitud pendiente entre ustedes');

  // Si antes fue rechazada, se reutiliza la misma fila como una solicitud nueva
  if (existente) {
    return prisma.amistad.update({
      where: { id: existente.id },
      data: { solicitanteId: usuario.id, receptorId, estado: 'PENDIENTE', respondidoEn: null, creadoEn: new Date() },
    });
  }
  return prisma.amistad.create({ data: { solicitanteId: usuario.id, receptorId } });
}

export async function listar(usuario) {
  const filas = await prisma.amistad.findMany({
    where: {
      estado: { in: ['PENDIENTE', 'ACEPTADA'] },
      OR: [{ solicitanteId: usuario.id }, { receptorId: usuario.id }],
    },
    include: { solicitante: { select: datosPublicos }, receptor: { select: datosPublicos } },
    orderBy: { creadoEn: 'desc' },
  });

  const resultado = { amigos: [], recibidas: [], enviadas: [] };
  for (const fila of filas) {
    const soySolicitante = fila.solicitanteId === usuario.id;
    const otro = soySolicitante ? fila.receptor : fila.solicitante;
    const item = { amistadId: fila.id, usuario: otro, desde: fila.respondidoEn ?? fila.creadoEn };

    if (fila.estado === 'ACEPTADA') resultado.amigos.push(item);
    else if (soySolicitante) resultado.enviadas.push(item);
    else resultado.recibidas.push(item);
  }
  return resultado;
}

// Solo quien recibió la solicitud puede aceptarla o rechazarla
async function responder(usuario, amistadId, estado) {
  const amistad = await prisma.amistad.findUnique({ where: { id: amistadId } });
  if (!amistad || amistad.receptorId !== usuario.id) throw noEncontrado('Solicitud no encontrada');
  if (amistad.estado !== 'PENDIENTE') throw conflicto('Esa solicitud ya fue respondida');

  return prisma.amistad.update({
    where: { id: amistadId },
    data: { estado, respondidoEn: new Date() },
  });
}

export const aceptar = (usuario, id) => responder(usuario, id, 'ACEPTADA');
export const rechazar = (usuario, id) => responder(usuario, id, 'RECHAZADA');

// Sirve para cancelar una solicitud enviada o para dejar de ser amigos
export async function eliminar(usuario, amistadId) {
  const amistad = await prisma.amistad.findUnique({ where: { id: amistadId } });
  const participa = amistad && [amistad.solicitanteId, amistad.receptorId].includes(usuario.id);
  if (!participa) throw noEncontrado('Solicitud no encontrada');

  await prisma.amistad.delete({ where: { id: amistadId } });
}
