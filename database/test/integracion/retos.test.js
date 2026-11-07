import assert from 'node:assert/strict';
import { after, beforeEach, describe, test } from 'node:test';
import * as registros from '../../src/servicios/registros.js';
import * as retos from '../../src/servicios/retos.js';
import { crearGrupo, crearUsuario, en, fallaCon, limpiarBD, prisma } from '../helpers.js';

const LUNES = '2026-11-02';
const ahora = en(LUNES);

beforeEach(limpiarBD);
after(() => prisma.$disconnect());

describe('crear hábitos-reto', () => {
  test('CU-03: hábito personal con su creador como único participante', async () => {
    const a = await crearUsuario();
    const r = await retos.crearReto(a.id, { nombre: '  Leer ', meta: '20 páginas', frecuencia: 'DIARIA' }, { ahora });
    assert.equal(r.tipo, 'PERSONAL');
    assert.equal(r.nombre, 'Leer');
    assert.equal(r.fechaInicio.toISOString().slice(0, 10), LUNES);
    assert.deepEqual(r.participantes.map((p) => p.usuarioId), [a.id]);
  });

  test('CU-03 3a: faltan campos obligatorios', async () => {
    const a = await crearUsuario();
    await fallaCon(retos.crearReto(a.id, { nombre: ' ', frecuencia: 'DIARIA' }, { ahora }), 'VALIDACION', assert);
    await fallaCon(retos.crearReto(a.id, { nombre: 'x' }, { ahora }), 'VALIDACION', assert);
    await fallaCon(retos.crearReto(a.id, { nombre: 'x', frecuencia: 'SEMANAL' }, { ahora }), 'VALIDACION', assert);
    await fallaCon(retos.crearReto(a.id, { nombre: 'x', frecuencia: 'DIAS_ESPECIFICOS', diasSemana: [] }, { ahora }), 'VALIDACION', assert);
  });

  test('CU-07 2a: fechas inválidas', async () => {
    const a = await crearUsuario();
    await fallaCon(retos.crearReto(a.id, { nombre: 'x', frecuencia: 'DIARIA', fechaInicio: '2026-11-10', fechaFin: '2026-11-09' }, { ahora }), 'VALIDACION', assert);
    await fallaCon(retos.crearReto(a.id, { nombre: 'x', frecuencia: 'DIARIA', fechaInicio: '2026-11-01' }, { ahora }), 'VALIDACION', assert);
  });

  test('reto grupal para todo el grupo, con puntos y castigo personalizados', async () => {
    const [a, b, c] = [await crearUsuario(), await crearUsuario(), await crearUsuario()];
    const g = await crearGrupo([a, b, c]);
    const r = await retos.crearReto(a.id, {
      grupoId: g.id, nombre: 'Estudiar', frecuencia: 'DIAS_ESPECIFICOS', diasSemana: [5, 1, 3, 3],
      puntosPorCumplimiento: 25, puntosPorIncumplimiento: 5, requiereAprobacion: true,
      castigo: { descripcion: 'Invitar el café', puntos: 30 },
    }, { ahora });
    assert.equal(r.tipo, 'GRUPAL');
    assert.deepEqual(r.diasSemana, [1, 3, 5]);
    assert.equal(r.castigoPeriodo, 'SEMANAL');
    assert.equal(r.castigoPuntos, 30);
    assert.equal(r.participantes.length, 3);
  });

  test('un integrante le pone un reto a otros (sin incluirse)', async () => {
    const [a, b, c] = [await crearUsuario(), await crearUsuario(), await crearUsuario()];
    const g = await crearGrupo([a, b, c]);
    const r = await retos.crearReto(b.id, { grupoId: g.id, nombre: 'Correr', frecuencia: 'DIARIA', participantes: [c.id] }, { ahora });
    assert.deepEqual(r.participantes.map((p) => p.usuarioId), [c.id]);
    assert.equal(r.creadorId, b.id);
  });

  test('si el grupo lo restringe, solo los admins crean retos', async () => {
    const [a, b] = [await crearUsuario(), await crearUsuario()];
    const g = await crearGrupo([a, b], { soloAdminsCreanRetos: true });
    await fallaCon(retos.crearReto(b.id, { grupoId: g.id, nombre: 'x', frecuencia: 'DIARIA' }, { ahora }), 'SIN_PERMISO', assert);
  });

  test('no se le pone un reto a alguien de fuera del grupo ni se crea en grupo ajeno', async () => {
    const [a, b, ajeno] = [await crearUsuario(), await crearUsuario(), await crearUsuario()];
    const g = await crearGrupo([a, b]);
    await fallaCon(retos.crearReto(a.id, { grupoId: g.id, nombre: 'x', frecuencia: 'DIARIA', participantes: [ajeno.id] }, { ahora }), 'VALIDACION', assert);
    await fallaCon(retos.crearReto(ajeno.id, { grupoId: g.id, nombre: 'x', frecuencia: 'DIARIA' }, { ahora }), 'NO_ENCONTRADO', assert);
  });

  test('el castigo necesita descripción o puntos, y "al finalizar" requiere fecha de fin', async () => {
    const a = await crearUsuario();
    await fallaCon(retos.crearReto(a.id, { nombre: 'x', frecuencia: 'DIARIA', castigo: {} }, { ahora }), 'VALIDACION', assert);
    await fallaCon(retos.crearReto(a.id, { nombre: 'x', frecuencia: 'DIARIA', castigo: { periodo: 'AL_FINALIZAR', puntos: 5 } }, { ahora }), 'VALIDACION', assert);
  });
});

