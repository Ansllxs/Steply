// Cierre automático: incumplimientos sin registro, castigos personalizados,
// rachas y finalización de retos. Debe ser idempotente.

import assert from 'node:assert/strict';
import { after, beforeEach, describe, test } from 'node:test';
import { ejecutarCierreDiario } from '../../src/servicios/cierre.js';
import * as puntos from '../../src/servicios/puntos.js';
import * as registros from '../../src/servicios/registros.js';
import * as retos from '../../src/servicios/retos.js';
import { crearGrupo, crearUsuario, en, limpiarBD, prisma, sembrarInsignias } from '../helpers.js';

const LUNES = '2026-11-02';
const total = async (u) => (await prisma.usuario.findUnique({ where: { id: u.id } })).puntosTotales;
const cumplir = (u, r, dia) => registros.registrarCumplimiento(u.id, r.id, { cumplido: true }, { ahora: en(dia) });

beforeEach(async () => {
  await limpiarBD();
  await sembrarInsignias();
});
after(() => prisma.$disconnect());

describe('días sin registro', () => {
  test('se marcan como no cumplidos, restan puntos y rompen la racha (idempotente)', async () => {
    const a = await crearUsuario();
    const r = await retos.crearReto(a.id, { nombre: 'x', frecuencia: 'DIARIA', puntosPorCumplimiento: 10, puntosPorIncumplimiento: 3 }, { ahora: en(LUNES) });
    await cumplir(a, r, LUNES);
    await cumplir(a, r, '2026-11-03');
    // No registra el 4 ni el 5; el cierre corre el 6.
    const res = await ejecutarCierreDiario({ ahora: en('2026-11-06', '00:30') });
    assert.equal(res.incumplimientosAutomaticos, 2);
    await ejecutarCierreDiario({ ahora: en('2026-11-06', '01:00') });
    assert.equal(await prisma.registroCumplimiento.count({ where: { automatico: true } }), 2);
    assert.equal(await total(a), 20 - 6);
    const p = await prisma.participanteReto.findFirst();
    assert.deepEqual([p.rachaActual, p.mejorRacha], [0, 2]);
    assert.deepEqual(await puntos.verificarCachesPuntos(), []);
  });

  test('no penaliza días pausados ni días no programados', async () => {
    const a = await crearUsuario();
    const r = await retos.crearReto(a.id, { nombre: 'x', frecuencia: 'DIAS_ESPECIFICOS', diasSemana: [1, 5], puntosPorIncumplimiento: 3 }, { ahora: en(LUNES) });
    await cumplir(a, r, LUNES);
    await retos.pausarParticipacion(a.id, r.id, { hasta: '2026-11-06' }, { ahora: en('2026-11-03') });
    await ejecutarCierreDiario({ ahora: en('2026-11-08') });
    assert.equal(await prisma.registroCumplimiento.count({ where: { automatico: true } }), 0);
    const p = await prisma.participanteReto.findFirst();
    assert.equal(p.estado, 'ACTIVO'); // la pausa terminó el 6
    assert.equal(p.rachaActual, 1);
  });

  test('SEMANAL: al cerrar la semana se resta por cada vez que faltó', async () => {
    const a = await crearUsuario();
    const r = await retos.crearReto(a.id, { nombre: 'Gym', frecuencia: 'SEMANAL', vecesPorSemana: 3, puntosPorCumplimiento: 20, puntosPorIncumplimiento: 5 }, { ahora: en(LUNES) });
    await cumplir(a, r, '2026-11-04');
    await ejecutarCierreDiario({ ahora: en('2026-11-08') }); // domingo: la semana sigue abierta
    assert.equal(await total(a), 20);
    await ejecutarCierreDiario({ ahora: en('2026-11-09') });
    await ejecutarCierreDiario({ ahora: en('2026-11-09', '18:00') });
    assert.equal(await total(a), 20 - 2 * 5);
  });
});

