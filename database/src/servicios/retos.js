// Hábitos-reto: creación, edición, eliminación, participantes, pausas y
// abandono (RF-04, RF-05, RF-13, RF-16, RF-19, RN-02, CU-03, CU-04, CU-07).

import { prisma } from '../cliente.js';
import { conflicto, fueraDeTiempo, noEncontrado, sinPermiso, validacion } from '../errores.js';
import { aDate, aTexto, esFechaValida, hoyEn, sumarDias } from '../utils/fechas.js';
import {
  cargarParticipante,
  fechaIngresoPara,
  recalcularParticipante,
  recalcularPuntosRegistro,
  sincronizarPuntosUsuario,
} from './motor.js';
import {
  esAdminGeneral,
  exigirGestionReto,
  exigirVerReto,
  obtenerMembresia,
  obtenerUsuario,
} from './permisos.js';

const FRECUENCIAS = ['DIARIA', 'SEMANAL', 'DIAS_ESPECIFICOS'];
const PERIODOS_CASTIGO = ['SEMANAL', 'AL_FINALIZAR'];

/** Campos que el creador puede editar después de crear el reto. */
const CAMPOS_EDITABLES = [
  'nombre', 'descripcion', 'meta', 'frecuencia', 'vecesPorSemana', 'diasSemana',
  'fechaInicio', 'fechaFin', 'puntosPorCumplimiento', 'puntosPorIncumplimiento',
  'bonoRachaCada', 'bonoRachaPuntos', 'requiereEvidencia', 'requiereAprobacion',
  'diasGraciaRegistro', 'porcentajeMinimoCumplimiento', 'permiteAbandono', 'castigo',
];

// -----------------------------------------------------------------------------
//  Validación
// -----------------------------------------------------------------------------

function entero(valor, campo, { min = 0, max = 10000, nulo = false } = {}) {
  if (valor == null && nulo) return null;
  if (!Number.isInteger(valor) || valor < min || valor > max) {
    throw validacion(`"${campo}" debe ser un número entero entre ${min} y ${max}`, { campo });
  }
  return valor;
}

function texto(valor, campo, { max, obligatorio = false } = {}) {
  if (valor == null || (typeof valor === 'string' && valor.trim() === '')) {
    if (obligatorio) throw validacion(`"${campo}" es obligatorio`, { campo });
    return null;
  }
  if (typeof valor !== 'string') throw validacion(`"${campo}" debe ser texto`, { campo });
  const limpio = valor.trim();
  if (limpio.length > max) throw validacion(`"${campo}" admite máximo ${max} caracteres`, { campo });
  return limpio;
}

function fecha(valor, campo, { nulo = false } = {}) {
  if (valor == null && nulo) return null;
  const t = valor instanceof Date ? aTexto(valor) : valor;
  if (!esFechaValida(t)) throw validacion(`"${campo}" debe tener el formato AAAA-MM-DD`, { campo });
  return t;
}

/**
 * Valida y normaliza la configuración completa de un reto. Recibe el estado
 * final (datos actuales + cambios) para validar la combinación.
 */
