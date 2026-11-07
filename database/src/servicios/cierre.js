// Cierre automático. El backend debe ejecutar `ejecutarCierreDiario()` una vez
// al día (p. ej. con node-cron poco después de la medianoche) y también se
// puede ejecutar más seguido: es IDEMPOTENTE, nunca aplica dos veces lo mismo.
//
// Qué hace, por cada participante activo de cada reto activo:
//  1. Sincroniza el estado PAUSADO/ACTIVO con sus pausas.
//  2. Marca como "no cumplido" (automático) los días programados que ya
//     cerraron sin registro, y resta puntosPorIncumplimiento.
//     En SEMANAL, al cerrar la semana resta por cada vez que faltó.
//  3. Aplica el castigo semanal a quien no alcanzó la meta de la semana.
//  4. Recalcula la racha (un día cerrado sin cumplir la rompe).
// Y finaliza los retos cuya fecha de fin ya cerró: castigo "al finalizar",
// completado, posición final e insignias.

import { prisma } from '../cliente.js';
import {
  diaCerrado,
  esDiaProgramado,
  estaPausado,
  inicioExigible,
  metaMinima,
  requeridosEnRango,
  requeridosEnSemana,
  ultimoDiaCerrado,
} from '../logica/reglas.js';
import { aDate, aTexto, hoyEn, inicioSemana, minFecha, rangoDias, sumarDias } from '../utils/fechas.js';
import { evaluarInsignias } from './insignias.js';
import { cargarParticipante, recalcularParticipante, recalcularPuntosRegistro } from './motor.js';
import { asignarPosiciones } from './puntos.js';

export async function ejecutarCierreDiario({ ahora = new Date() } = {}) {
  const resumen = { participantesProcesados: 0, incumplimientosAutomaticos: 0, castigosAplicados: 0, retosFinalizados: 0 };

  const retos = await prisma.reto.findMany({
    where: { estado: 'ACTIVO' },
    include: {
      creador: { select: { zonaHoraria: true } },
      participantes: { where: { estado: { in: ['ACTIVO', 'PAUSADO'] } }, select: { id: true } },
    },
  });

  for (const reto of retos) {
    let listoParaFinalizar = Boolean(reto.fechaFin);
    for (const { id } of reto.participantes) {
      const r = await prisma.$transaction((tx) => procesarParticipante(tx, id, { ahora }));
      resumen.participantesProcesados++;
      resumen.incumplimientosAutomaticos += r.incumplimientos;
      resumen.castigosAplicados += r.castigos;
      if (!r.periodoCerrado) listoParaFinalizar = false;
    }
    if (reto.participantes.length === 0 && reto.fechaFin) {
      listoParaFinalizar = diaCerrado(reto, reto.fechaFin, hoyEn(reto.creador.zonaHoraria, ahora));
    }
    if (listoParaFinalizar) {
      const f = await finalizarReto(reto.id, { ahora });
      resumen.castigosAplicados += f.castigos;
      resumen.retosFinalizados++;
    }
  }
  return resumen;
}

