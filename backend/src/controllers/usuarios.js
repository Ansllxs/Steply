import * as servicio from '../services/usuarios.js';
import { limpiarUsuario } from '../services/auth.js';

export function verMiPerfil(req, res) {
  res.json({ usuario: limpiarUsuario(req.usuario) });
}

export async function editarMiPerfil(req, res, next) {
  try {
    res.json({ usuario: await servicio.editarPerfil(req.usuario, req.body) });
  } catch (err) {
    next(err);
  }
}

export async function cambiarMiFoto(req, res, next) {
  try {
    res.json({ usuario: await servicio.cambiarFoto(req.usuario, req.file) });
  } catch (err) {
    next(err);
  }
}

export async function buscar(req, res, next) {
  try {
    res.json({ usuarios: await servicio.buscar(req.usuario, req.query.buscar) });
  } catch (err) {
    next(err);
  }
}

export async function perfilPublico(req, res, next) {
  try {
    res.json({ usuario: await servicio.perfilPublico(req.params.id) });
  } catch (err) {
    next(err);
  }
}
