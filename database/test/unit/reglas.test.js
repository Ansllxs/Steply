import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  diaCerrado, esDiaProgramado, estaPausado, metaMinima, puntosDeRegistro, requeridosEnRango,
  requeridosEnSemana, ventanaRegistro,
} from '../../src/logica/reglas.js';

const base = {
  frecuencia: 'DIARIA', vecesPorSemana: null, diasSemana: [], fechaInicio: '2026-11-02', fechaFin: null,
  diasGraciaRegistro: 0, porcentajeMinimoCumplimiento: 100, puntosPorCumplimiento: 10, puntosPorIncumplimiento: 4,
};
const participante = { fechaIngreso: '2026-11-02', pausas: [] };

test('días programados según la frecuencia', () => {
  const lmv = { ...base, frecuencia: 'DIAS_ESPECIFICOS', diasSemana: [1, 3, 5] };
  assert.ok(esDiaProgramado(lmv, '2026-11-02')); // lunes
  assert.ok(!esDiaProgramado(lmv, '2026-11-03')); // martes
  assert.ok(!esDiaProgramado(base, '2026-11-01')); // antes del inicio
  assert.ok(!esDiaProgramado({ ...base, fechaFin: '2026-11-05' }, '2026-11-06'));
  assert.ok(esDiaProgramado({ ...base, frecuencia: 'SEMANAL', vecesPorSemana: 3 }, '2026-11-04'));
});

test('pausas inclusivas y abiertas', () => {
  const pausas = [{ fechaInicio: '2026-11-03', fechaFin: '2026-11-04' }, { fechaInicio: '2026-11-10', fechaFin: null }];
  assert.ok(!estaPausado(pausas, '2026-11-02'));
  assert.ok(estaPausado(pausas, '2026-11-03'));
  assert.ok(estaPausado(pausas, '2026-11-04'));
  assert.ok(!estaPausado(pausas, '2026-11-05'));
  assert.ok(estaPausado(pausas, '2030-01-01'));
});

test('ventana de registro y días cerrados con días de gracia', () => {
  assert.deepEqual(ventanaRegistro(base, '2026-11-05'), { desde: '2026-11-05', hasta: '2026-11-05' });
  const gracia = { ...base, diasGraciaRegistro: 2 };
  assert.deepEqual(ventanaRegistro(gracia, '2026-11-05'), { desde: '2026-11-03', hasta: '2026-11-05' });
  assert.ok(diaCerrado(base, '2026-11-04', '2026-11-05'));
  assert.ok(!diaCerrado(gracia, '2026-11-04', '2026-11-05'));
});

test('requeridos por semana: diaria, días específicos y semanal proporcional a pausas', () => {
  assert.equal(requeridosEnSemana(base, participante, '2026-11-02'), 7);
  const lmv = { ...base, frecuencia: 'DIAS_ESPECIFICOS', diasSemana: [1, 3, 5] };
  assert.equal(requeridosEnSemana(lmv, participante, '2026-11-02'), 3);
  const semanal = { ...base, frecuencia: 'SEMANAL', vecesPorSemana: 3 };
  assert.equal(requeridosEnSemana(semanal, participante, '2026-11-02'), 3);
  const pausado = { ...participante, pausas: [{ fechaInicio: '2026-11-02', fechaFin: '2026-11-05' }] };
  assert.equal(requeridosEnSemana(semanal, pausado, '2026-11-02'), 2); // ceil(3 * 3/7)
  assert.equal(requeridosEnSemana(base, pausado, '2026-11-02'), 3);
  // Ingreso a mitad de semana
  assert.equal(requeridosEnSemana(base, { fechaIngreso: '2026-11-06', pausas: [] }, '2026-11-02'), 3);
  assert.equal(requeridosEnRango(base, participante, '2026-11-02', '2026-11-15'), 14);
});

test('meta mínima según porcentaje', () => {
  assert.equal(metaMinima({ porcentajeMinimoCumplimiento: 70 }, 7), 5);
  assert.equal(metaMinima({ porcentajeMinimoCumplimiento: 100 }, 7), 7);
  assert.equal(metaMinima({ porcentajeMinimoCumplimiento: 50 }, 0), 0);
});

test('puntos de un registro', () => {
  assert.equal(puntosDeRegistro(base, { cumplido: true, estado: 'APROBADO' }), 10);
  assert.equal(puntosDeRegistro(base, { cumplido: false, estado: 'APROBADO' }), -4);
  assert.equal(puntosDeRegistro(base, { cumplido: true, estado: 'PENDIENTE' }), 0);
  assert.equal(puntosDeRegistro(base, { cumplido: true, estado: 'RECHAZADO' }), -4);
  const semanal = { ...base, frecuencia: 'SEMANAL', vecesPorSemana: 2 };
  assert.equal(puntosDeRegistro(semanal, { cumplido: true, estado: 'APROBADO' }, 1), 10);
  assert.equal(puntosDeRegistro(semanal, { cumplido: true, estado: 'APROBADO' }, 2), 0); // ya cumplió la meta
  assert.equal(puntosDeRegistro(semanal, { cumplido: false, estado: 'APROBADO' }), 0);
});
