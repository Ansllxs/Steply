import { Router } from 'express';
import * as controlador from '../controllers/auth.js';
import { reglasRegistro, reglasLogin, reglasCambiarPassword } from '../validators/auth.js';
import { validar } from '../middlewares/validar.js';
import { verificarToken } from '../middlewares/auth.js';
import { limitarIntentos } from '../middlewares/limite.js';

const router = Router();
const limiteAuth = limitarIntentos({ max: 10, ventanaMs: 10 * 60 * 1000 });

router.post('/registro', limiteAuth, reglasRegistro, validar, controlador.registro);
router.post('/login', limiteAuth, reglasLogin, validar, controlador.login);
router.get('/me', verificarToken, controlador.yo);
router.post('/cambiar-password', verificarToken, reglasCambiarPassword, validar, controlador.cambiarPassword);

export default router;