describe('consultar (RNF-04)', () => {
  test('un reto personal solo lo ve su dueño; uno grupal, los miembros', async () => {
    const [a, b, ajeno] = [await crearUsuario(), await crearUsuario(), await crearUsuario()];
    const g = await crearGrupo([a, b]);
    const personal = await retos.crearReto(a.id, { nombre: 'Diario', frecuencia: 'DIARIA' }, { ahora });
    const grupal = await retos.crearReto(a.id, { grupoId: g.id, nombre: 'Grupal', frecuencia: 'DIARIA' }, { ahora });
    await fallaCon(retos.obtenerReto(b.id, personal.id), 'NO_ENCONTRADO', assert);
    assert.equal((await retos.obtenerReto(b.id, grupal.id)).id, grupal.id);
    await fallaCon(retos.obtenerReto(ajeno.id, grupal.id), 'NO_ENCONTRADO', assert);
    const admin = await crearUsuario({ rol: 'ADMIN_GENERAL' });
    assert.equal((await retos.obtenerReto(admin.id, personal.id)).id, personal.id);
  });

  test('listar con filtro Personales / Grupales', async () => {
    const [a, b] = [await crearUsuario(), await crearUsuario()];
    const g = await crearGrupo([a, b]);
    await retos.crearReto(a.id, { nombre: 'P', frecuencia: 'DIARIA' }, { ahora });
    await retos.crearReto(a.id, { grupoId: g.id, nombre: 'G', frecuencia: 'DIARIA' }, { ahora });
    assert.equal((await retos.listarRetosUsuario(a.id)).length, 2);
    assert.deepEqual((await retos.listarRetosUsuario(a.id, { tipo: 'GRUPAL' })).map((p) => p.reto.nombre), ['G']);
    assert.deepEqual((await retos.listarRetosUsuario(a.id, { tipo: 'PERSONAL' })).map((p) => p.reto.nombre), ['P']);
  });
});

describe('editar y eliminar (CU-04)', () => {
  test('solo el creador o un admin del grupo puede editar', async () => {
    const [a, b, c] = [await crearUsuario(), await crearUsuario(), await crearUsuario()];
    const g = await crearGrupo([a, b, c]);
    const r = await retos.crearReto(b.id, { grupoId: g.id, nombre: 'x', frecuencia: 'DIARIA' }, { ahora });
    await fallaCon(retos.editarReto(c.id, r.id, { nombre: 'y' }, { ahora }), 'SIN_PERMISO', assert);
    assert.equal((await retos.editarReto(a.id, r.id, { nombre: 'Admin edita' }, { ahora })).nombre, 'Admin edita');
    assert.equal((await retos.editarReto(b.id, r.id, { nombre: 'Creador edita' }, { ahora })).nombre, 'Creador edita');
  });

  test('cambiar la frecuencia descarta los parámetros anteriores y valida la nueva', async () => {
    const a = await crearUsuario();
    const r = await retos.crearReto(a.id, { nombre: 'x', frecuencia: 'SEMANAL', vecesPorSemana: 3 }, { ahora });
    await fallaCon(retos.editarReto(a.id, r.id, { frecuencia: 'DIAS_ESPECIFICOS' }, { ahora }), 'VALIDACION', assert);
    const e = await retos.editarReto(a.id, r.id, { frecuencia: 'DIAS_ESPECIFICOS', diasSemana: [2, 4] }, { ahora });
    assert.equal(e.vecesPorSemana, null);
    assert.deepEqual(e.diasSemana, [2, 4]);
  });

  test('no se cambia la fecha de inicio de un reto que ya empezó ni campos desconocidos', async () => {
    const a = await crearUsuario();
    const r = await retos.crearReto(a.id, { nombre: 'x', frecuencia: 'DIARIA' }, { ahora });
    await fallaCon(retos.editarReto(a.id, r.id, { fechaInicio: '2026-11-20' }, { ahora }), 'CONFLICTO', assert);
    await fallaCon(retos.editarReto(a.id, r.id, { creadorId: a.id }, { ahora }), 'VALIDACION', assert);
  });

  test('eliminar borra el historial y recalcula los puntos totales', async () => {
    const a = await crearUsuario();
    const r1 = await retos.crearReto(a.id, { nombre: 'Uno', frecuencia: 'DIARIA', puntosPorCumplimiento: 10 }, { ahora });
    const r2 = await retos.crearReto(a.id, { nombre: 'Dos', frecuencia: 'DIARIA', puntosPorCumplimiento: 7 }, { ahora });
    await registros.registrarCumplimiento(a.id, r1.id, { cumplido: true }, { ahora });
    await registros.registrarCumplimiento(a.id, r2.id, { cumplido: true }, { ahora });
    assert.equal((await prisma.usuario.findUnique({ where: { id: a.id } })).puntosTotales, 17);
    await retos.eliminarReto(a.id, r1.id);
    assert.equal((await prisma.usuario.findUnique({ where: { id: a.id } })).puntosTotales, 7);
    assert.equal(await prisma.registroCumplimiento.count(), 1);
  });
});

