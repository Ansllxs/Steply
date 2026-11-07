import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calcularRacha } from '../../src/logica/rachas.js';

const diaria = { frecuencia: 'DIARIA', diasSemana: [], fechaInicio: '2026-11-02', fechaFin: null, diasGraciaRegistro: 0 };
const p = { fechaIngreso: '2026-11-02', pausas: [] };

test('racha de días consecutivos', () => {
  const r = calcularRacha({ reto: diaria, participante: p, cumplidos: ['2026-11-02', '2026-11-03', '2026-11-04'], hoy: '2026-11-04' });
  assert.deepEqual(r, { rachaActual: 3, mejorRacha: 3, ultimoCumplimiento: '2026-11-04', unidad: 'dias' });
});

test('hoy sin registrar no rompe la racha (todavía hay tiempo)', () => {
  const r = calcularRacha({ reto: diaria, participante: p, cumplidos: ['2026-11-02', '2026-11-03'], hoy: '2026-11-04' });
  assert.equal(r.rachaActual, 2);
});

test('un día cerrado sin cumplir rompe la racha y se conserva la mejor', () => {
  const r = calcularRacha({
    reto: diaria, participante: p,
    cumplidos: ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-06'], hoy: '2026-11-06',
  });
  assert.equal(r.rachaActual, 1);
  assert.equal(r.mejorRacha, 3);
});

test('días de gracia: ayer sin registrar no rompe todavía', () => {
  const r = calcularRacha({ reto: { ...diaria, diasGraciaRegistro: 1 }, participante: p, cumplidos: ['2026-11-02', '2026-11-03'], hoy: '2026-11-05' });
  assert.equal(r.rachaActual, 2);
});

test('días no programados no rompen la racha', () => {
  const lmv = { ...diaria, frecuencia: 'DIAS_ESPECIFICOS', diasSemana: [1, 3, 5] };
  const r = calcularRacha({ reto: lmv, participante: p, cumplidos: ['2026-11-02', '2026-11-04', '2026-11-06', '2026-11-09'], hoy: '2026-11-10' });
  assert.equal(r.rachaActual, 4);
});

test('RN-02: la pausa congela la racha sin romperla', () => {
  const pausado = { ...p, pausas: [{ fechaInicio: '2026-11-04', fechaFin: '2026-11-06' }] };
  const r = calcularRacha({ reto: diaria, participante: pausado, cumplidos: ['2026-11-02', '2026-11-03', '2026-11-07'], hoy: '2026-11-07' });
  assert.equal(r.rachaActual, 3);
});

test('racha semanal: cuenta semanas que alcanzan la meta', () => {
  const semanal = { ...diaria, frecuencia: 'SEMANAL', vecesPorSemana: 2 };
  const cumplidos = ['2026-11-02', '2026-11-05', '2026-11-10', '2026-11-12', '2026-11-17'];
  const r = calcularRacha({ reto: semanal, participante: p, cumplidos, hoy: '2026-11-18' });
  // Semana 1 y 2 cumplidas, semana 3 en curso con 1/2 (no rompe ni suma).
  assert.deepEqual([r.rachaActual, r.mejorRacha, r.unidad], [2, 2, 'semanas']);
  const rota = calcularRacha({ reto: semanal, participante: p, cumplidos: ['2026-11-02', '2026-11-05', '2026-11-10'], hoy: '2026-11-17' });
  assert.equal(rota.rachaActual, 0);
  assert.equal(rota.mejorRacha, 1);
});

test('sin cumplimientos la racha es 0', () => {
  const r = calcularRacha({ reto: diaria, participante: p, cumplidos: [], hoy: '2026-11-02' });
  assert.deepEqual(r, { rachaActual: 0, mejorRacha: 0, ultimoCumplimiento: null, unidad: 'dias' });
});

test('marcar "No lo completé" hoy rompe la racha de inmediato', () => {
  const r = calcularRacha({
    reto: diaria, participante: p, cumplidos: ['2026-11-02', '2026-11-03'], fallidos: ['2026-11-04'], hoy: '2026-11-04',
  });
  assert.deepEqual([r.rachaActual, r.mejorRacha], [0, 2]);
});
