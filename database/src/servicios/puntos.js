// Puntos, tablas de posiciones y resumen del usuario (RF-15, RF-16, RF-18,
// RN-04). Las posiciones se calculan al consultar, así que siempre reflejan
// los últimos registros y aprobaciones (tiempo real).

import { prisma } from '../cliente.js';
import { noEncontrado, sinPermiso, validacion } from '../errores.js';
import { listarInsignias } from './insignias.js';
import { sincronizarPuntosUsuario, sumaPuntos } from './motor.js';
import { esAdminGeneral, exigirGestionReto, exigirMiembro, exigirVerReto, obtenerUsuario } from './permisos.js';

/** Asigna posiciones estilo competencia: empates comparten lugar (1, 1, 3). */
export function asignarPosiciones(filas, clave = 'puntos') {
  let anterior;
  let posicion = 0;
  return filas.map((f, i) => {
    if (f[clave] !== anterior) {
      posicion = i + 1;
      anterior = f[clave];
    }
    return { posicion, ...f };
  });
}

/** RF-15: tabla de posiciones de un reto. Desempate: mejor racha. */
export async function rankingReto(actorId, retoId) {
  const actor = await obtenerUsuario(prisma, actorId);
  const reto = await prisma.reto.findUnique({ where: { id: retoId } });
  if (!reto) throw noEncontrado('Reto no encontrado');
  await exigirVerReto(prisma, reto, actor);

  const participantes = await prisma.participanteReto.findMany({
    where: { retoId, estado: { in: ['ACTIVO', 'PAUSADO'] } },
    include: { usuario: { select: { id: true, nombre: true, fotoUrl: true } } },
    orderBy: [{ puntos: 'desc' }, { mejorRacha: 'desc' }, { unidoEn: 'asc' }],
  });
  return asignarPosiciones(
    participantes.map((p) => ({
      usuario: p.usuario,
      puntos: p.puntos,
      rachaActual: p.rachaActual,
      mejorRacha: p.mejorRacha,
      estado: p.estado,
    })),
  );
}

/** Ranking del grupo (pantalla 12): puntos acumulados en los retos del grupo. */
export async function rankingGrupo(actorId, grupoId) {
  const actor = await obtenerUsuario(prisma, actorId);
  await exigirMiembro(prisma, grupoId, actor);
  const [miembros, sumas] = await Promise.all([
    prisma.miembroGrupo.findMany({
      where: { grupoId },
      include: { usuario: { select: { id: true, nombre: true, fotoUrl: true } } },
    }),
    prisma.movimientoPuntos.groupBy({ by: ['usuarioId'], where: { grupoId }, _sum: { puntos: true } }),
  ]);
  const puntos = new Map(sumas.map((s) => [s.usuarioId, s._sum.puntos ?? 0]));
  const filas = miembros
    .map((m) => ({ usuario: m.usuario, rol: m.rol, puntos: puntos.get(m.usuarioId) ?? 0 }))
    .sort((a, b) => b.puntos - a.puntos || a.usuario.nombre.localeCompare(b.usuario.nombre));
  return asignarPosiciones(filas);
}

/** Resumen para Inicio/Perfil: puntos, racha, grupos, insignias y retos. */
export async function resumenUsuario(usuarioId) {
  const usuario = await obtenerUsuario(prisma, usuarioId);
  const [activas, grupos, completados, ganados, insignias] = await Promise.all([
    prisma.participanteReto.findMany({
      where: { usuarioId, estado: { in: ['ACTIVO', 'PAUSADO'] }, reto: { estado: 'ACTIVO' } },
      select: { rachaActual: true, mejorRacha: true },
    }),
    prisma.miembroGrupo.count({ where: { usuarioId } }),
    prisma.participanteReto.count({ where: { usuarioId, completado: true } }),
    prisma.participanteReto.count({ where: { usuarioId, posicionFinal: 1, reto: { tipo: 'GRUPAL' } } }),
    listarInsignias(prisma, usuarioId),
  ]);
  const mejorHistorica = await prisma.participanteReto.aggregate({ where: { usuarioId }, _max: { mejorRacha: true } });
  return {
    usuario: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, fotoUrl: usuario.fotoUrl },
    puntosTotales: usuario.puntosTotales,
    // "12 días de racha" del dashboard: la mejor racha vigente entre sus retos activos.
    rachaActual: Math.max(0, ...activas.map((a) => a.rachaActual)),
    mejorRacha: mejorHistorica._max.mejorRacha ?? 0,
    retosActivos: activas.length,
    grupos,
    retosCompletados: completados,
    retosGanados: ganados,
    insignias: insignias.filter((i) => i.obtenida),
  };
}

