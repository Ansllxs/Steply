import assert from 'node:assert/strict';
import { after, beforeEach, describe, test } from 'node:test';
import { crearAlmacenamientoMemoria } from '../../src/almacenamiento/cloudinary.js';
import { conLimpiezaPosterior } from '../../src/servicios/limpieza.js';
import * as evidencias from '../../src/servicios/evidencias.js';
import * as registros from '../../src/servicios/registros.js';
import * as retos from '../../src/servicios/retos.js';
import { crearGrupo, crearUsuario, en, fallaCon, limpiarBD, prisma, sembrarInsignias } from '../helpers.js';

const LUNES = '2026-11-02';

beforeEach(async () => {
  await limpiarBD();
  await sembrarInsignias();
});
after(() => prisma.$disconnect());

function vigilar(almacen) {
  const llamadas = [];
  const original = almacen.eliminarVarios.bind(almacen);
  almacen.eliminarVarios = async (ids) => {
    llamadas.push({
      ids: [...ids],
      referencias: await prisma.evidencia.count({ where: { publicId: { in: ids } } }),
    });
    return original(ids);
  };
  return llamadas;
}

async function habitoConFoto(opciones = {}) {
  const almacen = crearAlmacenamientoMemoria();
  const usuario = await crearUsuario();
  const reto = await retos.crearReto(usuario.id, {
    nombre: 'Leer',
    frecuencia: 'DIARIA',
    puntosPorCumplimiento: 10,
    puntosPorIncumplimiento: 4,
    ...opciones,
  }, { ahora: en(LUNES) });
  const foto = await evidencias.subirEvidencia(
    { mimetype: 'image/png', size: 4, buffer: Buffer.from('foto') },
    { almacenamiento: almacen },
  );
  return { almacen, usuario, reto, foto };
}

