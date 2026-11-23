import { Router } from 'express';
import { prisma } from '@steply/database';
import rutasAuth from './auth.js';
import rutasUsuarios from './usuarios.js';
import rutasAmistades from './amistades.js';
import rutasGrupos from './grupos.js';
import rutasRetos from './retos.js';
import rutasProgreso from './progreso.js';

const router = Router();

router.get('/salud', (req, res) => {
  res.json({ ok: true, mensaje: 'Steply backend funcionando' });
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
