// Prototipo para probar la base de datos sin el frontend ni el backend reales.
//
//   npm run prototipo      →  http://localhost:3000
//
// Es SOLO para desarrollo: no tiene inicio de sesión (eliges el usuario en un
// menú) y permite simular la fecha. El backend real lo programa el Integrante 2.
//
// Fecha simulada: el navegador manda el encabezado `x-fecha-simulada:
// AAAA-MM-DD`, y todas las operaciones se hacen como si fuera el mediodía de
// ese día en Costa Rica. Así se pueden probar rachas, castigos y el cierre.

import { spawn } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import {
  ErrorSteply, cierre, crearAlmacenamientoCloudinary, evidencias, fechas, prisma, puntos,
  registros, retos, traducirErrorBD,
} from '../src/index.js';

if (process.env.NODE_ENV === 'production') {
  console.error('El prototipo no debe ejecutarse en producción.');
  process.exit(1);
}

const aqui = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '8mb' }));
app.use(express.static(path.join(aqui, 'public')));

// Cloudinary real si está configurado; si no, una imagen de ejemplo.
let almacen = null;
if (process.env.CLOUDINARY_URL || process.env.CLOUDINARY_CLOUD_NAME) {
  try { almacen = crearAlmacenamientoCloudinary(); } catch (e) { console.warn('Cloudinary:', e.message); }
}

// --- utilidades -------------------------------------------------------------

const ahoraDe = (req) => {
  const f = req.get('x-fecha-simulada');
  return f && fechas.esFechaValida(f) ? new Date(`${f}T18:00:00.000Z`) : new Date();
};
const ruta = (fn) => async (req, res) => {
  try {
    res.json((await fn(req, ahoraDe(req))) ?? { ok: true });
  } catch (err) {
    const e = traducirErrorBD(err);
    if (e instanceof ErrorSteply) return res.status(e.status).json({ codigo: e.codigo, mensaje: e.message, detalles: e.detalles });
    console.error(err);
    res.status(500).json({ codigo: 'ERROR_INTERNO', mensaje: err.message });
  }
};
const actor = (req) => req.get('x-usuario-id');

async function evidenciaDe(foto) {
  if (!foto) return [];
  if (foto.dataUrl) {
    const [, mimetype, b64] = foto.dataUrl.match(/^data:([^;]+);base64,(.*)$/) ?? [];
    const buffer = Buffer.from(b64 ?? '', 'base64');
    const archivo = { mimetype, size: buffer.length, buffer };
    evidencias.validarArchivo(archivo); // CU-08 2a: formato y tamaño
    if (almacen) return [await evidencias.subirEvidencia(archivo, { almacenamiento: almacen })];
  }
  // Sin Cloudinary: imagen pública de ejemplo.
  return [{
    url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    publicId: `steply/evidencias/prototipo-${randomUUID()}`,
    formato: 'jpg',
    bytes: 120_000,
  }];
}

// --- usuarios y grupos (en el sistema real esto lo hace el backend) ---------

app.get('/api/info', ruta(async () => ({ cloudinary: Boolean(almacen), hoyReal: fechas.hoyEn() })));

app.get('/api/usuarios', ruta(() =>
  prisma.usuario.findMany({ orderBy: { creadoEn: 'asc' }, select: { id: true, nombre: true, correo: true, rol: true, puntosTotales: true } })));

app.post('/api/usuarios', ruta((req) =>
  prisma.usuario.create({
    data: {
      nombre: req.body.nombre?.trim(),
      correo: req.body.correo?.trim().toLowerCase(),
      // En el backend real esto es bcrypt.hash(password). Aquí no hay login.
      passwordHash: 'prototipo-sin-contrasena',
    },
  })));

app.get('/api/grupos', ruta((req) =>
  prisma.grupo.findMany({
    where: { miembros: { some: { usuarioId: actor(req) } } },
    include: { miembros: { include: { usuario: { select: { id: true, nombre: true } } }, orderBy: { unidoEn: 'asc' } } },
    orderBy: { creadoEn: 'asc' },
  })));

app.post('/api/grupos', ruta(async (req) => {
  const otros = (req.body.miembros ?? []).filter((id) => id !== actor(req));
  return prisma.grupo.create({
    data: {
      nombre: req.body.nombre?.trim() ?? '',
      descripcion: req.body.descripcion?.trim() || null,
      soloAdminsCreanRetos: Boolean(req.body.soloAdminsCreanRetos),
      creadorId: actor(req),
      codigoInvitacion: randomBytes(6).toString('hex'),
      miembros: { create: [{ usuarioId: actor(req), rol: 'ADMIN' }, ...otros.map((usuarioId) => ({ usuarioId }))] },
    },
  });
}));

app.post('/api/grupos/:id/miembros', ruta((req) =>
  prisma.miembroGrupo.create({ data: { grupoId: req.params.id, usuarioId: req.body.usuarioId } })));