describe('participantes, abandono y pausa', () => {
  test('RF-19: abandonar solo si las reglas del reto lo permiten', async () => {
    const [a, b] = [await crearUsuario(), await crearUsuario()];
    const g = await crearGrupo([a, b]);
    const libre = await retos.crearReto(a.id, { grupoId: g.id, nombre: 'Libre', frecuencia: 'DIARIA' }, { ahora });
    const estricto = await retos.crearReto(a.id, { grupoId: g.id, nombre: 'Estricto', frecuencia: 'DIARIA', permiteAbandono: false }, { ahora });
    assert.equal((await retos.abandonarReto(b.id, libre.id)).estado, 'ABANDONADO');
    await fallaCon(retos.abandonarReto(b.id, estricto.id), 'SIN_PERMISO', assert);
    // quien abandona ya no puede registrar
    await fallaCon(registros.registrarCumplimiento(b.id, libre.id, { cumplido: true }, { ahora }), 'NO_ENCONTRADO', assert);
  });

  test('agregar participantes y reincorporar a quien salió', async () => {
    const [a, b, c] = [await crearUsuario(), await crearUsuario(), await crearUsuario()];
    const g = await crearGrupo([a, b, c]);
    const r = await retos.crearReto(a.id, { grupoId: g.id, nombre: 'x', frecuencia: 'DIARIA', participantes: [a.id] }, { ahora });
    await retos.agregarParticipantes(a.id, r.id, [b.id, c.id], { ahora });
    await retos.removerParticipante(a.id, r.id, c.id);
    const lista = await retos.agregarParticipantes(a.id, r.id, [c.id], { ahora: en('2026-11-04') });
    const pc = lista.find((p) => p.usuarioId === c.id);
    assert.equal(pc.estado, 'ACTIVO');
    assert.equal(pc.fechaIngreso.toISOString().slice(0, 10), '2026-11-04');
  });

  test('RN-02: pausar congela y reanudar reactiva', async () => {
    const a = await crearUsuario();
    const r = await retos.crearReto(a.id, { nombre: 'x', frecuencia: 'DIARIA' }, { ahora });
    await registros.registrarCumplimiento(a.id, r.id, { cumplido: true }, { ahora });
    const pausado = await retos.pausarParticipacion(a.id, r.id, { motivo: 'Médico' }, { ahora: en('2026-11-03') });
    assert.equal(pausado.estado, 'PAUSADO');
    await fallaCon(registros.registrarCumplimiento(a.id, r.id, { cumplido: true }, { ahora: en('2026-11-03') }), 'FUERA_DE_TIEMPO', assert);
    await fallaCon(retos.pausarParticipacion(a.id, r.id, {}, { ahora: en('2026-11-04') }), 'CONFLICTO', assert);
    await retos.reanudarParticipacion(a.id, r.id, { ahora: en('2026-11-06') });
    const reg = await registros.registrarCumplimiento(a.id, r.id, { cumplido: true }, { ahora: en('2026-11-06') });
    // 3, 4 y 5 en pausa: la racha sigue en 2 (2 y 6 de noviembre).
    assert.equal(reg.participante.rachaActual, 2);
    const pausa = await prisma.pausa.findFirst();
    assert.equal(pausa.fechaFin.toISOString().slice(0, 10), '2026-11-05');
  });
});
