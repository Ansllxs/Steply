import { prisma, puntos, insignias } from '@steply/database';

export async function rankingReto(req, res, next) {
  try {
    res.json({ ranking: await puntos.rankingReto(req.usuario.id, req.params.id) });
  } catch (err) {
    next(err);
  }
}

export async function rankingGrupo(req, res, next) {
  try {
    res.json({ ranking: await puntos.rankingGrupo(req.usuario.id, req.params.id) });
  } catch (err) {
    next(err);
  }
}

export async function resumen(req, res, next) {
  try {
    res.json({ resumen: await puntos.resumenUsuario(req.usuario.id) });
  } catch (err) {
    next(err);
  }
}

// ?retoId= para filtrar, ?limite= y ?cursor= para paginar
export async function movimientos(req, res, next) {
  try {
    const { retoId, cursor } = req.query;
    const limite = req.query.limite ? Number(req.query.limite) : undefined;
    res.json({ movimientos: await puntos.movimientosUsuario(req.usuario.id, { retoId, limite, cursor }) });
  } catch (err) {
    next(err);
  }
}

export async function castigosReto(req, res, next) {
  try {
    const soloPendientes = req.query.pendientes === 'true';
    res.json({ castigos: await puntos.castigosReto(req.usuario.id, req.params.id, { soloPendientes }) });
  } catch (err) {
    next(err);
  }
}

export async function saldarCastigo(req, res, next) {
  try {
    res.json({ castigo: await puntos.saldarCastigo(req.usuario.id, req.params.id, true) });
  } catch (err) {
    next(err);
  }
}

export async function misInsignias(req, res, next) {
  try {
    res.json({ insignias: await insignias.listarInsignias(prisma, req.usuario.id) });
  } catch (err) {
    next(err);
  }
}
