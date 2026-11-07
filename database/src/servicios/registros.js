// Registro diario de cumplimiento (RF-06, RF-07, CU-05), revisión de
// evidencias (toggle requiereAprobacion), historial y calendario (RF-09).

import { prisma } from '../cliente.js';
import { conflicto, fueraDeTiempo, noEncontrado, sinPermiso, validacion } from '../errores.js';
import {
  esDiaProgramado,
  estaPausado,
  inicioExigible,
  requeridosEnSemana,
  ventanaRegistro,
} from '../logica/reglas.js';
import { aDate, aTexto, esFechaValida, hoyEn, inicioSemana, limitesMes, rangoDias, sumarDias } from '../utils/fechas.js';
import { normalizarEvidencia, MAX_EVIDENCIAS_POR_REGISTRO } from './evidencias.js';
import { cargarParticipante, recalcularParticipante, recalcularPuntosRegistro } from './motor.js';
import { exigirGestionReto, exigirVerReto, obtenerUsuario } from './permisos.js';

/**
 * Marca un día como cumplido ("Sí, lo completé") o no cumplido ("No lo completé").
 * Si ya existía un registro de ese día y todavía está en la ventana, se
 * reemplaza (los puntos se recalculan, nunca se duplican).
 *
 * @param {string} usuarioId
 * @param {string} retoId
 * @param {object} datos
 * @param {boolean} datos.cumplido
 * @param {string}  [datos.fecha]  'YYYY-MM-DD'; por defecto hoy en la zona del usuario
 * @param {string}  [datos.nota]
 * @param {object[]} [datos.evidencias] [{ url, publicId, formato, bytes, ancho?, alto? }]
 * @param {object} [opciones]
 * @param {object} [opciones.almacenamiento] para validar que las URLs sean propias
 * @returns {Promise<{ registro, participante, puntosRegistro }>}
 */
export async function registrarCumplimiento(usuarioId, retoId, datos, { almacenamiento, ahora = new Date() } = {}) {
  if (typeof datos?.cumplido !== 'boolean') throw validacion('"cumplido" debe ser true o false', { campo: 'cumplido' });
  const usuario = await obtenerUsuario(prisma, usuarioId);
  const hoy = hoyEn(usuario.zonaHoraria, ahora);
  const fecha = datos.fecha ?? hoy;
  if (!esFechaValida(fecha)) throw validacion('"fecha" debe tener el formato AAAA-MM-DD', { campo: 'fecha' });

  const participante = await prisma.participanteReto.findUnique({
    where: { retoId_usuarioId: { retoId, usuarioId } },
    include: { reto: true, pausas: true, usuario: true },
  });
  if (!participante || ['ABANDONADO', 'REMOVIDO'].includes(participante.estado)) {
    throw noEncontrado('No participas en este reto');
  }
  const { reto } = participante;

  // --- CU-05 2a: solo dentro del tiempo establecido ---
  if (reto.estado !== 'ACTIVO') throw fueraDeTiempo('El reto ya no está activo');
  const ventana = ventanaRegistro(reto, hoy);
  if (fecha > ventana.hasta) throw fueraDeTiempo('No puedes registrar días futuros');
  if (fecha < ventana.desde) throw fueraDeTiempo('Ya pasó el tiempo para registrar ese día');
  if (fecha < inicioExigible(reto, participante)) throw fueraDeTiempo('El reto aún no había empezado ese día');
  if (!esDiaProgramado(reto, fecha)) throw fueraDeTiempo('Ese día no está programado en el reto');
  if (estaPausado(participante.pausas, fecha)) throw fueraDeTiempo('Tu participación está en pausa ese día');

  const nuevas = (datos.evidencias ?? []).map((e) => normalizarEvidencia(e, { almacenamiento }));
  if (nuevas.length && !datos.cumplido) throw validacion('Solo se agregan evidencias cuando el hábito se cumplió');

  const existente = await prisma.registroCumplimiento.findUnique({
    where: { participanteId_fecha: { participanteId: participante.id, fecha: aDate(fecha) } },
    include: { _count: { select: { evidencias: true } } },
  });
  if (existente?.revisadoEn) throw conflicto('Ese registro ya fue revisado y no se puede cambiar');

  const totalEvidencias = (datos.cumplido ? existente?._count.evidencias ?? 0 : 0) + nuevas.length;
  if (datos.cumplido && reto.requiereEvidencia && totalEvidencias === 0) {
    throw validacion('Este reto exige una evidencia (foto) para registrar el cumplimiento', { campo: 'evidencias' });
  }
  if (totalEvidencias > MAX_EVIDENCIAS_POR_REGISTRO) {
    throw validacion(`Máximo ${MAX_EVIDENCIAS_POR_REGISTRO} evidencias por registro`);
  }

  const estado = datos.cumplido && reto.requiereAprobacion ? 'PENDIENTE' : 'APROBADO';
  const nota = datos.nota?.trim()?.slice(0, 500) || null;

  return prisma.$transaction(async (tx) => {
    // Si cambia a "no cumplido", sus evidencias anteriores ya no aplican.
    if (existente && !datos.cumplido) {
      await tx.evidencia.deleteMany({ where: { registroId: existente.id } });
    }
    const registro = await tx.registroCumplimiento.upsert({
      where: { participanteId_fecha: { participanteId: participante.id, fecha: aDate(fecha) } },
      create: {
        participanteId: participante.id,
        fecha: aDate(fecha),
        cumplido: datos.cumplido,
        estado,
        nota,
        evidencias: { create: nuevas },
      },
      update: {
        cumplido: datos.cumplido,
        estado,
        nota,
        automatico: false,
        registradoEn: new Date(),
        evidencias: { create: nuevas },
      },
      include: { evidencias: true },
    });
    const puntosRegistro = await recalcularPuntosRegistro(tx, participante, registro);
    const actualizado = await recalcularParticipante(tx, participante.id, { ahora });
    return { registro, participante: actualizado, puntosRegistro };
  });
}