export function normalizarConfiguracion(d) {
  const c = {};
  c.nombre = texto(d.nombre, 'nombre', { max: 80, obligatorio: true });
  c.descripcion = texto(d.descripcion, 'descripcion', { max: 1000 });
  c.meta = texto(d.meta, 'meta', { max: 200 });

  if (!FRECUENCIAS.includes(d.frecuencia)) {
    throw validacion('"frecuencia" debe ser DIARIA, SEMANAL o DIAS_ESPECIFICOS', { campo: 'frecuencia' });
  }
  c.frecuencia = d.frecuencia;
  c.vecesPorSemana = null;
  c.diasSemana = [];
  if (d.frecuencia === 'SEMANAL') {
    c.vecesPorSemana = entero(d.vecesPorSemana, 'vecesPorSemana', { min: 1, max: 7 });
  } else if (d.frecuencia === 'DIAS_ESPECIFICOS') {
    const dias = [...new Set(d.diasSemana ?? [])].sort((a, b) => a - b);
    if (dias.length === 0 || dias.some((x) => !Number.isInteger(x) || x < 1 || x > 7)) {
      throw validacion('"diasSemana" debe tener al menos un día entre 1 (lunes) y 7 (domingo)', { campo: 'diasSemana' });
    }
    c.diasSemana = dias;
  }

  c.fechaInicio = fecha(d.fechaInicio, 'fechaInicio');
  c.fechaFin = fecha(d.fechaFin, 'fechaFin', { nulo: true });
  if (c.fechaFin && c.fechaFin < c.fechaInicio) {
    throw validacion('La fecha de fin no puede ser anterior a la fecha de inicio', { campo: 'fechaFin' });
  }

  c.puntosPorCumplimiento = entero(d.puntosPorCumplimiento ?? 10, 'puntosPorCumplimiento');
  c.puntosPorIncumplimiento = entero(d.puntosPorIncumplimiento ?? 0, 'puntosPorIncumplimiento');
  c.bonoRachaCada = entero(d.bonoRachaCada, 'bonoRachaCada', { min: 1, max: 365, nulo: true });
  c.bonoRachaPuntos = entero(d.bonoRachaPuntos ?? 0, 'bonoRachaPuntos');
  c.requiereEvidencia = Boolean(d.requiereEvidencia);
  c.requiereAprobacion = Boolean(d.requiereAprobacion);
  c.diasGraciaRegistro = entero(d.diasGraciaRegistro ?? 0, 'diasGraciaRegistro', { max: 7 });
  c.porcentajeMinimoCumplimiento = entero(d.porcentajeMinimoCumplimiento ?? 100, 'porcentajeMinimoCumplimiento', { min: 1, max: 100 });
  c.permiteAbandono = d.permiteAbandono ?? true;

  // Castigo: se define junto con el reto (descripción y/o puntos a restar).
  const castigo = d.castigo ?? null;
  c.castigoPeriodo = null;
  c.castigoDescripcion = null;
  c.castigoPuntos = 0;
  if (castigo) {
    const periodo = castigo.periodo ?? 'SEMANAL';
    if (!PERIODOS_CASTIGO.includes(periodo)) {
      throw validacion('"castigo.periodo" debe ser SEMANAL o AL_FINALIZAR', { campo: 'castigo.periodo' });
    }
    c.castigoPeriodo = periodo;
    c.castigoDescripcion = texto(castigo.descripcion, 'castigo.descripcion', { max: 500 });
    c.castigoPuntos = entero(castigo.puntos ?? 0, 'castigo.puntos');
    if (!c.castigoDescripcion && c.castigoPuntos === 0) {
      throw validacion('El castigo necesita una descripción o una cantidad de puntos', { campo: 'castigo' });
    }
    if (periodo === 'AL_FINALIZAR' && !c.fechaFin) {
      throw validacion('Un castigo "al finalizar" requiere que el reto tenga fecha de fin', { campo: 'castigo.periodo' });
    }
  }
  return c;
}

function castigoDe(reto) {
  return reto.castigoPeriodo
    ? { periodo: reto.castigoPeriodo, descripcion: reto.castigoDescripcion, puntos: reto.castigoPuntos }
    : null;
}

// -----------------------------------------------------------------------------
//  Crear
// -----------------------------------------------------------------------------

/**
 * Crea un hábito-reto.
 *
 * PERSONAL: `grupoId` se omite; el creador es el único participante.
 * GRUPAL:   `grupoId` obligatorio. `participantes` = ids de miembros del grupo
 *           a quienes se les pone el reto; si se omite, participa todo el grupo
 *           (incluido el creador).
 *
 * @param {string} creadorId
 * @param {object} datos  ver normalizarConfiguracion() + { tipo, grupoId, participantes }
 */
