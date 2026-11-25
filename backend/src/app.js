import express from 'express';
import cors from 'cors';
import rutas from './routes/index.js';
import { origenesPermitidos } from './config/entorno.js';
import { rutaNoEncontrada, manejadorErrores } from './middlewares/errores.js';

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: origenesPermitidos(process.env) }));
app.use(express.json({ limit: '1mb' }));

app.use('/api', rutas);

// Estos dos van siempre al final
app.use(rutaNoEncontrada);
app.use(manejadorErrores);

export default app;
