// Utilidades compartidas por las pruebas de integración.
// Usan la base indicada en .env.test (¡nunca la de desarrollo!).

import { prisma } from '../src/cliente.js';

if (!/test/.test(process.env.DATABASE_URL ?? '')) {
  throw new Error('Las pruebas de integración deben correr contra una base de datos de pruebas (.env.test)');
}

export { prisma };

/** Vacía todas las tablas (menos el historial de migraciones). */
export async function limpiarBD() {
  const tablas = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables
     WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  const lista = tablas.map((t) => `"${t.tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE ${lista} RESTART IDENTITY CASCADE`);
}

/** Mediodía en Costa Rica (UTC-6) del día indicado: un "ahora" fijo. */
export const en = (fecha, hora = '12:00') => {
  const [h, m] = hora.split(':').map(Number);
  return new Date(Date.UTC(...fecha.split('-').map((x, i) => (i === 1 ? Number(x) - 1 : Number(x))), h + 6, m));
};

let n = 0;
export async function crearUsuario(datos = {}) {
  n++;
  return prisma.usuario.create({
    data: {
      nombre: datos.nombre ?? `Usuario ${n}`,
      correo: datos.correo ?? `usuario${n}@prueba.com`,
      passwordHash: '$2b$10$abcdefghijklmnopqrstuuJ4aJ3ZB7m8yqgGJrQWkR1rG1v1v1v1u',
      ...datos,
    },
  });
}

/** Grupo con el primer usuario como ADMIN y el resto como INTEGRANTE. */
export async function crearGrupo(usuarios, datos = {}) {
  n++;
  return prisma.grupo.create({
    data: {
      nombre: datos.nombre ?? `Grupo ${n}`,
      codigoInvitacion: `COD-${n}-${Date.now()}`,
      creadorId: usuarios[0].id,
      ...datos,
      miembros: {
        create: usuarios.map((u, i) => ({
          usuarioId: u.id,
          rol: i === 0 ? 'ADMIN' : 'INTEGRANTE',
          unidoEn: new Date(Date.UTC(2026, 0, 1, 0, 0, i)),
        })),
      },
    },
  });
}

export async function sembrarInsignias() {
  await prisma.insignia.createMany({
    data: [
      { codigo: 'racha-3', nombre: 'Racha 3', descripcion: '-', criterio: 'RACHA', umbral: 3 },
      { codigo: 'puntos-100', nombre: 'Cien', descripcion: '-', criterio: 'PUNTOS_TOTALES', umbral: 100 },
      { codigo: 'completado-1', nombre: 'Completado', descripcion: '-', criterio: 'RETOS_COMPLETADOS', umbral: 1 },
      { codigo: 'ganado-1', nombre: 'Ganador', descripcion: '-', criterio: 'RETOS_GANADOS', umbral: 1 },
    ],
  });
}

/** Espera que la promesa falle con un ErrorSteply del código dado. */
export async function fallaCon(promesa, codigo, assert) {
  await assert.rejects(promesa, (e) => {
    assert.equal(e.codigo, codigo, `se esperaba ${codigo} y llegó ${e.codigo}: ${e.message}`);
    return true;
  });
}

/**
 * Espera que la base de datos rechace la operación. `patron` es el nombre de
 * la restricción o un texto/regex del mensaje (los triggers usan mensajes).
 */
export async function violaRestriccion(promesa, patron, assert) {
  await assert.rejects(promesa, (e) => {
    const texto = `${e.message} ${JSON.stringify(e.meta ?? {})}`;
    const coincide = patron instanceof RegExp ? patron.test(texto) : texto.includes(patron);
    assert.ok(coincide, `se esperaba ${patron}; llegó: ${texto.slice(0, 400)}`);
    return true;
  });
}

export const foto = (i = 1) => ({
  url: `https://res.cloudinary.com/demo/image/upload/steply/evidencias/t-${i}-${Math.random()}.jpg`,
  publicId: `steply/evidencias/t-${i}-${Math.random()}`,
  formato: 'jpg',
  bytes: 1000,
});
