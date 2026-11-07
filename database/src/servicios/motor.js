// Motor interno de recálculo. Lo usan los servicios de registros, retos y el
// cierre diario. Todas las funciones reciben `tx` (cliente de transacción de
// Prisma) para que el cambio de datos y el de cachés ocurran juntos.

import { calcularRacha } from '../logica/rachas.js';
import { puntosDeRegistro } from '../logica/reglas.js';
import { aDate, aTexto, hoyEn, inicioSemana } from '../utils/fechas.js';
import { evaluarInsignias } from './insignias.js';

/** Carga participante + reto + usuario + pausas. */
export async function cargarParticipante(tx, participanteId) {
  return tx.participanteReto.findUniqueOrThrow({
    where: { id: participanteId },
    include: { reto: true, usuario: true, pausas: true },
  });
}

/**
 * (Re)calcula los puntos que aporta un registro: borra sus movimientos
 * anteriores y crea el nuevo. Así editar un registro nunca duplica puntos.
 */
export async function recalcularPuntosRegistro(tx, participante, registro) {
  const { reto } = participante;
  let previosSemana = 0;
  if (reto.frecuencia === 'SEMANAL') {
    const lunes = inicioSemana(registro.fecha);
    previosSemana = await tx.registroCumplimiento.count({
      where: {
        participanteId: participante.id,
        cumplido: true,
        estado: 'APROBADO',
        fecha: { gte: aDate(lunes), lt: registro.fecha },
      },
    });
  }
  const puntos = puntosDeRegistro(reto, registro, previosSemana);

  await tx.movimientoPuntos.deleteMany({ where: { registroId: registro.id } });
  if (puntos !== 0) {
    await tx.movimientoPuntos.create({
      data: {
        usuarioId: participante.usuarioId,
        participanteId: participante.id,
        retoId: reto.id,
        grupoId: reto.grupoId,
        registroId: registro.id,
        tipo: puntos > 0 ? 'CUMPLIMIENTO' : 'INCUMPLIMIENTO',
        puntos,
        descripcion:
          puntos > 0
            ? `Cumplió "${reto.nombre}" el ${aTexto(registro.fecha)}`
            : `No cumplió "${reto.nombre}" el ${aTexto(registro.fecha)}`,
      },
    });
  }
  return puntos;
}

/**
 * Recalcula racha, bono de racha y cachés de puntos del participante y del
 * usuario. Idempotente: se puede llamar cuantas veces se quiera.
 */
export async function recalcularParticipante(tx, participanteId, { ahora = new Date() } = {}) {
  const participante = await cargarParticipante(tx, participanteId);
  const { reto, usuario } = participante;
  const hoy = hoyEn(usuario.zonaHoraria, ahora);

  const registros = await tx.registroCumplimiento.findMany({
    where: { participanteId, estado: { not: 'PENDIENTE' } },
    select: { fecha: true, cumplido: true, estado: true },
  });
  const ok = (r) => r.cumplido && r.estado === 'APROBADO';
  const racha = calcularRacha({
    reto,
    participante,
    cumplidos: registros.filter(ok).map((r) => r.fecha),
    fallidos: registros.filter((r) => !ok(r)).map((r) => r.fecha),
    hoy,
  });

  // Bono por racha (opcional, configurado por el creador del reto).
  if (reto.bonoRachaCada && reto.bonoRachaPuntos > 0 && racha.rachaActual > 0 &&
      racha.rachaActual % reto.bonoRachaCada === 0) {
    await tx.movimientoPuntos.createMany({
      data: [{
        usuarioId: participante.usuarioId,
        participanteId,
        retoId: reto.id,
        grupoId: reto.grupoId,
        tipo: 'BONO_RACHA',
        puntos: reto.bonoRachaPuntos,
        descripcion: `Racha de ${racha.rachaActual} ${racha.unidad} en "${reto.nombre}"`,
        // La fecha del último cumplimiento evita repetir el bono si la racha
        // se rompe y se vuelve a alcanzar el mismo número otro día.
        clave: `bono-racha:${racha.rachaActual}:${racha.ultimoCumplimiento}`,
      }],
      skipDuplicates: true,
    });
  }

  const actualizado = await tx.participanteReto.update({
    where: { id: participanteId },
    data: {
      rachaActual: racha.rachaActual,
      // La mejor racha nunca baja aunque se recalcule (p. ej. tras un rechazo).
      mejorRacha: Math.max(racha.mejorRacha, racha.rachaActual),
      ultimoCumplimiento: aDate(racha.ultimoCumplimiento),
      puntos: await sumaPuntos(tx, { participanteId }),
    },
  });
  await sincronizarPuntosUsuario(tx, participante.usuarioId);
  await evaluarInsignias(tx, participante.usuarioId, { retoId: reto.id });
  return { ...actualizado, unidadRacha: racha.unidad };
}

export async function sumaPuntos(tx, where) {
  const { _sum } = await tx.movimientoPuntos.aggregate({ where, _sum: { puntos: true } });
  return _sum.puntos ?? 0;
}

export async function sincronizarPuntosUsuario(tx, usuarioId) {
  const total = await sumaPuntos(tx, { usuarioId });
  await tx.usuario.update({ where: { id: usuarioId }, data: { puntosTotales: total } });
  return total;
}

/** Fecha de ingreso para un usuario nuevo en un reto. */
export function fechaIngresoPara(reto, usuario, ahora = new Date()) {
  const hoy = hoyEn(usuario.zonaHoraria, ahora);
  const inicio = aTexto(reto.fechaInicio);
  return aDate(inicio > hoy ? inicio : hoy);
}

