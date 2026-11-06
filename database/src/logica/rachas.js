// Cálculo puro de rachas consecutivas (RF-08, RN-02).
//
// Reglas:
//  * DIARIA / DIAS_ESPECIFICOS: la unidad es el día programado. Los días no
//    programados (p. ej. el martes en un reto de lunes/miércoles) no rompen
//    la racha.
//  * SEMANAL: la unidad es la semana (lunes a domingo). Una semana suma 1 si
//    se alcanzan las veces requeridas.
//  * Los días o semanas en pausa se saltan: ni suman ni rompen (racha congelada).
//  * Un día o semana todavía abierto (dentro de la ventana de registro) sin
//    cumplir no rompe la racha: el usuario aún está a tiempo. Pero si marcó
//    explícitamente "No lo completé" (o se lo rechazaron), sí la rompe.
//  * Solo cuentan los cumplimientos APROBADOS.

import { aTexto, inicioSemana, minFecha, rangoDias, sumarDias } from '../utils/fechas.js';
import {
  diaCerrado,
  esDiaProgramado,
  estaPausado,
  inicioExigible,
  requeridosEnSemana,
} from './reglas.js';

/**
 * @param {object} p
 * @param {object} p.reto
 * @param {{fechaIngreso, pausas}} p.participante
 * @param {Iterable<string|Date>} p.cumplidos fechas con cumplimiento aprobado
 * @param {Iterable<string|Date>} [p.fallidos] fechas marcadas como no cumplidas o rechazadas
 * @param {string} p.hoy 'YYYY-MM-DD' en la zona del usuario
 * @returns {{rachaActual:number, mejorRacha:number, ultimoCumplimiento:string|null, unidad:'dias'|'semanas'}}
 */
export function calcularRacha({ reto, participante, cumplidos, fallidos = [], hoy }) {
  const hechos = new Set([...cumplidos].map(aTexto));
  const fallas = new Set([...fallidos].map(aTexto));
  const desde = inicioExigible(reto, participante);
  const hasta = minFecha(hoy, reto.fechaFin);
  const ultimoCumplimiento = [...hechos].filter((d) => d >= desde && d <= hasta).sort().at(-1) ?? null;

  if (reto.frecuencia === 'SEMANAL') {
    return { ...rachaSemanal(reto, participante, hechos, desde, hasta, hoy), ultimoCumplimiento };
  }

  let racha = 0;
  let mejor = 0;
  for (const d of rangoDias(desde, hasta)) {
    if (!esDiaProgramado(reto, d) || estaPausado(participante.pausas, d)) continue;
    if (hechos.has(d)) {
      racha++;
      mejor = Math.max(mejor, racha);
    } else if (fallas.has(d) || diaCerrado(reto, d, hoy)) {
      racha = 0;
    }
  }
  return { rachaActual: racha, mejorRacha: mejor, ultimoCumplimiento, unidad: 'dias' };
}

function rachaSemanal(reto, participante, hechos, desde, hasta, hoy) {
  let racha = 0;
  let mejor = 0;
  if (desde > hasta) return { rachaActual: 0, mejorRacha: 0, unidad: 'semanas' };

  for (let lunes = inicioSemana(desde); lunes <= hasta; lunes = sumarDias(lunes, 7)) {
    const requeridos = requeridosEnSemana(reto, participante, lunes);
    if (requeridos === 0) continue; // semana completamente en pausa o fuera del reto

    let hechosSemana = 0;
    for (const d of rangoDias(lunes, sumarDias(lunes, 6))) {
      if (d >= desde && hechos.has(d)) hechosSemana++;
    }

    const domingo = minFecha(sumarDias(lunes, 6), reto.fechaFin);
    if (hechosSemana >= requeridos) {
      racha++;
      mejor = Math.max(mejor, racha);
    } else if (diaCerrado(reto, domingo, hoy)) {
      racha = 0;
    }
  }
  return { rachaActual: racha, mejorRacha: mejor, unidad: 'semanas' };
}
