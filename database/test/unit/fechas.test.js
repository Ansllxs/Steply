import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  aDate, aTexto, diaSemanaIso, esFechaValida, hoyEn, inicioSemana, limitesMes, rangoDias, sumarDias,
} from '../../src/utils/fechas.js';

test('conversión entre texto y Date sin corrimientos de zona horaria', () => {
  assert.equal(aTexto(aDate('2026-11-05')), '2026-11-05');
  assert.equal(aDate('2026-11-05').toISOString(), '2026-11-05T00:00:00.000Z');
});

test('valida fechas reales', () => {
  assert.ok(esFechaValida('2028-02-29'));
  assert.ok(!esFechaValida('2026-02-29'));
  assert.ok(!esFechaValida('2026-13-01'));
  assert.ok(!esFechaValida('05/11/2026'));
  assert.throws(() => aTexto('ayer'));
});

test('hoy depende de la zona horaria del usuario', () => {
  const instante = new Date('2026-11-06T03:00:00Z'); // 21:00 del 5 en Costa Rica
  assert.equal(hoyEn('America/Costa_Rica', instante), '2026-11-05');
  assert.equal(hoyEn('Europe/Madrid', instante), '2026-11-06');
});

test('días de la semana ISO y lunes de la semana', () => {
  assert.equal(diaSemanaIso('2026-11-02'), 1); // lunes
  assert.equal(diaSemanaIso('2026-11-08'), 7); // domingo
  assert.equal(inicioSemana('2026-11-08'), '2026-11-02');
  assert.equal(inicioSemana('2026-11-02'), '2026-11-02');
});

test('aritmética de fechas y meses', () => {
  assert.equal(sumarDias('2026-12-31', 1), '2027-01-01');
  assert.equal(sumarDias('2026-03-01', -1), '2026-02-28');
  assert.deepEqual([...rangoDias('2026-11-01', '2026-11-03')], ['2026-11-01', '2026-11-02', '2026-11-03']);
  assert.deepEqual(limitesMes(2026, 2), { inicio: '2026-02-01', fin: '2026-02-28' });
  assert.deepEqual(limitesMes(2026, 12), { inicio: '2026-12-01', fin: '2026-12-31' });
});
