// Pruebas de integridad: la BASE DE DATOS (no el código JS) debe rechazar
// datos inválidos, aunque alguien escriba directo con Prisma o SQL.

import assert from 'node:assert/strict';
import { after, beforeEach, describe, test } from 'node:test';
import { aDate } from '../../src/utils/fechas.js';
import { crearGrupo, crearUsuario, limpiarBD, prisma, violaRestriccion } from '../helpers.js';

const retoBase = (creadorId, extra = {}) => ({
  tipo: 'PERSONAL', creadorId, nombre: 'Leer', frecuencia: 'DIARIA', fechaInicio: aDate('2026-11-02'), ...extra,
});

beforeEach(limpiarBD);
after(() => prisma.$disconnect());

describe('usuarios', () => {
  test('RN-01: no se permiten dos cuentas con el mismo correo', async () => {
    await crearUsuario({ correo: 'ana@correo.com' });
    await assert.rejects(crearUsuario({ correo: 'ana@correo.com' }), (e) => e.code === 'P2002');
  });

  test('el correo se guarda en minúsculas y con formato válido', async () => {
    await violaRestriccion(crearUsuario({ correo: 'Ana@Correo.com' }), 'usuarios_correo_minusculas_chk', assert);
    await violaRestriccion(crearUsuario({ correo: 'no-es-correo' }), 'usuarios_correo_formato_chk', assert);
  });
});

describe('amistades', () => {
  test('una sola relación por pareja, en cualquier dirección', async () => {
    const [a, b] = [await crearUsuario(), await crearUsuario()];
    await prisma.amistad.create({ data: { solicitanteId: a.id, receptorId: b.id } });
    await assert.rejects(
      prisma.amistad.create({ data: { solicitanteId: b.id, receptorId: a.id } }),
      (e) => e.code === 'P2002' && /LEAST/.test(JSON.stringify(e.meta)),
    );
  });

  test('nadie es amigo de sí mismo', async () => {
    const a = await crearUsuario();
    await violaRestriccion(prisma.amistad.create({ data: { solicitanteId: a.id, receptorId: a.id } }), 'amistades_distintos_chk', assert);
  });
});

describe('grupos y administradores', () => {
  test('no se puede degradar al último administrador', async () => {
    const [a, b] = [await crearUsuario(), await crearUsuario()];
    const g = await crearGrupo([a, b]);
    await violaRestriccion(
      prisma.miembroGrupo.update({ where: { grupoId_usuarioId: { grupoId: g.id, usuarioId: a.id } }, data: { rol: 'INTEGRANTE' } }),
      /al menos un administrador/, assert,
    );
  });

  test('si el último admin sale, se asciende al integrante más antiguo', async () => {
    const [a, b, c] = [await crearUsuario(), await crearUsuario(), await crearUsuario()];
    const g = await crearGrupo([a, b, c]);
    await prisma.usuario.delete({ where: { id: a.id } }); // borra su cuenta
    const admins = await prisma.miembroGrupo.findMany({ where: { grupoId: g.id, rol: 'ADMIN' } });
    assert.deepEqual(admins.map((m) => m.usuarioId), [b.id]);
    assert.equal((await prisma.grupo.findUnique({ where: { id: g.id } })).creadorId, null);
  });

  test('eliminar el grupo elimina sus miembros y retos', async () => {
    const [a, b] = [await crearUsuario(), await crearUsuario()];
    const g = await crearGrupo([a, b]);
    await prisma.reto.create({ data: retoBase(a.id, { tipo: 'GRUPAL', grupoId: g.id }) });
    await prisma.grupo.delete({ where: { id: g.id } });
    assert.equal(await prisma.miembroGrupo.count(), 0);
    assert.equal(await prisma.reto.count(), 0);
  });
});