/**
 * Aprueba o rechaza un cumplimiento pendiente (solo si el reto tiene activo
 * el toggle requiereAprobacion). Lo hace el creador del reto o un admin del
 * grupo, pero nunca sobre su propio registro.
 * Un rechazo cuenta como incumplimiento (resta puntosPorIncumplimiento).
 */
export async function revisarRegistro(revisorId, registroId, { aprobar, motivo = null }, { ahora = new Date() } = {}) {
  if (typeof aprobar !== 'boolean') throw validacion('"aprobar" debe ser true o false');
  const revisor = await obtenerUsuario(prisma, revisorId);
  const registro = await prisma.registroCumplimiento.findUnique({
    where: { id: registroId },
    include: { participante: { include: { reto: true } } },
  });
  if (!registro) throw noEncontrado('Registro no encontrado');
  await exigirGestionReto(prisma, registro.participante.reto, revisor);
  if (registro.participante.usuarioId === revisorId) throw sinPermiso('No puedes revisar tu propio registro');
  if (registro.estado !== 'PENDIENTE') throw conflicto('Ese registro no está pendiente de revisión');

  return prisma.$transaction(async (tx) => {
    const revisado = await tx.registroCumplimiento.update({
      where: { id: registroId },
      data: {
        estado: aprobar ? 'APROBADO' : 'RECHAZADO',
        revisadoPorId: revisorId,
        revisadoEn: new Date(),
        motivoRechazo: aprobar ? null : motivo?.trim()?.slice(0, 300) || null,
      },
      include: { evidencias: true },
    });
    const participante = await cargarParticipante(tx, registro.participanteId);
    const puntosRegistro = await recalcularPuntosRegistro(tx, participante, revisado);
    const actualizado = await recalcularParticipante(tx, participante.id, { ahora });
    return { registro: revisado, participante: actualizado, puntosRegistro };
  });
}

/** Cumplimientos pendientes de revisión que el usuario puede aprobar. */
export async function listarPendientesRevision(revisorId, { grupoId, retoId } = {}) {
  const revisor = await obtenerUsuario(prisma, revisorId);
  const filtroReto =
    revisor.rol === 'ADMIN_GENERAL'
      ? {}
      : {
          OR: [
            { creadorId: revisorId },
            { grupo: { miembros: { some: { usuarioId: revisorId, rol: 'ADMIN' } } } },
          ],
        };
  return prisma.registroCumplimiento.findMany({
    where: {
      estado: 'PENDIENTE',
      participante: {
        usuarioId: { not: revisorId },
        reto: { ...filtroReto, ...(grupoId ? { grupoId } : {}), ...(retoId ? { id: retoId } : {}) },
      },
    },
    include: {
      evidencias: true,
      participante: {
        select: {
          usuario: { select: { id: true, nombre: true, fotoUrl: true } },
          reto: { select: { id: true, nombre: true, grupoId: true } },
        },
      },
    },
    orderBy: { registradoEn: 'asc' },
  });
}

/**
 * RF-07: historial detallado (fecha y hora) de un participante en un reto.
 * Por defecto el del propio actor; en retos grupales los miembros pueden ver
 * el de los demás (RNF-04).
 */
export async function historialCumplimiento(actorId, retoId, { usuarioId = actorId, desde, hasta } = {}) {
  const actor = await obtenerUsuario(prisma, actorId);
  const reto = await prisma.reto.findUnique({ where: { id: retoId } });
  if (!reto) throw noEncontrado('Reto no encontrado');
  await exigirVerReto(prisma, reto, actor);
  return prisma.registroCumplimiento.findMany({
    where: {
      participante: { retoId, usuarioId },
      ...(desde || hasta ? { fecha: { ...(desde ? { gte: aDate(desde) } : {}), ...(hasta ? { lte: aDate(hasta) } : {}) } } : {}),
    },
    include: { evidencias: true },
    orderBy: { fecha: 'desc' },
  });
}