describe('limpieza de evidencias', () => {
  test('un hábito completado conserva su evidencia', async () => {
    const { almacen, usuario, reto, foto } = await habitoConFoto();
    const resultado = await registros.registrarCumplimiento(usuario.id, reto.id, {
      cumplido: true,
      evidencias: [foto],
    }, { ahora: en(LUNES), almacenamiento: almacen });
    assert.equal(resultado.registro.evidencias.length, 1);
    assert.equal(resultado.puntosRegistro, 10);
    assert.equal(resultado.participante.rachaActual, 1);
    assert.equal(almacen.archivos.size, 1);
    assert.equal(resultado.limpieza.fallidos.length, 0);
  });

  test('la evidencia opcional puede omitirse', async () => {
    const usuario = await crearUsuario();
    const reto = await retos.crearReto(usuario.id, { nombre: 'Caminar', frecuencia: 'DIARIA' }, { ahora: en(LUNES) });
    const resultado = await registros.registrarCumplimiento(usuario.id, reto.id, { cumplido: true }, { ahora: en(LUNES) });
    assert.equal(resultado.registro.evidencias.length, 0);
    assert.equal(resultado.puntosRegistro, 10);
  });

  test('un hábito que exige evidencia no se completa sin foto', async () => {
    const usuario = await crearUsuario();
    const reto = await retos.crearReto(usuario.id, {
      nombre: 'Gym', frecuencia: 'DIARIA', requiereEvidencia: true,
    }, { ahora: en(LUNES) });
    await fallaCon(
      registros.registrarCumplimiento(usuario.id, reto.id, { cumplido: true }, { ahora: en(LUNES) }),
      'VALIDACION',
      assert,
    );
  });

  test('pasar a incompleto borra la referencia y después la imagen', async () => {
    const { almacen, usuario, reto, foto } = await habitoConFoto();
    const llamadas = vigilar(almacen);
    await registros.registrarCumplimiento(usuario.id, reto.id, {
      cumplido: true, evidencias: [foto],
    }, { ahora: en(LUNES), almacenamiento: almacen });
    const cambio = await registros.registrarCumplimiento(usuario.id, reto.id, { cumplido: false }, {
      ahora: en(LUNES), almacenamiento: almacen,
    });
    assert.equal(cambio.registro.cumplido, false);
    assert.equal(cambio.registro.evidencias.length, 0);
    assert.equal(await prisma.evidencia.count(), 0);
    assert.equal(almacen.archivos.size, 0);
    assert.equal(llamadas.length, 1);
    assert.equal(llamadas[0].referencias, 0);
    assert.equal(cambio.limpieza.eliminados.length, 1);
    assert.equal(await prisma.limpiezaPendiente.count(), 0);
    assert.ok(cambio.participante.puntos < 10);
  });

  test('si la transacción falla no se borra la imagen', async () => {
    const llamadas = [];
    await assert.rejects(() => conLimpiezaPosterior(
      async () => { throw new Error('revierte'); },
      { eliminarVarios: async (ids) => llamadas.push(ids) },
    ));
    assert.equal(llamadas.length, 0);
  });

  test('si el proveedor falla la base queda consistente y el borrado sigue pendiente', async () => {
    const { almacen, usuario, reto, foto } = await habitoConFoto();
    await registros.registrarCumplimiento(usuario.id, reto.id, {
      cumplido: true, evidencias: [foto],
    }, { ahora: en(LUNES), almacenamiento: almacen });
    almacen.eliminarVarios = async (ids) => {
      const error = new Error('proveedor');
      error.fallidos = ids;
      throw error;
    };
    const cambio = await registros.registrarCumplimiento(usuario.id, reto.id, { cumplido: false }, {
      ahora: en(LUNES), almacenamiento: almacen,
    });
    assert.equal(cambio.registro.cumplido, false);
    assert.equal(await prisma.evidencia.count(), 0);
    assert.deepEqual(cambio.limpieza.fallidos, [foto.publicId]);
    assert.equal(almacen.archivos.has(foto.publicId), true);
    assert.equal(await prisma.limpiezaPendiente.count({ where: { publicId: foto.publicId } }), 1);
  });

  test('un segundo envío no duplica evidencia ni puntos', async () => {
    const { almacen, usuario, reto, foto } = await habitoConFoto();
    await registros.registrarCumplimiento(usuario.id, reto.id, {
      cumplido: true, evidencias: [foto],
    }, { ahora: en(LUNES), almacenamiento: almacen });
    const extra = await evidencias.subirEvidencia(
      { mimetype: 'image/png', size: 4, buffer: Buffer.from('otra') },
      { almacenamiento: almacen },
    );
    await fallaCon(
      registros.registrarCumplimiento(usuario.id, reto.id, { cumplido: true, evidencias: [extra] }, {
        ahora: en(LUNES), almacenamiento: almacen,
      }),
      'CONFLICTO',
      assert,
    );
    assert.equal(await prisma.evidencia.count(), 1);
    assert.equal((await prisma.usuario.findUnique({ where: { id: usuario.id } })).puntosTotales, 10);
  });

  test('dos envíos simultáneos dejan una sola evidencia', async () => {
    const almacen = crearAlmacenamientoMemoria();
    const usuario = await crearUsuario();
    const reto = await retos.crearReto(usuario.id, {
      nombre: 'Agua', frecuencia: 'DIARIA', puntosPorCumplimiento: 10,
    }, { ahora: en(LUNES) });
    const fotos = await Promise.all([1, 2].map(() => evidencias.subirEvidencia(
      { mimetype: 'image/png', size: 4, buffer: Buffer.from('foto') },
      { almacenamiento: almacen },
    )));
    const resultados = await Promise.allSettled(fotos.map((foto) => registros.registrarCumplimiento(
      usuario.id, reto.id, { cumplido: true, evidencias: [foto] },
      { ahora: en(LUNES), almacenamiento: almacen },
    )));
    assert.equal(resultados.filter((item) => item.status === 'fulfilled').length, 1);
    assert.equal(resultados.filter((item) => item.status === 'rejected').length, 1);
    assert.equal(await prisma.evidencia.count(), 1);
    assert.equal(await prisma.movimientoPuntos.count({ where: { usuarioId: usuario.id, tipo: 'CUMPLIMIENTO' } }), 1);
  });

  test('aprobar suma puntos y rechazar los resta, sin perder la evidencia', async () => {
    const [admin, miembro] = [await crearUsuario(), await crearUsuario()];
    const grupo = await crearGrupo([admin, miembro]);
    const reto = await retos.crearReto(miembro.id, {
      grupoId: grupo.id,
      nombre: 'Gym',
      frecuencia: 'DIARIA',
      puntosPorCumplimiento: 20,
      puntosPorIncumplimiento: 5,
      requiereEvidencia: true,
      requiereAprobacion: true,
    }, { ahora: en(LUNES) });
    const almacen = crearAlmacenamientoMemoria();
    const foto = await evidencias.subirEvidencia(
      { mimetype: 'image/png', size: 4, buffer: Buffer.from('foto') },
      { almacenamiento: almacen },
    );
    const pendiente = await registros.registrarCumplimiento(miembro.id, reto.id, {
      cumplido: true, evidencias: [foto],
    }, { ahora: en(LUNES), almacenamiento: almacen });
    assert.equal(pendiente.puntosRegistro, 0);
    assert.equal(pendiente.registro.evidencias.length, 1);
    const aprobado = await registros.revisarRegistro(admin.id, pendiente.registro.id, { aprobar: true }, { ahora: en(LUNES) });
    assert.equal(aprobado.puntosRegistro, 20);
    assert.equal(aprobado.registro.evidencias.length, 1);

    const otro = await crearUsuario();
    await prisma.miembroGrupo.create({ data: { grupoId: grupo.id, usuarioId: otro.id, rol: 'INTEGRANTE' } });
    const retoRechazo = await retos.crearReto(otro.id, {
      grupoId: grupo.id,
      nombre: 'Correr',
      frecuencia: 'DIARIA',
      puntosPorCumplimiento: 20,
      puntosPorIncumplimiento: 5,
      requiereEvidencia: true,
      requiereAprobacion: true,
    }, { ahora: en(LUNES) });
    const fotoRechazo = await evidencias.subirEvidencia(
      { mimetype: 'image/png', size: 4, buffer: Buffer.from('foto') },
      { almacenamiento: almacen },
    );
    const porRechazar = await registros.registrarCumplimiento(otro.id, retoRechazo.id, {
      cumplido: true, evidencias: [fotoRechazo],
    }, { ahora: en(LUNES), almacenamiento: almacen });
    const rechazado = await registros.revisarRegistro(admin.id, porRechazar.registro.id, {
      aprobar: false, motivo: 'No se ve',
    }, { ahora: en(LUNES) });
    assert.equal(rechazado.registro.estado, 'RECHAZADO');
    assert.equal(rechazado.puntosRegistro, -5);
    assert.equal(rechazado.registro.evidencias.length, 1);
  });

  test('otra persona no registra ni borra la evidencia', async () => {
    const { almacen, usuario, reto, foto } = await habitoConFoto();
    const ajeno = await crearUsuario();
    const registro = await registros.registrarCumplimiento(usuario.id, reto.id, {
      cumplido: true, evidencias: [foto],
    }, { ahora: en(LUNES), almacenamiento: almacen });
    await fallaCon(
      registros.registrarCumplimiento(ajeno.id, reto.id, { cumplido: true }, { ahora: en(LUNES) }),
      'NO_ENCONTRADO',
      assert,
    );
    await fallaCon(
      evidencias.eliminarEvidencia(ajeno.id, registro.registro.evidencias[0].id, { almacenamiento: almacen }),
      'SIN_PERMISO',
      assert,
    );
    assert.equal(await prisma.evidencia.count(), 1);
  });
});