export async function crearReto(creadorId, datos, { ahora = new Date() } = {}) {
  const creador = await obtenerUsuario(prisma, creadorId);
  const tipo = datos.tipo ?? (datos.grupoId ? 'GRUPAL' : 'PERSONAL');
  if (!['PERSONAL', 'GRUPAL'].includes(tipo)) throw validacion('"tipo" debe ser PERSONAL o GRUPAL');

  const hoy = hoyEn(creador.zonaHoraria, ahora);
  const config = normalizarConfiguracion({ ...datos, fechaInicio: datos.fechaInicio ?? hoy });
  if (config.fechaInicio < hoy) {
    throw validacion('La fecha de inicio no puede estar en el pasado', { campo: 'fechaInicio' });
  }

  let participantesIds = [creadorId];
  let grupoId = null;
  if (tipo === 'GRUPAL') {
    grupoId = datos.grupoId;
    if (!grupoId) throw validacion('Un reto grupal necesita "grupoId"', { campo: 'grupoId' });
    const grupo = await prisma.grupo.findUnique({ where: { id: grupoId } });
    const membresia = await obtenerMembresia(prisma, grupoId, creadorId);
    if (!grupo || (!membresia && !esAdminGeneral(creador))) throw noEncontrado('Grupo no encontrado');
    if (grupo.soloAdminsCreanRetos && membresia?.rol !== 'ADMIN' && !esAdminGeneral(creador)) {
      throw sinPermiso('En este grupo solo los administradores pueden crear retos');
    }

    const miembros = await prisma.miembroGrupo.findMany({ where: { grupoId }, select: { usuarioId: true } });
    const idsMiembros = new Set(miembros.map((m) => m.usuarioId));
    participantesIds = datos.participantes?.length ? [...new Set(datos.participantes)] : [...idsMiembros];
    const ajenos = participantesIds.filter((id) => !idsMiembros.has(id));
    if (ajenos.length) throw validacion('Todos los participantes deben ser miembros del grupo', { ajenos });
  } else if (datos.participantes?.some((id) => id !== creadorId)) {
    throw validacion('Un reto personal solo puede tener a su creador como participante');
  }

  if (config.requiereAprobacion && tipo !== 'GRUPAL') {
    throw validacion('La aprobación de evidencias solo aplica a retos grupales', { campo: 'requiereAprobacion' });
  }

  return prisma.$transaction(async (tx) => {
    const reto = await tx.reto.create({
      data: {
        ...config,
        tipo,
        grupoId,
        creadorId,
        fechaInicio: aDate(config.fechaInicio),
        fechaFin: aDate(config.fechaFin),
      },
    });
    const usuarios = await tx.usuario.findMany({ where: { id: { in: participantesIds } } });
    await tx.participanteReto.createMany({
      data: usuarios.map((u) => ({
        retoId: reto.id,
        usuarioId: u.id,
        fechaIngreso: fechaIngresoPara(reto, u, ahora),
      })),
    });
    return tx.reto.findUnique({ where: { id: reto.id }, include: { participantes: true } });
  });
}

// -----------------------------------------------------------------------------
//  Consultar
// -----------------------------------------------------------------------------

export async function obtenerReto(actorId, retoId) {
  const actor = await obtenerUsuario(prisma, actorId);
  const reto = await prisma.reto.findUnique({
    where: { id: retoId },
    include: {
      grupo: { select: { id: true, nombre: true } },
      creador: { select: { id: true, nombre: true, fotoUrl: true } },
      participantes: {
        include: { usuario: { select: { id: true, nombre: true, fotoUrl: true } }, pausas: true },
        orderBy: [{ puntos: 'desc' }, { mejorRacha: 'desc' }],
      },
    },
  });
  if (!reto) throw noEncontrado('Reto no encontrado');
  await exigirVerReto(prisma, reto, actor);
  return { ...reto, castigo: castigoDe(reto) };
}

/**
 * Retos del usuario (pantalla "Mis hábitos"). filtro: 'TODOS' | 'PERSONAL' | 'GRUPAL'.
 * Por defecto solo los activos y en los que sigue participando.
 */
export async function listarRetosUsuario(usuarioId, { tipo = 'TODOS', incluirTerminados = false } = {}) {
  const whereReto = {};
  if (!incluirTerminados) whereReto.estado = 'ACTIVO';
  if (tipo !== 'TODOS') whereReto.tipo = tipo;
  return prisma.participanteReto.findMany({
    where: {
      usuarioId,
      ...(incluirTerminados ? {} : { estado: { in: ['ACTIVO', 'PAUSADO'] } }),
      reto: whereReto,
    },
    include: { reto: { include: { grupo: { select: { id: true, nombre: true } } } } },
    orderBy: { unidoEn: 'desc' },
  });
}