/** Historial de puntos (de dónde salió cada suma o resta). */
export async function movimientosUsuario(usuarioId, { retoId, limite = 50, cursor } = {}) {
  return prisma.movimientoPuntos.findMany({
    where: { usuarioId, ...(retoId ? { retoId } : {}) },
    orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }],
    take: Math.min(limite, 200),
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: { reto: { select: { id: true, nombre: true } } },
  });
}

/** Castigos aplicados en un reto (para mostrarlos en el grupo). */
export async function castigosReto(actorId, retoId, { soloPendientes = false } = {}) {
  const actor = await obtenerUsuario(prisma, actorId);
  const reto = await prisma.reto.findUnique({ where: { id: retoId } });
  if (!reto) throw noEncontrado('Reto no encontrado');
  await exigirVerReto(prisma, reto, actor);
  return prisma.castigoAplicado.findMany({
    where: { participante: { retoId }, ...(soloPendientes ? { saldado: false } : {}) },
    include: { participante: { select: { usuario: { select: { id: true, nombre: true } } } } },
    orderBy: { periodoInicio: 'desc' },
  });
}

/** Marcar un castigo como cumplido/pagado (creador del reto o admin del grupo). */
export async function saldarCastigo(actorId, castigoId, saldado = true) {
  const actor = await obtenerUsuario(prisma, actorId);
  const castigo = await prisma.castigoAplicado.findUnique({
    where: { id: castigoId },
    include: { participante: { include: { reto: true } } },
  });
  if (!castigo) throw noEncontrado('Castigo no encontrado');
  await exigirGestionReto(prisma, castigo.participante.reto, actor);
  return prisma.castigoAplicado.update({ where: { id: castigoId }, data: { saldado } });
}

/** Ajuste manual de puntos por el admin general (RF-20, moderación). */
export async function ajustarPuntos(adminId, usuarioId, puntos, descripcion) {
  const admin = await obtenerUsuario(prisma, adminId);
  if (!esAdminGeneral(admin)) throw sinPermiso('Solo el administrador general puede ajustar puntos');
  if (!Number.isInteger(puntos) || puntos === 0) throw validacion('"puntos" debe ser un entero distinto de 0');
  if (!descripcion?.trim()) throw validacion('Indica el motivo del ajuste');
  return prisma.$transaction(async (tx) => {
    await tx.movimientoPuntos.create({
      data: { usuarioId, tipo: 'AJUSTE_ADMIN', puntos, descripcion: descripcion.trim().slice(0, 500) },
    });
    return sincronizarPuntosUsuario(tx, usuarioId);
  });
}

/**
 * Verificación de integridad: compara las cachés de puntos con el libro de
 * movimientos y, si `corregir`, las arregla. Útil en pruebas y mantenimiento.
 */
export async function verificarCachesPuntos({ corregir = false } = {}) {
  const diferencias = [];
  const usuarios = await prisma.usuario.findMany({ select: { id: true, puntosTotales: true } });
  for (const u of usuarios) {
    const real = await sumaPuntos(prisma, { usuarioId: u.id });
    if (real !== u.puntosTotales) diferencias.push({ tipo: 'usuario', id: u.id, cache: u.puntosTotales, real });
  }
  const participantes = await prisma.participanteReto.findMany({ select: { id: true, puntos: true } });
  for (const p of participantes) {
    const real = await sumaPuntos(prisma, { participanteId: p.id });
    if (real !== p.puntos) diferencias.push({ tipo: 'participante', id: p.id, cache: p.puntos, real });
  }
  if (corregir) {
    for (const d of diferencias) {
      if (d.tipo === 'usuario') await prisma.usuario.update({ where: { id: d.id }, data: { puntosTotales: d.real } });
      else await prisma.participanteReto.update({ where: { id: d.id }, data: { puntos: d.real } });
    }
  }
  return diferencias;
}