/** Procesa un participante. Devuelve cuántos incumplimientos/castigos generó. */
export async function procesarParticipante(tx, participanteId, { ahora = new Date() } = {}) {
  const p = await cargarParticipante(tx, participanteId);
  const { reto, usuario } = p;
  const hoy = hoyEn(usuario.zonaHoraria, ahora);
  const desde = aTexto(inicioExigible(reto, p));
  const cerradoHasta = minFecha(ultimoDiaCerrado(reto, hoy), reto.fechaFin);
  let incumplimientos = 0;
  let castigos = 0;

  // 1. Estado de pausa.
  const pausadoHoy = estaPausado(p.pausas, hoy);
  if (pausadoHoy !== (p.estado === 'PAUSADO')) {
    await tx.participanteReto.update({ where: { id: p.id }, data: { estado: pausadoHoy ? 'PAUSADO' : 'ACTIVO' } });
  }

  if (desde <= cerradoHasta) {
    // 2a. Días sin registro (DIARIA / DIAS_ESPECIFICOS).
    if (reto.frecuencia !== 'SEMANAL') {
      const existentes = new Set(
        (await tx.registroCumplimiento.findMany({
          where: { participanteId: p.id, fecha: { gte: aDate(desde), lte: aDate(cerradoHasta) } },
          select: { fecha: true },
        })).map((r) => aTexto(r.fecha)),
      );
      const faltantes = [...rangoDias(desde, cerradoHasta)].filter(
        (d) => esDiaProgramado(reto, d) && !estaPausado(p.pausas, d) && !existentes.has(d),
      );
      if (faltantes.length) {
        await tx.registroCumplimiento.createMany({
          data: faltantes.map((d) => ({
            participanteId: p.id, fecha: aDate(d), cumplido: false, estado: 'APROBADO', automatico: true,
          })),
          skipDuplicates: true, // por si el usuario registró al mismo tiempo
        });
        const creados = await tx.registroCumplimiento.findMany({
          where: { participanteId: p.id, automatico: true, fecha: { in: faltantes.map(aDate) } },
        });
        for (const r of creados) await recalcularPuntosRegistro(tx, p, r);
        incumplimientos += creados.length;
      }
    }

    // 2b y 3. Semanas cerradas: incumplimientos SEMANAL y castigo semanal.
    const evaluarSemanas = reto.frecuencia === 'SEMANAL' || reto.castigoPeriodo === 'SEMANAL';
    if (evaluarSemanas) {
      const registros = await tx.registroCumplimiento.findMany({
        where: { participanteId: p.id, cumplido: true, fecha: { gte: aDate(desde) } },
        select: { fecha: true, estado: true },
      });
      for (let lunes = inicioSemana(desde); lunes <= cerradoHasta; lunes = sumarDias(lunes, 7)) {
        const finSemana = minFecha(sumarDias(lunes, 6), reto.fechaFin);
        if (finSemana > cerradoHasta) break; // semana todavía abierta
        const requeridos = requeridosEnSemana(reto, p, lunes);
        if (requeridos === 0) continue;
        const enSemana = registros.filter((r) => aTexto(r.fecha) >= lunes && aTexto(r.fecha) <= finSemana);
        const aprobados = enSemana.filter((r) => r.estado === 'APROBADO').length;

        if (reto.frecuencia === 'SEMANAL' && reto.puntosPorIncumplimiento > 0 && aprobados < requeridos) {
          const faltan = requeridos - aprobados;
          const { count } = await tx.movimientoPuntos.createMany({
            data: [{
              usuarioId: p.usuarioId, participanteId: p.id, retoId: reto.id, grupoId: reto.grupoId,
              tipo: 'INCUMPLIMIENTO',
              puntos: -faltan * reto.puntosPorIncumplimiento,
              descripcion: `Faltaron ${faltan} de ${requeridos} veces en "${reto.nombre}" (semana del ${lunes})`,
              clave: `incumplimiento-semana:${lunes}`,
            }],
            skipDuplicates: true,
          });
          incumplimientos += count;
        }

        if (reto.castigoPeriodo === 'SEMANAL') {
          // Los pendientes de aprobación cuentan a favor (beneficio de la duda).
          const cumplidos = enSemana.filter((r) => r.estado !== 'RECHAZADO').length;
          if (cumplidos < metaMinima(reto, requeridos)) {
            castigos += await aplicarCastigo(tx, p, {
              periodo: 'SEMANAL', inicio: lunes, fin: finSemana, requeridos, cumplidos,
              clave: `castigo:${lunes}`,
            });
          }
        }
      }
    }
  }

  // 4. Racha y cachés.
  await recalcularParticipante(tx, p.id, { ahora });
  const periodoCerrado = Boolean(reto.fechaFin) && aTexto(reto.fechaFin) <= ultimoDiaCerrado(reto, hoy);
  return { incumplimientos, castigos, periodoCerrado };
}