/** Retos de un grupo (pantalla "Detalle de grupo"). */
export async function listarRetosGrupo(actorId, grupoId, { incluirTerminados = false } = {}) {
  const actor = await obtenerUsuario(prisma, actorId);
  const m = await obtenerMembresia(prisma, grupoId, actorId);
  if (!m && !esAdminGeneral(actor)) throw noEncontrado('Grupo no encontrado');
  return prisma.reto.findMany({
    where: { grupoId, ...(incluirTerminados ? {} : { estado: 'ACTIVO' }) },
    include: { _count: { select: { participantes: true } } },
    orderBy: { creadoEn: 'desc' },
  });
}

// -----------------------------------------------------------------------------
//  Editar / eliminar
// -----------------------------------------------------------------------------

/**
 * Edita un reto activo. Reglas:
 *  * fechaInicio solo se puede cambiar si el reto aún no empezó.
 *  * Los puntos ya otorgados no se recalculan con los nuevos valores (el
 *    historial se respeta); las rachas sí se recalculan con la nueva frecuencia.
 *  * Si se desactiva la aprobación, los registros pendientes se aprueban.
 */
export async function editarReto(actorId, retoId, cambios, { ahora = new Date() } = {}) {
  const actor = await obtenerUsuario(prisma, actorId);
  const reto = await prisma.reto.findUnique({ where: { id: retoId } });
  if (!reto) throw noEncontrado('Reto no encontrado');
  await exigirGestionReto(prisma, reto, actor);
  if (reto.estado !== 'ACTIVO') throw conflicto('Solo se pueden editar retos activos');

  const desconocidos = Object.keys(cambios).filter((k) => !CAMPOS_EDITABLES.includes(k));
  if (desconocidos.length) throw validacion('Hay campos que no se pueden editar', { campos: desconocidos });

  const hoy = hoyEn(actor.zonaHoraria, ahora);
  const actual = {
    ...reto,
    fechaInicio: aTexto(reto.fechaInicio),
    fechaFin: aTexto(reto.fechaFin),
    castigo: castigoDe(reto),
  };
  if ('fechaInicio' in cambios && fecha(cambios.fechaInicio, 'fechaInicio') !== actual.fechaInicio) {
    if (actual.fechaInicio <= hoy) throw conflicto('No se puede cambiar la fecha de inicio de un reto que ya empezó');
    if (cambios.fechaInicio < hoy) throw validacion('La fecha de inicio no puede estar en el pasado');
  }
  if ('fechaFin' in cambios && cambios.fechaFin && cambios.fechaFin < hoy) {
    throw validacion('La nueva fecha de fin no puede estar en el pasado', { campo: 'fechaFin' });
  }
  // Al cambiar la frecuencia se descartan los parámetros de la anterior.
  if ('frecuencia' in cambios) {
    if (!('vecesPorSemana' in cambios)) actual.vecesPorSemana = null;
    if (!('diasSemana' in cambios)) actual.diasSemana = [];
  }

  const config = normalizarConfiguracion({ ...actual, ...cambios });
  if (config.requiereAprobacion && reto.tipo !== 'GRUPAL') {
    throw validacion('La aprobación de evidencias solo aplica a retos grupales');
  }

  return prisma.$transaction(async (tx) => {
    const editado = await tx.reto.update({
      where: { id: retoId },
      data: { ...config, fechaInicio: aDate(config.fechaInicio), fechaFin: aDate(config.fechaFin) },
    });
    const participantes = await tx.participanteReto.findMany({ where: { retoId }, select: { id: true } });

    if (reto.requiereAprobacion && !config.requiereAprobacion) {
      const pendientes = await tx.registroCumplimiento.findMany({
        where: { participante: { retoId }, estado: 'PENDIENTE' },
      });
      for (const r of pendientes) {
        const reg = await tx.registroCumplimiento.update({ where: { id: r.id }, data: { estado: 'APROBADO' } });
        await recalcularPuntosRegistro(tx, await cargarParticipante(tx, r.participanteId), reg);
      }
    }
    if ('fechaInicio' in cambios) {
      // Si el reto aún no empezaba, todos ingresan en la nueva fecha de inicio.
      await tx.participanteReto.updateMany({
        where: { retoId, fechaIngreso: { lt: aDate(config.fechaInicio) } },
        data: { fechaIngreso: aDate(config.fechaInicio) },
      });
    }
    for (const p of participantes) await recalcularParticipante(tx, p.id, { ahora });
    return { ...editado, castigo: castigoDe(editado) };
  });
}

