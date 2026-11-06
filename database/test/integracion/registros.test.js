import assert from 'node:assert/strict';
import { after, beforeEach, describe, test } from 'node:test';
import { crearAlmacenamientoMemoria } from '../../src/almacenamiento/cloudinary.js';
import * as evidencias from '../../src/servicios/evidencias.js';
import * as puntos from '../../src/servicios/puntos.js';
import * as registros from '../../src/servicios/registros.js';
import * as retos from '../../src/servicios/retos.js';
import { crearGrupo, crearUsuario, en, fallaCon, foto, limpiarBD, prisma, sembrarInsignias } from '../helpers.js';

const LUNES = '2026-11-02';
const total = async (u) => (await prisma.usuario.findUnique({ where: { id: u.id } })).puntosTotales;

beforeEach(async () => {
  await limpiarBD();
  await sembrarInsignias();
});
after(() => prisma.$disconnect());

describe('registro diario (CU-05)', () => {
  test('cumplir suma puntos y racha; no cumplir resta', async () => {
    const a = await crearUsuario();
    const r = await retos.crearReto(a.id, {
      nombre: 'Leer', frecuencia: 'DIARIA', puntosPorCumplimiento: 10, puntosPorIncumplimiento: 4,
    }, { ahora: en(LUNES) });
    const d1 = await registros.registrarCumplimiento(a.id, r.id, { cumplido: true }, { ahora: en(LUNES) });
    assert.equal(d1.puntosRegistro, 10);
    assert.equal(d1.participante.rachaActual, 1);
    const d2 = await registros.registrarCumplimiento(a.id, r.id, { cumplido: true }, { ahora: en('2026-11-03') });
    assert.equal(d2.participante.rachaActual, 2);
    const d3 = await registros.registrarCumplimiento(a.id, r.id, { cumplido: false }, { ahora: en('2026-11-04') });
    assert.equal(d3.puntosRegistro, -4);
    assert.equal(d3.participante.rachaActual, 0);
    assert.equal(d3.participante.mejorRacha, 2);
    assert.equal(await total(a), 16);
  });

  test('corregir el registro del mismo día no duplica puntos', async () => {
    const a = await crearUsuario();
    const r = await retos.crearReto(a.id, { nombre: 'x', frecuencia: 'DIARIA', puntosPorCumplimiento: 10, puntosPorIncumplimiento: 3 }, { ahora: en(LUNES) });
    await registros.registrarCumplimiento(a.id, r.id, { cumplido: false }, { ahora: en(LUNES) });
    await registros.registrarCumplimiento(a.id, r.id, { cumplido: true }, { ahora: en(LUNES, '20:00') });
    await registros.registrarCumplimiento(a.id, r.id, { cumplido: true }, { ahora: en(LUNES, '21:00') });
    assert.equal(await total(a), 10);
    assert.equal(await prisma.movimientoPuntos.count(), 1);
    assert.equal(await prisma.registroCumplimiento.count(), 1);
  });

  test('CU-05 2a: fuera del tiempo establecido', async () => {
    const a = await crearUsuario();
    const r = await retos.crearReto(a.id, { nombre: 'x', frecuencia: 'DIAS_ESPECIFICOS', diasSemana: [1, 3] }, { ahora: en(LUNES) });
    const hoy = { ahora: en('2026-11-04') }; // miércoles
    await fallaCon(registros.registrarCumplimiento(a.id, r.id, { cumplido: true, fecha: '2026-11-05' }, hoy), 'FUERA_DE_TIEMPO', assert);
    await fallaCon(registros.registrarCumplimiento(a.id, r.id, { cumplido: true, fecha: LUNES }, hoy), 'FUERA_DE_TIEMPO', assert);
    await fallaCon(registros.registrarCumplimiento(a.id, r.id, { cumplido: true }, { ahora: en('2026-11-03') }), 'FUERA_DE_TIEMPO', assert); // martes no toca
    await registros.registrarCumplimiento(a.id, r.id, { cumplido: true }, hoy);
  });

  test('días de gracia permiten registrar ayer', async () => {
    const a = await crearUsuario();
    const r = await retos.crearReto(a.id, { nombre: 'x', frecuencia: 'DIARIA', diasGraciaRegistro: 1 }, { ahora: en(LUNES) });
    const res = await registros.registrarCumplimiento(a.id, r.id, { cumplido: true, fecha: LUNES }, { ahora: en('2026-11-03') });
    assert.equal(res.registro.fecha.toISOString().slice(0, 10), LUNES);
  });

  test('"hoy" se calcula en la zona horaria del usuario', async () => {
    const a = await crearUsuario(); // America/Costa_Rica
    const r = await retos.crearReto(a.id, { nombre: 'x', frecuencia: 'DIARIA' }, { ahora: en(LUNES) });
    // 02:00 UTC del martes = 20:00 del lunes en Costa Rica
    const res = await registros.registrarCumplimiento(a.id, r.id, { cumplido: true }, { ahora: new Date('2026-11-03T02:00:00Z') });
    assert.equal(res.registro.fecha.toISOString().slice(0, 10), LUNES);
  });

  test('frecuencia SEMANAL: solo suman las primeras N veces', async () => {
    const a = await crearUsuario();
    const r = await retos.crearReto(a.id, { nombre: 'Gym', frecuencia: 'SEMANAL', vecesPorSemana: 2, puntosPorCumplimiento: 20 }, { ahora: en(LUNES) });
    for (const d of ['2026-11-02', '2026-11-03', '2026-11-04']) {
      await registros.registrarCumplimiento(a.id, r.id, { cumplido: true }, { ahora: en(d) });
    }
    assert.equal(await total(a), 40);
  });

  test('RF-07: historial con fecha y hora; RF-09: calendario mensual', async () => {
    const a = await crearUsuario();
    const r = await retos.crearReto(a.id, { nombre: 'Leer', frecuencia: 'DIARIA' }, { ahora: en(LUNES) });
    await registros.registrarCumplimiento(a.id, r.id, { cumplido: true, nota: 'Cap. 3' }, { ahora: en(LUNES) });
    const h = await registros.historialCumplimiento(a.id, r.id);
    assert.equal(h.length, 1);
    assert.ok(h[0].registradoEn instanceof Date);
    assert.equal(h[0].nota, 'Cap. 3');

    const cal = await registros.calendarioMensual(a.id, 2026, 11);
    assert.equal(cal.dias.length, 30);
    assert.equal(cal.dias[0].retos.length, 0); // 1 de noviembre: antes del inicio
    assert.equal(cal.dias[1].conRegistro, true);
    assert.equal(cal.dias[1].completados, 1);
    assert.equal(cal.dias[2].retos[0].programado, true);
    assert.equal(cal.dias[2].conRegistro, false);
  });

  test('retos del día para el dashboard', async () => {
    const a = await crearUsuario();
    const leer = await retos.crearReto(a.id, { nombre: 'Leer', frecuencia: 'DIARIA' }, { ahora: en(LUNES) });
    await retos.crearReto(a.id, { nombre: 'Agua', frecuencia: 'DIARIA' }, { ahora: en(LUNES) });
    await retos.crearReto(a.id, { nombre: 'Martes', frecuencia: 'DIAS_ESPECIFICOS', diasSemana: [2] }, { ahora: en(LUNES) });
    await registros.registrarCumplimiento(a.id, leer.id, { cumplido: true }, { ahora: en(LUNES) });
    const hoy = await registros.retosDelDia(a.id, { ahora: en(LUNES) });
    const estado = Object.fromEntries(hoy.map((x) => [x.reto.nombre, x.estadoHoy]));
    assert.deepEqual(estado, { Leer: 'COMPLETADO', Agua: 'PENDIENTE', Martes: 'NO_PROGRAMADO' });
  });
});