async function aplicarCastigo(tx, p, { periodo, inicio, fin, requeridos, cumplidos, clave }) {
  const { reto } = p;
  const { count } = await tx.castigoAplicado.createMany({
    data: [{
      participanteId: p.id, periodo, periodoInicio: aDate(inicio), periodoFin: aDate(fin),
      requeridos, cumplidos, descripcion: reto.castigoDescripcion, puntos: reto.castigoPuntos,
    }],
    skipDuplicates: true,
  });
  if (count && reto.castigoPuntos > 0) {
    await tx.movimientoPuntos.createMany({
      data: [{
        usuarioId: p.usuarioId, participanteId: p.id, retoId: reto.id, grupoId: reto.grupoId,
        tipo: 'CASTIGO',
        puntos: -reto.castigoPuntos,
        descripcion: `Castigo en "${reto.nombre}" (${inicio} a ${fin})` +
          (reto.castigoDescripcion ? `: ${reto.castigoDescripcion}` : ''),
        clave,
      }],
      skipDuplicates: true,
    });
  }
  return count;
}

/**
 * Cierra un reto: castigo AL_FINALIZAR, completado, posiciones e insignias.
 * Lo llama el cierre diario cuando la fecha de fin ya cerró.
 */
export async function finalizarReto(retoId, { ahora = new Date() } = {}) {
  return prisma.$transaction(async (tx) => {
    const reto = await tx.reto.findUniqueOrThrow({ where: { id: retoId } });
    if (reto.estado !== 'ACTIVO') return { castigos: 0 };
    const participantes = await tx.participanteReto.findMany({
      where: { retoId, estado: { in: ['ACTIVO', 'PAUSADO'] } },
      include: { pausas: true, reto: true, usuario: true },
    });
    let castigos = 0;

    for (const p of participantes) {
      const desde = aTexto(inicioExigible(reto, p));
      const hasta = aTexto(reto.fechaFin);
      const requeridos = desde <= hasta ? requeridosEnRango(reto, p, desde, hasta) : 0;
      const registros = await tx.registroCumplimiento.findMany({
        where: { participanteId: p.id, cumplido: true, fecha: { gte: aDate(desde), lte: aDate(hasta) } },
        select: { estado: true },
      });
      const aprobados = registros.filter((r) => r.estado === 'APROBADO').length;
      const meta = metaMinima(reto, requeridos);
      const completado = requeridos === 0 ? null : aprobados >= meta;

      if (reto.castigoPeriodo === 'AL_FINALIZAR' && requeridos > 0) {
        const cumplidos = registros.filter((r) => r.estado !== 'RECHAZADO').length;
        if (cumplidos < meta) {
          castigos += await aplicarCastigo(tx, p, {
            periodo: 'AL_FINALIZAR', inicio: desde, fin: hasta, requeridos, cumplidos, clave: 'castigo:final',
          });
        }
      }
      await tx.participanteReto.update({ where: { id: p.id }, data: { completado } });
      await recalcularParticipante(tx, p.id, { ahora });
    }

    if (reto.tipo === 'GRUPAL') {
      const orden = await tx.participanteReto.findMany({
        where: { retoId, estado: { in: ['ACTIVO', 'PAUSADO'] } },
        orderBy: [{ puntos: 'desc' }, { mejorRacha: 'desc' }],
        select: { id: true, puntos: true },
      });
      for (const { id, posicion } of asignarPosiciones(orden)) {
        await tx.participanteReto.update({ where: { id }, data: { posicionFinal: posicion } });
      }
    }

    await tx.reto.update({ where: { id: retoId }, data: { estado: 'FINALIZADO', finalizadoEn: ahora } });
    for (const p of participantes) await evaluarInsignias(tx, p.usuarioId, { retoId });
    return { castigos };
  }, { timeout: 30_000 });
}
