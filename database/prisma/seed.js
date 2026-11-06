// Datos iniciales.
//   npm run db:seed
//
// 1. Catálogo de insignias (siempre; es idempotente).
// 2. Datos de demostración (excepto si NODE_ENV=production o SEED_DEMO=false):
//    usuarios, el grupo "Compu squad" y retos con 14 días de historial
//    generados con los mismos servicios que usará el backend.
//    Contraseña de todos los usuarios demo: Steply123!

import bcrypt from 'bcrypt';
import { prisma } from '../src/cliente.js';
import { ejecutarCierreDiario } from '../src/servicios/cierre.js';
import { registrarCumplimiento, revisarRegistro } from '../src/servicios/registros.js';
import { crearReto } from '../src/servicios/retos.js';

const INSIGNIAS = [
  { codigo: 'racha-3', nombre: 'Primeros pasos', descripcion: 'Racha de 3 en un reto', criterio: 'RACHA', umbral: 3 },
  { codigo: 'racha-7', nombre: 'Una semana firme', descripcion: 'Racha de 7 en un reto', criterio: 'RACHA', umbral: 7 },
  { codigo: 'racha-30', nombre: 'Hábito formado', descripcion: 'Racha de 30 en un reto', criterio: 'RACHA', umbral: 30 },
  { codigo: 'racha-100', nombre: 'Imparable', descripcion: 'Racha de 100 en un reto', criterio: 'RACHA', umbral: 100 },
  { codigo: 'puntos-100', nombre: 'Centenario', descripcion: 'Acumula 100 puntos', criterio: 'PUNTOS_TOTALES', umbral: 100 },
  { codigo: 'puntos-500', nombre: 'Constante', descripcion: 'Acumula 500 puntos', criterio: 'PUNTOS_TOTALES', umbral: 500 },
  { codigo: 'puntos-1000', nombre: 'Leyenda Steply', descripcion: 'Acumula 1000 puntos', criterio: 'PUNTOS_TOTALES', umbral: 1000 },
  { codigo: 'retos-completados-1', nombre: 'Misión cumplida', descripcion: 'Completa tu primer reto', criterio: 'RETOS_COMPLETADOS', umbral: 1 },
  { codigo: 'retos-completados-5', nombre: 'Coleccionista de metas', descripcion: 'Completa 5 retos', criterio: 'RETOS_COMPLETADOS', umbral: 5 },
  { codigo: 'retos-ganados-1', nombre: 'Campeón del grupo', descripcion: 'Gana un reto grupal', criterio: 'RETOS_GANADOS', umbral: 1 },
];

async function sembrarInsignias() {
  for (const i of INSIGNIAS) {
    await prisma.insignia.upsert({ where: { codigo: i.codigo }, create: i, update: i });
  }
  console.log(`✔ ${INSIGNIAS.length} insignias`);
}

const DIA = 86_400_000;
// Mediodía en Costa Rica (UTC-6) de hace n días.
const haceDias = (n) => new Date(Date.now() - n * DIA);