describe('evidencias (RF-14, CU-08)', () => {
  test('si el reto exige evidencia, sin foto no se registra', async () => {
    const a = await crearUsuario();
    const r = await retos.crearReto(a.id, { nombre: 'x', frecuencia: 'DIARIA', requiereEvidencia: true }, { ahora: en(LUNES) });
    await fallaCon(registros.registrarCumplimiento(a.id, r.id, { cumplido: true }, { ahora: en(LUNES) }), 'VALIDACION', assert);
    const ok = await registros.registrarCumplimiento(a.id, r.id, { cumplido: true, evidencias: [foto()] }, { ahora: en(LUNES) });
    assert.equal(ok.registro.evidencias.length, 1);
    // "No lo completé" no necesita foto
    await registros.registrarCumplimiento(a.id, r.id, { cumplido: false }, { ahora: en('2026-11-03') });
  });

  test('CU-08 2a: formato o tamaño inválido', async () => {
    assert.throws(() => evidencias.validarArchivo({ mimetype: 'application/pdf', size: 10 }), /Formato/);
    assert.throws(() => evidencias.validarArchivo({ mimetype: 'image/png', size: 6 * 1024 * 1024 }), /5 MB/);
    assert.equal(evidencias.validarArchivo({ mimetype: 'image/jpeg', size: 100 }), 'jpg');
    const a = await crearUsuario();
    const r = await retos.crearReto(a.id, { nombre: 'x', frecuencia: 'DIARIA' }, { ahora: en(LUNES) });
    await fallaCon(
      registros.registrarCumplimiento(a.id, r.id, { cumplido: true, evidencias: [{ ...foto(), bytes: 9e6 }] }, { ahora: en(LUNES) }),
      'VALIDACION', assert,
    );
  });

  test('subir con el almacenamiento y borrar (también del almacenamiento)', async () => {
    const almacen = crearAlmacenamientoMemoria();
    const a = await crearUsuario();
    const r = await retos.crearReto(a.id, { nombre: 'x', frecuencia: 'DIARIA' }, { ahora: en(LUNES) });
    const ev = await evidencias.subirEvidencia({ mimetype: 'image/png', size: 3, buffer: Buffer.from('png') }, { almacenamiento: almacen });
    const { registro } = await registros.registrarCumplimiento(a.id, r.id, { cumplido: true, evidencias: [ev] }, { ahora: en(LUNES), almacenamiento: almacen });
    assert.equal(almacen.archivos.size, 1);
    await evidencias.eliminarEvidencia(a.id, registro.evidencias[0].id, { almacenamiento: almacen });
    assert.equal(almacen.archivos.size, 0);
    assert.equal(await prisma.evidencia.count(), 0);
  });
});