/**
 * Elimina el reto con todo su historial (CU-04): participantes, registros,
 * evidencias, castigos y movimientos de puntos. Los puntos totales de los
 * afectados se recalculan.
 *
 * @returns {{ evidenciasPorBorrar: string[] }} public_id de Cloudinary que el
 *          backend debe borrar (o pasar `almacenamiento` para hacerlo aquí).
 */
export async function eliminarReto(actorId, retoId, { almacenamiento } = {}) {
  const actor = await obtenerUsuario(prisma, actorId);
  const reto = await prisma.reto.findUnique({ where: { id: retoId } });
  if (!reto) throw noEncontrado('Reto no encontrado');
  await exigirGestionReto(prisma, reto, actor);

  const evidenciasPorBorrar = await prisma.$transaction(async (tx) => {
    const participantes = await tx.participanteReto.findMany({ where: { retoId }, select: { usuarioId: true } });
    const evidencias = await tx.evidencia.findMany({
      where: { registro: { participante: { retoId } } },
      select: { publicId: true },
    });
    await tx.reto.delete({ where: { id: retoId } });
    for (const { usuarioId } of participantes) await sincronizarPuntosUsuario(tx, usuarioId);
    return evidencias.map((e) => e.publicId);
  });

  if (almacenamiento && evidenciasPorBorrar.length) {
    await almacenamiento.eliminarVarios(evidenciasPorBorrar).catch(() => {});
  }
  return { evidenciasPorBorrar };
}

/** Cancela un reto sin borrar su historial: deja de exigirse y de evaluarse. */
export async function cancelarReto(actorId, retoId) {
  const actor = await obtenerUsuario(prisma, actorId);
  const reto = await prisma.reto.findUnique({ where: { id: retoId } });
  if (!reto) throw noEncontrado('Reto no encontrado');
  await exigirGestionReto(prisma, reto, actor);
  if (reto.estado !== 'ACTIVO') throw conflicto('El reto ya no está activo');
  return prisma.reto.update({ where: { id: retoId }, data: { estado: 'CANCELADO', finalizadoEn: new Date() } });
}

// -----------------------------------------------------------------------------
//  Participantes
// -----------------------------------------------------------------------------

/** Ponerle el reto a más integrantes del grupo (o reactivar a quien salió). */
export async function agregarParticipantes(actorId, retoId, usuarioIds, { ahora = new Date() } = {}) {
  const actor = await obtenerUsuario(prisma, actorId);
  const reto = await prisma.reto.findUnique({ where: { id: retoId } });
  if (!reto) throw noEncontrado('Reto no encontrado');
  await exigirGestionReto(prisma, reto, actor);
  if (reto.tipo !== 'GRUPAL') throw validacion('Solo se agregan participantes a retos grupales');
  if (reto.estado !== 'ACTIVO') throw conflicto('El reto ya no está activo');

  const ids = [...new Set(usuarioIds)];
  const miembros = await prisma.miembroGrupo.findMany({
    where: { grupoId: reto.grupoId, usuarioId: { in: ids } },
    include: { usuario: true },
  });
  if (miembros.length !== ids.length) throw validacion('Todos los participantes deben ser miembros del grupo');

  return prisma.$transaction(async (tx) => {
    for (const { usuario } of miembros) {
      const fechaIngreso = fechaIngresoPara(reto, usuario, ahora);
      const p = await tx.participanteReto.upsert({
        where: { retoId_usuarioId: { retoId, usuarioId: usuario.id } },
        create: { retoId, usuarioId: usuario.id, fechaIngreso },
        // Reingreso: se le exige desde hoy; su historial anterior se conserva.
        update: { estado: 'ACTIVO', salidaEn: null, fechaIngreso },
      });
      await recalcularParticipante(tx, p.id, { ahora });
    }
    return tx.participanteReto.findMany({ where: { retoId } });
  });
}

