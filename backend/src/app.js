import express from 'express';
import cors from 'cors';
import rutas from './routes/index.js';
import { rutaNoEncontrada, manejadorErrores } from './middlewares/errores.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', rutas);

// Estos dos van siempre al final
app.use(rutaNoEncontrada);
app.use(manejadorErrores);

export default app;