describe('castigos personalizables (RF-16)', () => {
  test('castigo semanal con descripción y puntos a quien no alcanza la meta', async () => {
    const [a, b] = [await crearUsuario(), await crearUsuario()];
    const g = await crearGrupo([a, b]);
    const r = await retos.crearReto(a.id, {
      grupoId: g.id, nombre: 'Estudiar', frecuencia: 'DIARIA', puntosPorCumplimiento: 10,
      porcentajeMinimoCumplimiento: 70, castigo: { descripcion: 'Invitar el café', puntos: 25 },
    }, { ahora: en(LUNES) });
    for (const d of ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06']) await cumplir(a, r, d); // 5/7 ≥ 70 %
    for (const d of ['2026-11-02', '2026-11-03']) await cumplir(b, r, d); // 2/7
    await ejecutarCierreDiario({ ahora: en('2026-11-09') });
    await ejecutarCierreDiario({ ahora: en('2026-11-10') });

    const castigos = await puntos.castigosReto(a.id, r.id);
    assert.equal(castigos.length, 1);
    assert.equal(castigos[0].participante.usuario.id, b.id);
    assert.equal(castigos[0].descripcion, 'Invitar el café');
    assert.deepEqual([castigos[0].requeridos, castigos[0].cumplidos], [7, 2]);
    assert.equal(await total(b), 20 - 25);
    const saldado = await puntos.saldarCastigo(a.id, castigos[0].id);
    assert.equal(saldado.saldado, true);
  });

  test('castigo solo con descripción (sin puntos) igual queda registrado', async () => {
    const a = await crearUsuario();
    const r = await retos.crearReto(a.id, { nombre: 'x', frecuencia: 'DIARIA', castigo: { descripcion: '20 sentadillas' } }, { ahora: en(LUNES) });
    await ejecutarCierreDiario({ ahora: en('2026-11-09') });
    assert.equal(await prisma.castigoAplicado.count(), 1);
    assert.equal(await prisma.movimientoPuntos.count({ where: { tipo: 'CASTIGO' } }), 0);
    assert.ok(r);
  });
});

describe('finalización del reto', () => {
  test('posiciones finales, completado, castigo al finalizar e insignias', async () => {
    const [a, b, c] = [await crearUsuario(), await crearUsuario(), await crearUsuario()];
    const g = await crearGrupo([a, b, c]);
    const r = await retos.crearReto(a.id, {
      grupoId: g.id, nombre: 'Semana sana', frecuencia: 'DIARIA', fechaFin: '2026-11-04',
      puntosPorCumplimiento: 40, porcentajeMinimoCumplimiento: 60,
      castigo: { periodo: 'AL_FINALIZAR', descripcion: 'Pagar la pizza', puntos: 10 },
    }, { ahora: en(LUNES) });
    for (const d of ['2026-11-02', '2026-11-03', '2026-11-04']) await cumplir(a, r, d); // 3/3
    for (const d of ['2026-11-02', '2026-11-03']) await cumplir(b, r, d); // 2/3 ≥ 60 %
    await cumplir(c, r, '2026-11-02'); // 1/3

    // El 4 de noviembre todavía está abierto: no se finaliza.
    assert.equal((await ejecutarCierreDiario({ ahora: en('2026-11-04', '23:00') })).retosFinalizados, 0);
    const res = await ejecutarCierreDiario({ ahora: en('2026-11-05') });
    assert.equal(res.retosFinalizados, 1);
    await ejecutarCierreDiario({ ahora: en('2026-11-06') }); // ya no vuelve a procesarlo

    const final = await prisma.participanteReto.findMany({ where: { retoId: r.id }, orderBy: { posicionFinal: 'asc' } });
    assert.deepEqual(final.map((p) => [p.usuarioId, p.posicionFinal, p.completado]), [
      [a.id, 1, true], [b.id, 2, true], [c.id, 3, false],
    ]);
    assert.equal((await prisma.reto.findUnique({ where: { id: r.id } })).estado, 'FINALIZADO');
    assert.equal(await prisma.castigoAplicado.count({ where: { periodo: 'AL_FINALIZAR' } }), 1);
    assert.equal(await total(c), 40 - 10);

    const resumenA = await puntos.resumenUsuario(a.id);
    assert.equal(resumenA.retosGanados, 1);
    assert.deepEqual(resumenA.insignias.map((i) => i.codigo).sort(), ['completado-1', 'ganado-1', 'puntos-100', 'racha-3']);
    // Un reto finalizado ya no admite registros
    await assert.rejects(cumplir(a, r, '2026-11-05'), (e) => e.codigo === 'NO_ENCONTRADO' || e.codigo === 'FUERA_DE_TIEMPO');
  });
});