/** El admin/creador quita a alguien del reto (conserva su historial). */
export async function removerParticipante(actorId, retoId, usuarioId) {
  const actor = await obtenerUsuario(prisma, actorId);
  const reto = await prisma.reto.findUnique({ where: { id: retoId } });
  if (!reto) throw noEncontrado('Reto no encontrado');
  await exigirGestionReto(prisma, reto, actor);
  const p = await prisma.participanteReto.findUnique({ where: { retoId_usuarioId: { retoId, usuarioId } } });
  if (!p || ['REMOVIDO', 'ABANDONADO'].includes(p.estado)) throw noEncontrado('Esa persona no participa en el reto');
  return prisma.participanteReto.update({
    where: { id: p.id },
    data: { estado: 'REMOVIDO', salidaEn: new Date() },
  });
}

/** RF-19: abandono voluntario, sujeto a la regla del reto. */
export async function abandonarReto(usuarioId, retoId) {
  const p = await participacionActiva(usuarioId, retoId);
  if (!p.reto.permiteAbandono) throw sinPermiso('Las reglas de este reto no permiten abandonarlo');
  return prisma.participanteReto.update({
    where: { id: p.id },
    data: { estado: 'ABANDONADO', salidaEn: new Date() },
  });
}

// -----------------------------------------------------------------------------
//  Pausas (RN-02)
// -----------------------------------------------------------------------------

/**
 * Pausa la participación (o el hábito personal) por causa mayor. La racha se
 * congela y los días pausados no generan incumplimientos ni castigos.
 * @param {{ hasta?: string, motivo?: string }} opciones  hasta = último día de pausa (opcional)
 */
export async function pausarParticipacion(usuarioId, retoId, { hasta = null, motivo = null } = {}, { ahora = new Date() } = {}) {
  const p = await participacionActiva(usuarioId, retoId);
  if (p.estado === 'PAUSADO') throw conflicto('Ya tienes una pausa vigente en este reto');
  const hoy = hoyEn(p.usuario.zonaHoraria, ahora);
  if (hasta != null && (!esFechaValida(hasta) || hasta < hoy)) {
    throw validacion('"hasta" debe ser una fecha igual o posterior a hoy');
  }
  return prisma.$transaction(async (tx) => {
    await tx.pausa.create({
      data: {
        participanteId: p.id,
        fechaInicio: aDate(hoy),
        fechaFin: aDate(hasta),
        motivo: texto(motivo, 'motivo', { max: 300 }),
      },
    });
    await tx.participanteReto.update({ where: { id: p.id }, data: { estado: 'PAUSADO' } });
    return recalcularParticipante(tx, p.id, { ahora });
  });
}

/** Termina la pausa vigente: desde hoy se vuelve a exigir el reto. */
export async function reanudarParticipacion(usuarioId, retoId, { ahora = new Date() } = {}) {
  const p = await participacionActiva(usuarioId, retoId);
  if (p.estado !== 'PAUSADO') throw conflicto('No tienes una pausa vigente en este reto');
  const hoy = hoyEn(p.usuario.zonaHoraria, ahora);
  return prisma.$transaction(async (tx) => {
    const vigentes = await tx.pausa.findMany({
      where: {
        participanteId: p.id,
        fechaInicio: { lte: aDate(hoy) },
        OR: [{ fechaFin: null }, { fechaFin: { gte: aDate(hoy) } }],
      },
    });
    for (const pausa of vigentes) {
      if (aTexto(pausa.fechaInicio) === hoy) {
        await tx.pausa.delete({ where: { id: pausa.id } }); // pausa del mismo día: se anula
      } else {
        await tx.pausa.update({ where: { id: pausa.id }, data: { fechaFin: aDate(sumarDias(hoy, -1)) } });
      }
    }
    await tx.participanteReto.update({ where: { id: p.id }, data: { estado: 'ACTIVO' } });
    return recalcularParticipante(tx, p.id, { ahora });
  });
}

async function participacionActiva(usuarioId, retoId) {
  const p = await prisma.participanteReto.findUnique({
    where: { retoId_usuarioId: { retoId, usuarioId } },
    include: { reto: true, usuario: true },
  });
  if (!p || ['REMOVIDO', 'ABANDONADO'].includes(p.estado)) throw noEncontrado('No participas en este reto');
  if (p.reto.estado !== 'ACTIVO') throw fueraDeTiempo('El reto ya terminó');
  return p;
}
