// Reglas puras (sin base de datos) de los hábitos-reto: frecuencia, ventanas
// de registro, pausas, días exigidos y puntos. Las usan los servicios y se
// prueban en test/unit.
//
// "reto" es un objeto con la forma del modelo Reto (fechas como Date o texto).
// "participante" necesita { fechaIngreso, pausas: [{ fechaInicio, fechaFin }] }.

import {
  aTexto,
  diaSemanaIso,
  inicioSemana,
  maxFecha,
  minFecha,
  rangoDias,
  sumarDias,
} from '../utils/fechas.js';

/** El reto exige (o permite, en SEMANAL) registrar ese día. */
export function esDiaProgramado(reto, fecha) {
  const f = aTexto(fecha);
  if (f < aTexto(reto.fechaInicio)) return false;
  if (reto.fechaFin && f > aTexto(reto.fechaFin)) return false;
  if (reto.frecuencia === 'DIAS_ESPECIFICOS') {
    return reto.diasSemana.includes(diaSemanaIso(f));
  }
  return true; // DIARIA y SEMANAL: cualquier día del rango
}

/** El participante tenía una pausa vigente ese día (RN-02). */
export function estaPausado(pausas = [], fecha) {
  const f = aTexto(fecha);
  return pausas.some(
    (p) => f >= aTexto(p.fechaInicio) && (p.fechaFin == null || f <= aTexto(p.fechaFin)),
  );
}

/** Primer día exigible para el participante. */
export function inicioExigible(reto, participante) {
  return maxFecha(reto.fechaInicio, participante.fechaIngreso);
}

/** Un día queda "cerrado" cuando ya pasó su ventana de registro. */
export function diaCerrado(reto, fecha, hoy) {
  return sumarDias(fecha, reto.diasGraciaRegistro ?? 0) < aTexto(hoy);
}

/** Último día cuya ventana de registro ya cerró. */
export function ultimoDiaCerrado(reto, hoy) {
  return sumarDias(hoy, -(reto.diasGraciaRegistro ?? 0) - 1);
}

/** Días en los que hoy todavía se puede registrar. */
export function ventanaRegistro(reto, hoy) {
  return { desde: sumarDias(hoy, -(reto.diasGraciaRegistro ?? 0)), hasta: aTexto(hoy) };
}

/** Meta mínima según porcentajeMinimoCumplimiento. */
export function metaMinima(reto, requeridos) {
  if (requeridos <= 0) return 0;
  return Math.ceil((requeridos * (reto.porcentajeMinimoCumplimiento ?? 100)) / 100);
}

/**
 * Cuántos cumplimientos se le exigen al participante en una semana.
 * DIARIA / DIAS_ESPECIFICOS: días programados de la semana, sin contar pausas
 * ni días fuera del reto. SEMANAL: vecesPorSemana proporcional a los días
 * activos (una semana con 3 de 7 días pausados exige menos).
 */
export function requeridosEnSemana(reto, participante, lunes) {
  const desde = maxFecha(lunes, inicioExigible(reto, participante));
  const hasta = minFecha(sumarDias(lunes, 6), reto.fechaFin);
  let activos = 0;
  let programados = 0;
  for (const d of rangoDias(desde, hasta)) {
    if (estaPausado(participante.pausas, d)) continue;
    activos++;
    if (esDiaProgramado(reto, d)) programados++;
  }
  if (reto.frecuencia === 'SEMANAL') {
    return activos === 0 ? 0 : Math.ceil((reto.vecesPorSemana * activos) / 7);
  }
  return programados;
}

/** Cuántos cumplimientos se exigen entre dos fechas (sumando por semana). */
export function requeridosEnRango(reto, participante, desde, hasta) {
  if (reto.frecuencia !== 'SEMANAL') {
    let total = 0;
    const ini = maxFecha(desde, inicioExigible(reto, participante));
    const fin = minFecha(hasta, reto.fechaFin);
    for (const d of rangoDias(ini, fin)) {
      if (esDiaProgramado(reto, d) && !estaPausado(participante.pausas, d)) total++;
    }
    return total;
  }
  let total = 0;
  for (let lunes = inicioSemana(desde); lunes <= aTexto(hasta); lunes = sumarDias(lunes, 7)) {
    total += requeridosEnSemana(reto, participante, lunes);
  }
  return total;
}

/**
 * Puntos que genera un registro diario.
 * @param {object} reto
 * @param {{cumplido: boolean, estado: 'APROBADO'|'PENDIENTE'|'RECHAZADO'}} registro
 * @param {number} cumplidosPreviosSemana  (solo SEMANAL) cumplimientos ya
 *        contados esa semana sin incluir este registro.
 * @returns {number} positivo, negativo o 0
 */
export function puntosDeRegistro(reto, registro, cumplidosPreviosSemana = 0) {
  if (registro.estado === 'PENDIENTE') return 0;
  const cuentaComoCumplido = registro.cumplido && registro.estado === 'APROBADO';
  if (cuentaComoCumplido) {
    // En SEMANAL solo suman las primeras N veces de la semana.
    if (reto.frecuencia === 'SEMANAL' && cumplidosPreviosSemana >= reto.vecesPorSemana) return 0;
    return reto.puntosPorCumplimiento;
  }
  // En SEMANAL un "no lo completé" no resta: se puede cumplir otro día.
  // Lo que falte se resta al cerrar la semana.
  if (reto.frecuencia === 'SEMANAL') return 0;
  return -reto.puntosPorIncumplimiento;
}
