import { Router } from 'express';
import * as registros from '../controllers/registros.js';
import * as puntos from '../controllers/puntos.js';
import { idsEnRuta } from '../validators/comunes.js';
import { validar } from '../middlewares/validar.js';
import { verificarToken } from '../middlewares/auth.js';

// Rutas del día a día del usuario: hoy, calendario, puntos, insignias y revisiones.
// Aquí el token va en cada ruta y no con router.use, porque este router se monta
// directo en /api y si no pediría token también a las rutas que no existen.
const router = Router();

router.get('/hoy', verificarToken, registros.hoy);
router.get('/calendario', verificarToken, registros.calendario);
router.get('/pendientes', verificarToken, registros.pendientes);
router.post('/registros/:id/revision', verificarToken, idsEnRuta('id'), validar, registros.revisar);

router.get('/resumen', verificarToken, puntos.resumen);
router.get('/movimientos', verificarToken, puntos.movimientos);
router.post('/castigos/:id/saldar', verificarToken, idsEnRuta('id'), validar, puntos.saldarCastigo);
router.get('/insignias', verificarToken, puntos.misInsignias);

export default router;
