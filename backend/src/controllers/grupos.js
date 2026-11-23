import * as servicio from '../services/grupos.js';

export async function crear(req, res, next) {
  try {
    res.status(201).json({ grupo: await servicio.crear(req.usuario, req.body) });
  } catch (err) {
    next(err);
  }
}

export async function listarMios(req, res, next) {
  try {
    res.json({ grupos: await servicio.listarMios(req.usuario) });
  } catch (err) {
    next(err);
  }
}

export async function obtener(req, res, next) {
  try {
    res.json({ grupo: await servicio.obtener(req.usuario, req.params.id) });
  } catch (err) {
    next(err);
  }
}

export async function unirse(req, res, next) {
  try {
    res.status(201).json({ grupo: await servicio.unirse(req.usuario, req.body.codigo) });
  } catch (err) {
    next(err);
  }
}

export async function editar(req, res, next) {
  try {
    res.json({ grupo: await servicio.editar(req.usuario, req.params.id, req.body) });
  } catch (err) {
    next(err);
  }
}

export async function regenerarCodigo(req, res, next) {
  try {
    res.json(await servicio.regenerarCodigo(req.usuario, req.params.id));
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

export async function cambiarRol(req, res, next) {
  try {
    const { id, usuarioId } = req.params;
    res.json({ grupo: await servicio.cambiarRol(req.usuario, id, usuarioId, req.body.rol) });
  } catch (err) {
    next(err);
  }
}

export async function quitarMiembro(req, res, next) {
  try {
    await servicio.quitarMiembro(req.usuario, req.params.id, req.params.usuarioId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function salir(req, res, next) {
  try {
    await servicio.salir(req.usuario, req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