describe('aprobación de evidencias (toggle requiereAprobacion)', () => {
  async function escenario() {
    const [admin, b, c] = [await crearUsuario(), await crearUsuario(), await crearUsuario()];
    const g = await crearGrupo([admin, b, c]);
    const r = await retos.crearReto(c.id, {
      grupoId: g.id, nombre: 'Gym', frecuencia: 'DIARIA', puntosPorCumplimiento: 20, puntosPorIncumplimiento: 5,
      requiereEvidencia: true, requiereAprobacion: true,
    }, { ahora: en(LUNES) });
    return { admin, b, c, r };
  }

  test('pendiente no suma; al aprobar suma puntos y racha', async () => {
    const { admin, b, r } = await escenario();
    const { registro, participante } = await registros.registrarCumplimiento(b.id, r.id, { cumplido: true, evidencias: [foto()] }, { ahora: en(LUNES) });
    assert.equal(registro.estado, 'PENDIENTE');
    assert.equal(participante.puntos, 0);
    assert.equal(participante.rachaActual, 0);
    const pend = await registros.listarPendientesRevision(admin.id);
    assert.deepEqual(pend.map((p) => p.id), [registro.id]);
    const rev = await registros.revisarRegistro(admin.id, registro.id, { aprobar: true }, { ahora: en(LUNES) });
    assert.equal(rev.participante.puntos, 20);
    assert.equal(rev.participante.rachaActual, 1);
    // revisado ya no se puede cambiar
    await fallaCon(registros.registrarCumplimiento(b.id, r.id, { cumplido: false }, { ahora: en(LUNES) }), 'CONFLICTO', assert);
  });

  test('rechazar cuenta como incumplimiento; el creador del reto también revisa', async () => {
    const { b, c, r } = await escenario();
    const { registro } = await registros.registrarCumplimiento(b.id, r.id, { cumplido: true, evidencias: [foto()] }, { ahora: en(LUNES) });
    const rev = await registros.revisarRegistro(c.id, registro.id, { aprobar: false, motivo: 'La foto no corresponde' }, { ahora: en(LUNES) });
    assert.equal(rev.registro.estado, 'RECHAZADO');
    assert.equal(rev.registro.motivoRechazo, 'La foto no corresponde');
    assert.equal(rev.participante.puntos, -5);
  });

  test('nadie aprueba su propio registro ni lo hace un integrante cualquiera', async () => {
    const { admin, b, c, r } = await escenario();
    const { registro } = await registros.registrarCumplimiento(c.id, r.id, { cumplido: true, evidencias: [foto()] }, { ahora: en(LUNES) });
    await fallaCon(registros.revisarRegistro(c.id, registro.id, { aprobar: true }), 'SIN_PERMISO', assert);
    await fallaCon(registros.revisarRegistro(b.id, registro.id, { aprobar: true }), 'SIN_PERMISO', assert);
    await registros.revisarRegistro(admin.id, registro.id, { aprobar: true }, { ahora: en(LUNES) });
  });

  test('desactivar el toggle aprueba los pendientes', async () => {
    const { b, c, r } = await escenario();
    await registros.registrarCumplimiento(b.id, r.id, { cumplido: true, evidencias: [foto()] }, { ahora: en(LUNES) });
    await retos.editarReto(c.id, r.id, { requiereAprobacion: false }, { ahora: en(LUNES) });
    assert.equal(await total(b), 20);
  });
});