app.get('/api/grupos/:id/ranking', ruta((req) => puntos.rankingGrupo(actor(req), req.params.id)));
app.get('/api/grupos/:id/retos', ruta((req) => retos.listarRetosGrupo(actor(req), req.params.id)));

// --- lógica de la base de datos (Integrante 3) ------------------------------

app.get('/api/resumen', ruta((req) => puntos.resumenUsuario(actor(req))));
app.get('/api/hoy', ruta((req, ahora) => registros.retosDelDia(actor(req), { ahora })));
app.get('/api/retos', ruta((req) =>
  retos.listarRetosUsuario(actor(req), { tipo: req.query.tipo ?? 'TODOS', incluirTerminados: req.query.terminados === '1' })));
app.post('/api/retos', ruta((req, ahora) => retos.crearReto(actor(req), req.body, { ahora })));

app.get('/api/retos/:id', ruta(async (req) => {
  const id = req.params.id;
  const [reto, ranking, historial, castigos, galeria] = await Promise.all([
    retos.obtenerReto(actor(req), id),
    puntos.rankingReto(actor(req), id),
    registros.historialCumplimiento(actor(req), id).catch(() => []),
    puntos.castigosReto(actor(req), id),
    evidencias.listarEvidenciasReto(actor(req), id),
  ]);
  return { reto, ranking, historial, castigos, galeria };
}));
app.patch('/api/retos/:id', ruta((req, ahora) => retos.editarReto(actor(req), req.params.id, req.body, { ahora })));
app.delete('/api/retos/:id', ruta((req) => retos.eliminarReto(actor(req), req.params.id, { almacenamiento: almacen ?? undefined })));
app.post('/api/retos/:id/cancelar', ruta((req) => retos.cancelarReto(actor(req), req.params.id)));

app.post('/api/retos/:id/registros', ruta(async (req, ahora) => {
  const { cumplido, nota, fecha, foto } = req.body;
  return registros.registrarCumplimiento(actor(req), req.params.id,
    { cumplido, nota, fecha: fecha || undefined, evidencias: cumplido ? await evidenciaDe(foto) : [] },
    { ahora });
}));
app.post('/api/retos/:id/pausa', ruta((req, ahora) =>
  retos.pausarParticipacion(actor(req), req.params.id, { hasta: req.body.hasta || null, motivo: req.body.motivo }, { ahora })));
app.delete('/api/retos/:id/pausa', ruta((req, ahora) => retos.reanudarParticipacion(actor(req), req.params.id, { ahora })));
app.post('/api/retos/:id/abandonar', ruta((req) => retos.abandonarReto(actor(req), req.params.id)));
app.post('/api/retos/:id/participantes', ruta((req, ahora) =>
  retos.agregarParticipantes(actor(req), req.params.id, req.body.usuarioIds ?? [], { ahora })));

app.get('/api/pendientes', ruta((req) => registros.listarPendientesRevision(actor(req))));
app.post('/api/registros/:id/revision', ruta((req, ahora) =>
  registros.revisarRegistro(actor(req), req.params.id, { aprobar: req.body.aprobar, motivo: req.body.motivo }, { ahora })));

app.post('/api/castigos/:id/saldar', ruta((req) => puntos.saldarCastigo(actor(req), req.params.id, true)));
app.get('/api/calendario', ruta((req) =>
  registros.calendarioMensual(actor(req), Number(req.query.anio), Number(req.query.mes))));
app.get('/api/movimientos', ruta((req) => puntos.movimientosUsuario(actor(req), { limite: 100 })));

app.post('/api/cierre', ruta((req, ahora) => cierre.ejecutarCierreDiario({ ahora })));
app.get('/api/integridad', ruta(() => puntos.verificarCachesPuntos()));

// Borra TODO y vuelve a cargar los datos demo (solo base de desarrollo).
app.post('/api/reiniciar', ruta(async () => {
  const tablas = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  await prisma.$executeRawUnsafe(`TRUNCATE ${tablas.map((t) => `"${t.tablename}"`).join(', ')} CASCADE`);
  await new Promise((resolve, reject) => {
    const hijo = spawn(process.execPath, [path.join(aqui, '..', 'prisma', 'seed.js')], { stdio: 'inherit', env: process.env });
    hijo.on('exit', (c) => (c === 0 ? resolve() : reject(new Error('Falló el seed'))));
  });
  return { ok: true };
}));

const puerto = Number(process.env.PORT ?? 3000);
app.listen(puerto, () => {
  console.log(`\n  Prototipo de Steply listo en  http://localhost:${puerto}\n`);
  console.log(`  Base de datos: ${process.env.DATABASE_URL?.replace(/:[^:@/]+@/, ':****@')}`);
  console.log(`  Evidencias: ${almacen ? 'Cloudinary' : 'imagen de ejemplo (sin Cloudinary)'}\n`);
});