async function sembrarDemo() {
  if (await prisma.usuario.findUnique({ where: { correo: 'angie@ejemplo.com' } })) {
    console.log('• Datos demo ya existen, se omiten');
    return;
  }
  const passwordHash = await bcrypt.hash('Steply123!', 10);
  const crear = (nombre, correo, extra = {}) =>
    prisma.usuario.create({ data: { nombre, correo, passwordHash, ...extra } });

  await crear('Admin Steply', 'admin@steply.app', { rol: 'ADMIN_GENERAL' });
  const angie = await crear('Angie', 'angie@ejemplo.com', { descripcion: 'Leyendo un libro por mes 📚' });
  const valentina = await crear('Valentina', 'valentina@ejemplo.com');
  const diego = await crear('Diego', 'diego@ejemplo.com');
  const sofia = await crear('Sofía', 'sofia@ejemplo.com');
  const carlos = await crear('Carlos', 'carlos@ejemplo.com');
  const todos = [angie, valentina, diego, sofia, carlos];

  await prisma.amistad.createMany({
    data: [
      { solicitanteId: angie.id, receptorId: valentina.id, estado: 'ACEPTADA', respondidoEn: new Date() },
      { solicitanteId: angie.id, receptorId: diego.id, estado: 'ACEPTADA', respondidoEn: new Date() },
      { solicitanteId: sofia.id, receptorId: angie.id, estado: 'PENDIENTE' },
    ],
  });

  const grupo = await prisma.grupo.create({
    data: {
      nombre: 'Compu squad',
      descripcion: 'Estudiar y movernos juntos',
      creadorId: angie.id,
      codigoInvitacion: 'COMPU-SQUAD-DEMO',
      miembros: {
        create: todos.map((u, i) => ({ usuarioId: u.id, rol: u === angie ? 'ADMIN' : 'INTEGRANTE', unidoEn: new Date(Date.now() - (10 - i) * 1000) })),
      },
    },
  });

  const inicio = haceDias(14);
  const leer = await crearReto(angie.id, {
    nombre: 'Leer', meta: '20 páginas', frecuencia: 'DIARIA',
    puntosPorCumplimiento: 10, puntosPorIncumplimiento: 5, bonoRachaCada: 7, bonoRachaPuntos: 20,
  }, { ahora: inicio });
  const agua = await crearReto(angie.id, {
    nombre: 'Tomar agua', meta: '8 vasos', frecuencia: 'DIAS_ESPECIFICOS', diasSemana: [1, 2, 3, 4, 5],
    puntosPorCumplimiento: 5,
  }, { ahora: inicio });
  const estudiar = await crearReto(angie.id, {
    tipo: 'GRUPAL', grupoId: grupo.id, nombre: 'Estudiar', meta: '1 hora sin distracciones',
    frecuencia: 'DIARIA', puntosPorCumplimiento: 15, puntosPorIncumplimiento: 5,
    porcentajeMinimoCumplimiento: 70, diasGraciaRegistro: 1,
    castigo: { periodo: 'SEMANAL', descripcion: 'Invitar el café del lunes', puntos: 20 },
  }, { ahora: inicio });
  const ejercicio = await crearReto(valentina.id, {
    tipo: 'GRUPAL', grupoId: grupo.id, nombre: 'Hacer ejercicio', frecuencia: 'SEMANAL', vecesPorSemana: 3,
    puntosPorCumplimiento: 20, puntosPorIncumplimiento: 10, requiereEvidencia: true, requiereAprobacion: true,
    participantes: [angie.id, valentina.id, diego.id, sofia.id],
  }, { ahora: inicio });

  // Probabilidad de cumplir de cada persona, para que el ranking sea variado.
  const constancia = new Map([[angie.id, 0.85], [valentina.id, 0.95], [diego.id, 0.8], [sofia.id, 0.6], [carlos.id, 0.45]]);
  let semilla = 42;
  const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
  const foto = (n) => ({
    url: `https://res.cloudinary.com/demo/image/upload/steply/evidencias/demo-${n}.jpg`,
    publicId: `steply/evidencias/demo-${n}`, formato: 'jpg', bytes: 180_000,
  });
  let fotos = 0;

  for (let n = 14; n >= 1; n--) {
    const ahora = haceDias(n);
    const intentar = async (u, reto, datos = {}) => {
      try {
        return await registrarCumplimiento(u.id, reto.id, { cumplido: azar() < constancia.get(u.id), ...datos }, { ahora });
      } catch {
        return null; // día no programado, etc.
      }
    };
    await intentar(angie, leer);
    await intentar(angie, agua);
    for (const u of todos) await intentar(u, estudiar);
    if (n % 2 === 0) {
      for (const u of [angie, valentina, diego, sofia]) {
        if (azar() < constancia.get(u.id)) {
          const r = await intentar(u, ejercicio, { cumplido: true, evidencias: [foto(++fotos)] });
          // Valentina (creadora) aprueba; los de Valentina los aprueba Angie (admin del grupo).
          if (r && n > 2) await revisarRegistro(u === valentina ? angie.id : valentina.id, r.registro.id, { aprobar: true }, { ahora });
        }
      }
    }
    await ejecutarCierreDiario({ ahora });
  }
  await ejecutarCierreDiario();
  console.log('✔ Datos demo: 6 usuarios, 1 grupo, 4 retos, 14 días de historial');
  console.log('  Inicia sesión con angie@ejemplo.com / Steply123!');
}

try {
  await sembrarInsignias();
  if (process.env.NODE_ENV !== 'production' && process.env.SEED_DEMO !== 'false') await sembrarDemo();
} finally {
  await prisma.$disconnect();
}
