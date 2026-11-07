// Evidencias (RF-14, CU-08). Las fotos viven en Cloudinary; aquí se valida y
// se guarda la referencia ligada al registro diario.

import { prisma } from '../cliente.js';
import { conflicto, fueraDeTiempo, noEncontrado, sinPermiso, validacion } from '../errores.js';
import { aTexto, hoyEn } from '../utils/fechas.js';
import { ventanaRegistro } from '../logica/reglas.js';
import { exigirVerReto, obtenerUsuario, puedeGestionarReto } from './permisos.js';

export const FORMATOS_PERMITIDOS = ['jpg', 'jpeg', 'png', 'webp', 'heic'];
export const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_EVIDENCIAS_POR_REGISTRO = 5;

const MIME_A_FORMATO = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
};

/**
 * CU-08 2a: valida formato y tamaño de un archivo antes de subirlo.
 * @param {{ mimetype?: string, size?: number, buffer?: Buffer }} archivo  (forma de multer)
 * @returns {string} formato normalizado
 */
export function validarArchivo(archivo) {
  const formato = MIME_A_FORMATO[archivo?.mimetype?.toLowerCase()];
  if (!formato) {
    throw validacion('Formato de archivo no válido. Usa JPG, PNG, WEBP o HEIC', { campo: 'evidencia' });
  }
  const bytes = archivo.size ?? archivo.buffer?.length ?? 0;
  if (bytes <= 0 || bytes > MAX_BYTES) {
    throw validacion('La imagen debe pesar como máximo 5 MB', { campo: 'evidencia' });
  }
  return formato;
}

/** Valida y sube un archivo; devuelve el objeto listo para `evidencias`. */
export async function subirEvidencia(archivo, { almacenamiento }) {
  const formato = validarArchivo(archivo);
  return almacenamiento.subir(archivo.buffer, { formato });
}

/** Valida los datos de una evidencia ya subida (por el backend o el frontend). */
export function normalizarEvidencia(e, { almacenamiento } = {}) {
  const formato = String(e?.formato ?? '').toLowerCase();
  if (!e?.url?.startsWith('https://') || !e.publicId) {
    throw validacion('Evidencia inválida: falta la URL segura o el public_id', { campo: 'evidencias' });
  }
  if (!FORMATOS_PERMITIDOS.includes(formato)) throw validacion('Formato de evidencia no válido', { campo: 'evidencias' });
  if (!Number.isInteger(e.bytes) || e.bytes <= 0 || e.bytes > MAX_BYTES) {
    throw validacion('La imagen debe pesar como máximo 5 MB', { campo: 'evidencias' });
  }
  if (almacenamiento?.esUrlPropia && !almacenamiento.esUrlPropia(e.url, e.publicId)) {
    throw validacion('La evidencia no pertenece al almacenamiento de Steply', { campo: 'evidencias' });
  }
  return {
    url: e.url,
    publicId: e.publicId,
    formato,
    bytes: e.bytes,
    ancho: e.ancho ?? null,
    alto: e.alto ?? null,
  };
}

/**
 * Agrega evidencias a un registro existente. Solo su dueño, dentro de la
 * ventana de registro y si el registro no fue revisado todavía.
 */
export async function agregarEvidencias(usuarioId, registroId, evidencias, { almacenamiento, ahora = new Date() } = {}) {
  const registro = await prisma.registroCumplimiento.findUnique({
    where: { id: registroId },
    include: { participante: { include: { reto: true, usuario: true } }, _count: { select: { evidencias: true } } },
  });
  if (!registro || registro.participante.usuarioId !== usuarioId) throw noEncontrado('Registro no encontrado');
  if (!registro.cumplido) throw validacion('Solo se agregan evidencias a un registro cumplido');
  if (registro.revisadoEn) throw conflicto('El registro ya fue revisado');
  const { reto, usuario } = registro.participante;
  const { desde } = ventanaRegistro(reto, hoyEn(usuario.zonaHoraria, ahora));
  if (aTexto(registro.fecha) < desde) throw fueraDeTiempo('Ya pasó el tiempo para modificar este registro');
  if (registro._count.evidencias + evidencias.length > MAX_EVIDENCIAS_POR_REGISTRO) {
    throw validacion(`Máximo ${MAX_EVIDENCIAS_POR_REGISTRO} evidencias por registro`);
  }
  const datos = evidencias.map((e) => ({ ...normalizarEvidencia(e, { almacenamiento }), registroId }));
  await prisma.evidencia.createMany({ data: datos });
  return prisma.evidencia.findMany({ where: { registroId }, orderBy: { subidaEn: 'asc' } });
}

/** Borra una evidencia (dueño, o quien gestiona el reto para moderar). */
export async function eliminarEvidencia(actorId, evidenciaId, { almacenamiento } = {}) {
  const actor = await obtenerUsuario(prisma, actorId);
  const evidencia = await prisma.evidencia.findUnique({
    where: { id: evidenciaId },
    include: {
      registro: { include: { participante: { include: { reto: true } }, _count: { select: { evidencias: true } } } },
    },
  });
  if (!evidencia) throw noEncontrado('Evidencia no encontrada');
  const { registro } = evidencia;
  const { reto } = registro.participante;
  const esDueno = registro.participante.usuarioId === actorId;
  if (!esDueno && !(await puedeGestionarReto(prisma, reto, actor))) throw sinPermiso();
  if (esDueno && reto.requiereEvidencia && registro.cumplido && registro._count.evidencias <= 1) {
    throw conflicto('Este reto exige evidencia: no puedes borrar la única foto del registro');
  }
  await prisma.evidencia.delete({ where: { id: evidenciaId } });
  if (almacenamiento) await almacenamiento.eliminar(evidencia.publicId).catch(() => {});
  return { eliminada: evidenciaId, publicId: evidencia.publicId };
}

/** Galería de evidencias de un reto (pantalla "Detalle de hábito"). */
export async function listarEvidenciasReto(actorId, retoId, { usuarioId, limite = 30 } = {}) {
  const actor = await obtenerUsuario(prisma, actorId);
  const reto = await prisma.reto.findUnique({ where: { id: retoId } });
  if (!reto) throw noEncontrado('Reto no encontrado');
  await exigirVerReto(prisma, reto, actor);
  return prisma.evidencia.findMany({
    where: { registro: { participante: { retoId, ...(usuarioId ? { usuarioId } : {}) } } },
    include: {
      registro: {
        select: {
          fecha: true,
          estado: true,
          participante: { select: { usuario: { select: { id: true, nombre: true } } } },
        },
      },
    },
    orderBy: { subidaEn: 'desc' },
    take: Math.min(limite, 100),
  });
}
