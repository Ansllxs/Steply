import * as servicioAuth from '../services/auth.js';

export async function registro(req, res, next) {
  try {
    const resultado = await servicioAuth.registrar(req.body);
    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const resultado = await servicioAuth.iniciarSesion(req.body);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

export function yo(req, res) {
  res.json({ usuario: servicioAuth.limpiarUsuario(req.usuario) });
}

export async function cambiarPassword(req, res, next) {
  try {
    const token = await servicioAuth.cambiarPassword(req.usuario, req.body);
    res.json({ mensaje: 'Contraseña actualizada', token });
  } catch (err) {
    next(err);
  }
}