describe('retos', () => {
  test('PERSONAL no tiene grupo y GRUPAL sí', async () => {
    const a = await crearUsuario();
    const g = await crearGrupo([a]);
    await violaRestriccion(prisma.reto.create({ data: retoBase(a.id, { grupoId: g.id }) }), 'retos_tipo_grupo_chk', assert);
    await violaRestriccion(prisma.reto.create({ data: retoBase(a.id, { tipo: 'GRUPAL' }) }), 'retos_tipo_grupo_chk', assert);
  });

  test('CU-07 2a: la fecha de fin no puede ser anterior a la de inicio', async () => {
    const a = await crearUsuario();
    await violaRestriccion(prisma.reto.create({ data: retoBase(a.id, { fechaFin: aDate('2026-11-01') }) }), 'retos_fechas_chk', assert);
  });

  test('la frecuencia debe ser coherente con sus parámetros', async () => {
    const a = await crearUsuario();
    const casos = [
      { frecuencia: 'SEMANAL' },
      { frecuencia: 'SEMANAL', vecesPorSemana: 8 },
      { frecuencia: 'DIAS_ESPECIFICOS' },
      { frecuencia: 'DIAS_ESPECIFICOS', diasSemana: [0, 8] },
      { frecuencia: 'DIARIA', vecesPorSemana: 3 },
    ];
    for (const c of casos) {
      await violaRestriccion(prisma.reto.create({ data: retoBase(a.id, c) }), 'retos_frecuencia_chk', assert);
    }
    await prisma.reto.create({ data: retoBase(a.id, { frecuencia: 'DIAS_ESPECIFICOS', diasSemana: [1, 3, 5] }) });
  });

  test('puntos no negativos y castigo al finalizar con fecha de fin', async () => {
    const a = await crearUsuario();
    await violaRestriccion(prisma.reto.create({ data: retoBase(a.id, { puntosPorCumplimiento: -5 }) }), 'retos_puntos_chk', assert);
    await violaRestriccion(
      prisma.reto.create({ data: retoBase(a.id, { castigoPeriodo: 'AL_FINALIZAR', castigoPuntos: 10 }) }),
      'retos_castigo_final_chk', assert,
    );
    await violaRestriccion(
      prisma.reto.create({ data: retoBase(a.id, { castigoPeriodo: 'SEMANAL' }) }),
      'retos_castigo_definido_chk', assert,
    );
  });

  test('la aprobación de evidencias solo aplica a retos grupales', async () => {
    const a = await crearUsuario();
    await violaRestriccion(prisma.reto.create({ data: retoBase(a.id, { requiereAprobacion: true }) }), 'retos_aprobacion_grupal_chk', assert);
  });
});

