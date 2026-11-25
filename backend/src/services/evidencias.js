import { evidencias, registros, validacion } from '@steply/database';
import { almacenamientoEvidencias } from '../config/almacenamiento.js';

// Con multipart/form-data todo llega como texto, así que "true" se convierte a booleano
function aBooleano(valor) {
  if (valor === true || valor === 'true') return true;
  if (valor === false || valor === 'false') return false;
  throw validacion('"cumplido" debe ser true o false', { campo: 'cumplido' });
}

export async function registrarConFotos(usuario, retoId, body, archivos = []) {
  const cumplido = aBooleano(body.cumplido);
  if (!cumplido && archivos.length > 0) {
    throw validacion('Solo se pueden adjuntar fotos cuando el reto se cumplió', { campo: 'fotos' });
  }

  // Primero se valida cada foto y luego se suben. Un segundo envío del mismo día no agrega otra evidencia.
  archivos.forEach((archivo) => evidencias.validarArchivo(archivo));
  const subidas = [];
  try {
    for (const archivo of archivos) {
      subidas.push(await evidencias.subirEvidencia(archivo, { almacenamiento: almacenamientoEvidencias }));
    }
    return await registros.registrarCumplimiento(
      usuario.id,
      retoId,
      { cumplido, nota: body.nota || undefined, fecha: body.fecha || undefined, evidencias: subidas },
      { almacenamiento: almacenamientoEvidencias },
    );
  } catch (err) {
    // Si el registro falla, se borran las fotos que ya se habían subido
    if (subidas.length > 0) {
      almacenamientoEvidencias.eliminarVarios(subidas.map((s) => s.publicId)).catch(() => {});
    }
    throw err;
  }
}
