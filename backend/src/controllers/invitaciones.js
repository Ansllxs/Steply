import * as servicio from '../services/invitaciones.js';

export async function invitar(req, res, next) {
  try {
    res.status(201).json({ invitacion: await servicio.invitar(req.usuario, req.params.id, req.body.usuarioId) });
  } catch (err) {
    next(err);
  }
}

export async function listarDeGrupo(req, res, next) {
  try {
    res.json({ invitaciones: await servicio.listarDeGrupo(req.usuario, req.params.id) });
  } catch (err) {
    next(err);
  }
}

export async function listarMias(req, res, next) {
  try {
    res.json({ invitaciones: await servicio.listarMias(req.usuario) });
  } catch (err) {
    next(err);
  }
}

export async function aceptar(req, res, next) {
  try {
    res.json({ invitacion: await servicio.aceptar(req.usuario, req.params.invitacionId) });
  } catch (err) {
    next(err);
  }
}

export async function rechazar(req, res, next) {
  try {
    res.json({ invitacion: await servicio.rechazar(req.usuario, req.params.invitacionId) });
  } catch (err) {
    next(err);
  }
}
