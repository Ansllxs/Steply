import { retos } from '@steply/database';
import { almacenamientoEvidencias } from '../config/almacenamiento.js';

export async function crear(req, res, next) {
  try {
    res.status(201).json({ reto: await retos.crearReto(req.usuario.id, req.body) });
  } catch (err) {
    next(err);
  }
}

// ?tipo=PERSONAL|GRUPAL|TODOS y ?terminados=true para incluir los ya terminados
export async function listarMios(req, res, next) {
  try {
    const tipo = req.query.tipo || 'TODOS';
    const incluirTerminados = req.query.terminados === 'true';
    res.json({ retos: await retos.listarRetosUsuario(req.usuario.id, { tipo, incluirTerminados }) });
  } catch (err) {
    next(err);
  }
}

export async function listarDeGrupo(req, res, next) {
  try {
    const incluirTerminados = req.query.terminados === 'true';
    res.json({ retos: await retos.listarRetosGrupo(req.usuario.id, req.params.id, { incluirTerminados }) });
  } catch (err) {
    next(err);
  }
}

export async function obtener(req, res, next) {
  try {
    res.json({ reto: await retos.obtenerReto(req.usuario.id, req.params.id) });
  } catch (err) {
    next(err);
  }
}

export async function editar(req, res, next) {
  try {
    res.json({ reto: await retos.editarReto(req.usuario.id, req.params.id, req.body) });
  } catch (err) {
    next(err);
  }
}

export async function eliminar(req, res, next) {
  try {
    await retos.eliminarReto(req.usuario.id, req.params.id, { almacenamiento: almacenamientoEvidencias });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function cancelar(req, res, next) {
  try {
    res.json({ reto: await retos.cancelarReto(req.usuario.id, req.params.id) });
  } catch (err) {
    next(err);
  }
}

export async function agregarParticipantes(req, res, next) {
  try {
    const resultado = await retos.agregarParticipantes(req.usuario.id, req.params.id, req.body.usuarioIds ?? []);
    res.json({ participantes: resultado });
  } catch (err) {
    next(err);
  }
}

export async function removerParticipante(req, res, next) {
  try {
    await retos.removerParticipante(req.usuario.id, req.params.id, req.params.usuarioId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function abandonar(req, res, next) {
  try {
    res.json({ participante: await retos.abandonarReto(req.usuario.id, req.params.id) });
  } catch (err) {
    next(err);
  }
}

export async function pausar(req, res, next) {
  try {
    const { hasta, motivo } = req.body ?? {};
    res.json({ participante: await retos.pausarParticipacion(req.usuario.id, req.params.id, { hasta, motivo }) });
  } catch (err) {
    next(err);
  }
}

export async function reanudar(req, res, next) {
  try {
    res.json({ participante: await retos.reanudarParticipacion(req.usuario.id, req.params.id) });
  } catch (err) {
    next(err);
  }
}
