import * as servicio from '../services/amistades.js';

export async function enviar(req, res, next) {
  try {
    res.status(201).json({ amistad: await servicio.enviarSolicitud(req.usuario, req.body.usuarioId) });
  } catch (err) {
    next(err);
  }
}

export async function listar(req, res, next) {
  try {
    res.json(await servicio.listar(req.usuario));
  } catch (err) {
    next(err);
  }
}

export async function aceptar(req, res, next) {
  try {
    res.json({ amistad: await servicio.aceptar(req.usuario, req.params.id) });
  } catch (err) {
    next(err);
  }
}

export async function rechazar(req, res, next) {
  try {
    res.json({ amistad: await servicio.rechazar(req.usuario, req.params.id) });
  } catch (err) {
    next(err);
  }
}

export async function eliminar(req, res, next) {
  try {
    await servicio.eliminar(req.usuario, req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
