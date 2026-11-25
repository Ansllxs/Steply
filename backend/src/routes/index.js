import { Router } from 'express';
import { prisma } from '@steply/database';
import rutasAuth from './auth.js';
import rutasUsuarios from './usuarios.js';
import { almacenamientoEvidencias, almacenamientoPerfiles } from '../config/almacenamiento.js';
import rutasAmistades from './amistades.js';
import rutasGrupos from './grupos.js';
import rutasRetos from './retos.js';
import rutasProgreso from './progreso.js';

const router = Router();

router.get('/salud', (req, res) => {
  res.json({ ok: true, mensaje: 'Steply backend funcionando' });
});

router.get('/medios', (req, res) => {
  const id = String(req.query.id || '');
  const origen = String(req.query.origen || '');
  const perfil = almacenamientoPerfiles.archivos?.get(id);
  const evidencia = almacenamientoEvidencias.archivos?.get(id);
  const archivo = origen === 'perfil' ? perfil : origen === 'evidencia' ? evidencia : perfil || evidencia;
  if (!archivo) {
    res.status(404).json({ codigo: 'NO_ENCONTRADO', mensaje: 'La imagen no está disponible. En desarrollo sin Cloudinary solo vive mientras el servidor sigue encendido.' });
    return;
  }
  const png = archivo[0] === 0x89;
  const jpeg = archivo[0] === 0xff;
  const webp = archivo.slice(0, 4).toString() === 'RIFF';
  res.setHeader('Content-Type', png ? 'image/png' : jpeg ? 'image/jpeg' : webp ? 'image/webp' : 'application/octet-stream');
  res.setHeader('Cache-Control', 'private, max-age=60');
  res.send(archivo);
});

// Comprueba la conexión con la base de datos
router.get('/salud-bd', async (req, res, next) => {
  try {
    const usuarios = await prisma.usuario.count();
    res.json({ ok: true, usuarios });
  } catch (err) {
    next(err);
  }
});

router.use('/auth', rutasAuth);
router.use('/usuarios', rutasUsuarios);
router.use('/amistades', rutasAmistades);
router.use('/grupos', rutasGrupos);
router.use('/retos', rutasRetos);
router.use('/', rutasProgreso);

export default router;
