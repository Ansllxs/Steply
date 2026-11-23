import express from 'express';
import cors from 'cors';
import { prisma } from '@steply/database';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/salud', (req, res) => {
  res.json({ ok: true, mensaje: 'Steply backend funcionando' });
});

// Ruta temporal para comprobar la conexión con la base de datos
app.get('/api/salud-bd', async (req, res, next) => {
  try {
    const usuarios = await prisma.usuario.count();
    res.json({ ok: true, usuarios });
  } catch (err) {
    next(err);
  }
});

export default app;