describe('participantes, pausas y registros', () => {
  async function escenario() {
    const [a, b, ajeno] = [await crearUsuario(), await crearUsuario(), await crearUsuario()];
    const g = await crearGrupo([a, b]);
    const grupal = await prisma.reto.create({ data: retoBase(a.id, { tipo: 'GRUPAL', grupoId: g.id }) });
    const personal = await prisma.reto.create({ data: retoBase(a.id) });
    return { a, b, ajeno, grupal, personal };
  }

  test('RNF-04: solo miembros del grupo participan; en lo personal solo el creador', async () => {
    const { b, ajeno, grupal, personal } = await escenario();
    await violaRestriccion(
      prisma.participanteReto.create({ data: { retoId: grupal.id, usuarioId: ajeno.id, fechaIngreso: aDate('2026-11-02') } }),
      /miembro del grupo/, assert,
    );
    await violaRestriccion(
      prisma.participanteReto.create({ data: { retoId: personal.id, usuarioId: b.id, fechaIngreso: aDate('2026-11-02') } }),
      /Solo el creador/, assert,
    );
  });

  test('RN-02: las pausas de un participante no se traslapan', async () => {
    const { a, personal } = await escenario();
    const p = await prisma.participanteReto.create({ data: { retoId: personal.id, usuarioId: a.id, fechaIngreso: aDate('2026-11-02') } });
    await prisma.pausa.create({ data: { participanteId: p.id, fechaInicio: aDate('2026-11-03'), fechaFin: aDate('2026-11-05') } });
    await violaRestriccion(
      prisma.pausa.create({ data: { participanteId: p.id, fechaInicio: aDate('2026-11-05'), fechaFin: null } }),
      'pausas_sin_traslape_excl', assert,
    );
    await prisma.pausa.create({ data: { participanteId: p.id, fechaInicio: aDate('2026-11-06') } });
  });

  test('un registro por participante y día; "no cumplido" nunca queda pendiente', async () => {
    const { a, personal } = await escenario();
    const p = await prisma.participanteReto.create({ data: { retoId: personal.id, usuarioId: a.id, fechaIngreso: aDate('2026-11-02') } });
    await prisma.registroCumplimiento.create({ data: { participanteId: p.id, fecha: aDate('2026-11-02'), cumplido: true } });
    await assert.rejects(
      prisma.registroCumplimiento.create({ data: { participanteId: p.id, fecha: aDate('2026-11-02'), cumplido: false } }),
      (e) => e.code === 'P2002',
    );
    await violaRestriccion(
      prisma.registroCumplimiento.create({ data: { participanteId: p.id, fecha: aDate('2026-11-03'), cumplido: false, estado: 'PENDIENTE' } }),
      'registros_estado_chk', assert,
    );
  });

  test('evidencias: máximo 5 MB, formatos de imagen y URL https', async () => {
    const { a, personal } = await escenario();
    const p = await prisma.participanteReto.create({ data: { retoId: personal.id, usuarioId: a.id, fechaIngreso: aDate('2026-11-02') } });
    const r = await prisma.registroCumplimiento.create({ data: { participanteId: p.id, fecha: aDate('2026-11-02'), cumplido: true } });
    const ev = { registroId: r.id, url: 'https://x/y.jpg', publicId: 'a', formato: 'jpg', bytes: 100 };
    await violaRestriccion(prisma.evidencia.create({ data: { ...ev, bytes: 6_000_000 } }), 'evidencias_bytes_chk', assert);
    await violaRestriccion(prisma.evidencia.create({ data: { ...ev, formato: 'exe' } }), 'evidencias_formato_chk', assert);
    await violaRestriccion(prisma.evidencia.create({ data: { ...ev, url: 'http://x/y.jpg' } }), 'evidencias_url_https_chk', assert);
  });

  test('movimientos de puntos: signo coherente con el tipo', async () => {
    const { a } = await escenario();
    await violaRestriccion(
      prisma.movimientoPuntos.create({ data: { usuarioId: a.id, tipo: 'CUMPLIMIENTO', puntos: -10, descripcion: 'x' } }),
      'movimientos_signo_chk', assert,
    );
    await violaRestriccion(
      prisma.movimientoPuntos.create({ data: { usuarioId: a.id, tipo: 'CASTIGO', puntos: 10, descripcion: 'x' } }),
      'movimientos_signo_chk', assert,
    );
  });

  test('eliminar un reto borra en cascada todo su historial', async () => {
    const { a, personal } = await escenario();
    const p = await prisma.participanteReto.create({ data: { retoId: personal.id, usuarioId: a.id, fechaIngreso: aDate('2026-11-02') } });
    const r = await prisma.registroCumplimiento.create({ data: { participanteId: p.id, fecha: aDate('2026-11-02'), cumplido: true } });
    await prisma.evidencia.create({ data: { registroId: r.id, url: 'https://x/y.jpg', publicId: 'p1', formato: 'jpg', bytes: 1 } });
    await prisma.movimientoPuntos.create({
      data: { usuarioId: a.id, participanteId: p.id, retoId: personal.id, registroId: r.id, tipo: 'CUMPLIMIENTO', puntos: 10, descripcion: 'x' },
    });
    await prisma.reto.delete({ where: { id: personal.id } });
    for (const modelo of ['participanteReto', 'registroCumplimiento', 'evidencia', 'movimientoPuntos']) {
      assert.equal(await prisma[modelo].count(), 0, modelo);
    }
  });
});