describe('puntos, rankings e insignias (RF-15, RF-16, RF-18)', () => {
  test('ranking del reto en tiempo real, con empates', async () => {
    const [a, b, c] = [await crearUsuario({ nombre: 'Ana' }), await crearUsuario({ nombre: 'Beto' }), await crearUsuario({ nombre: 'Caro' })];
    const g = await crearGrupo([a, b, c]);
    const r = await retos.crearReto(a.id, { grupoId: g.id, nombre: 'x', frecuencia: 'DIARIA', puntosPorCumplimiento: 10 }, { ahora: en(LUNES) });
    await registros.registrarCumplimiento(a.id, r.id, { cumplido: true }, { ahora: en(LUNES) });
    await registros.registrarCumplimiento(b.id, r.id, { cumplido: true }, { ahora: en(LUNES) });
    const ranking = await puntos.rankingReto(c.id, r.id);
    assert.deepEqual(ranking.map((f) => [f.posicion, f.puntos]), [[1, 10], [1, 10], [3, 0]]);
    const rg = await puntos.rankingGrupo(c.id, g.id);
    assert.deepEqual(rg.map((f) => f.usuario.nombre), ['Ana', 'Beto', 'Caro']);
  });

  test('bono por racha configurable e insignias automáticas', async () => {
    const a = await crearUsuario();
    const r = await retos.crearReto(a.id, {
      nombre: 'x', frecuencia: 'DIARIA', puntosPorCumplimiento: 30, bonoRachaCada: 3, bonoRachaPuntos: 15,
    }, { ahora: en(LUNES) });
    for (const d of ['2026-11-02', '2026-11-03', '2026-11-04']) {
      await registros.registrarCumplimiento(a.id, r.id, { cumplido: true }, { ahora: en(d) });
    }
    // Repetir el registro del día no repite el bono
    await registros.registrarCumplimiento(a.id, r.id, { cumplido: true }, { ahora: en('2026-11-04', '22:00') });
    assert.equal(await total(a), 30 * 3 + 15);
    const resumen = await puntos.resumenUsuario(a.id);
    assert.equal(resumen.rachaActual, 3);
    assert.deepEqual(resumen.insignias.map((i) => i.codigo).sort(), ['puntos-100', 'racha-3']);
  });

  test('las cachés de puntos coinciden con el libro de movimientos', async () => {
    const [a, b] = [await crearUsuario(), await crearUsuario()];
    const g = await crearGrupo([a, b]);
    const r = await retos.crearReto(a.id, { grupoId: g.id, nombre: 'x', frecuencia: 'DIARIA', puntosPorIncumplimiento: 2 }, { ahora: en(LUNES) });
    await registros.registrarCumplimiento(a.id, r.id, { cumplido: true }, { ahora: en(LUNES) });
    await registros.registrarCumplimiento(b.id, r.id, { cumplido: false }, { ahora: en(LUNES) });
    assert.deepEqual(await puntos.verificarCachesPuntos(), []);
  });
});