/**
 * Estado de cada reto para un día (por defecto hoy): pantalla "Inicio" y
 * "Mis hábitos". estadoHoy: COMPLETADO | NO_COMPLETADO | PENDIENTE_APROBACION |
 * RECHAZADO | PENDIENTE | PAUSADO | NO_PROGRAMADO.
 */
export async function retosDelDia(usuarioId, { fecha, ahora = new Date() } = {}) {
  const usuario = await obtenerUsuario(prisma, usuarioId);
  const dia = fecha ?? hoyEn(usuario.zonaHoraria, ahora);
  const participaciones = await prisma.participanteReto.findMany({
    where: { usuarioId, estado: { in: ['ACTIVO', 'PAUSADO'] }, reto: { estado: 'ACTIVO' } },
    include: {
      reto: { include: { grupo: { select: { id: true, nombre: true } } } },
      pausas: true,
      registros: { where: { fecha: { gte: aDate(inicioSemana(dia)), lte: aDate(sumarDias(inicioSemana(dia), 6)) } } },
    },
  });

  return participaciones.map((p) => {
    const { reto } = p;
    const registro = p.registros.find((r) => aTexto(r.fecha) === dia) ?? null;
    let estadoHoy;
    if (estaPausado(p.pausas, dia)) estadoHoy = 'PAUSADO';
    else if (registro) {
      estadoHoy = !registro.cumplido
        ? 'NO_COMPLETADO'
        : { APROBADO: 'COMPLETADO', PENDIENTE: 'PENDIENTE_APROBACION', RECHAZADO: 'RECHAZADO' }[registro.estado];
    } else if (dia < inicioExigible(reto, p) || !esDiaProgramado(reto, dia)) estadoHoy = 'NO_PROGRAMADO';
    else estadoHoy = 'PENDIENTE';

    const semana = {
      requeridos: requeridosEnSemana(reto, p, inicioSemana(dia)),
      cumplidos: p.registros.filter((r) => r.cumplido && r.estado === 'APROBADO').length,
    };
    return {
      participanteId: p.id,
      reto: {
        id: reto.id,
        nombre: reto.nombre,
        tipo: reto.tipo,
        frecuencia: reto.frecuencia,
        vecesPorSemana: reto.vecesPorSemana,
        diasSemana: reto.diasSemana,
        meta: reto.meta,
        grupo: reto.grupo,
        requiereEvidencia: reto.requiereEvidencia,
      },
      estadoHoy,
      registroId: registro?.id ?? null,
      semana,
      rachaActual: p.rachaActual,
      puntos: p.puntos,
    };
  });
}

/**
 * Calendario mensual (pantalla 09): por día, qué retos tocaban y cómo quedaron.
 * @param {string} usuarioId
 * @param {number} anio
 * @param {number} mes 1-12
 */
export async function calendarioMensual(usuarioId, anio, mes, { retoId } = {}) {
  if (!Number.isInteger(anio) || !Number.isInteger(mes) || mes < 1 || mes > 12) {
    throw validacion('Año o mes inválido');
  }
  await obtenerUsuario(prisma, usuarioId);
  const { inicio, fin } = limitesMes(anio, mes);
  const participaciones = await prisma.participanteReto.findMany({
    where: { usuarioId, ...(retoId ? { retoId } : {}) },
    include: {
      reto: { select: { id: true, nombre: true, frecuencia: true, diasSemana: true, fechaInicio: true, fechaFin: true, vecesPorSemana: true } },
      pausas: true,
      registros: { where: { fecha: { gte: aDate(inicio), lte: aDate(fin) } } },
    },
  });

  const dias = [];
  for (const dia of rangoDias(inicio, fin)) {
    const items = [];
    for (const p of participaciones) {
      const registro = p.registros.find((r) => aTexto(r.fecha) === dia);
      const programado = dia >= inicioExigible(p.reto, p) && esDiaProgramado(p.reto, dia) && !estaPausado(p.pausas, dia);
      if (!registro && !programado) continue;
      items.push({
        retoId: p.reto.id,
        nombre: p.reto.nombre,
        programado,
        registroId: registro?.id ?? null,
        cumplido: registro?.cumplido ?? null,
        estado: registro?.estado ?? null,
        registradoEn: registro?.registradoEn ?? null,
      });
    }
    dias.push({
      fecha: dia,
      conRegistro: items.some((i) => i.registroId),
      completados: items.filter((i) => i.cumplido && i.estado === 'APROBADO').length,
      retos: items,
    });
  }
  return { anio, mes, dias };
}
