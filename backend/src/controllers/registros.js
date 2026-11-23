import { registros } from '@steply/database';
import { registrarConFotos } from '../services/evidencias.js';

export async function registrar(req, res, next) {
  try {
    const resultado = await registrarConFotos(req.usuario, req.params.id, req.body ?? {}, req.files);
    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

// ?usuarioId= para ver el de otro participante, ?desde= y ?hasta= en formato AAAA-MM-DD
export async function historial(req, res, next) {
  try {
    const { usuarioId, desde, hasta } = req.query;
    const resultado = await registros.historialCumplimiento(req.usuario.id, req.params.id, {
      usuarioId: usuarioId || req.usuario.id,
      desde,
      hasta,
    });
    res.json({ historial: resultado });
  } catch (err) {
    next(err);
  }
}

export async function hoy(req, res, next) {
  try {
    res.json({ hoy: await registros.retosDelDia(req.usuario.id, { fecha: req.query.fecha }) });
  } catch (err) {
    next(err);
  }
}

export async function calendario(req, res, next) {
  try {
    const anio = Number(req.query.anio);
    const mes = Number(req.query.mes);
    res.json({ calendario: await registros.calendarioMensual(req.usuario.id, anio, mes, { retoId: req.query.retoId }) });
  } catch (err) {
    next(err);
  }
}

export async function pendientes(req, res, next) {
  try {
    const { grupoId, retoId } = req.query;
    res.json({ pendientes: await registros.listarPendientesRevision(req.usuario.id, { grupoId, retoId }) });
  } catch (err) {
    next(err);
  }
}

export async function revisar(req, res, next) {
  try {
    const { aprobar, motivo } = req.body;
    res.json(await registros.revisarRegistro(req.usuario.id, req.params.id, { aprobar, motivo }));
  } catch (err) {
    next(err);
  }
}
