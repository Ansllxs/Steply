import { Router } from 'express';
import * as controlador from '../controllers/auth.js';
import { reglasRegistro, reglasLogin, reglasCambiarPassword } from '../validators/auth.js';
import { validar } from '../middlewares/validar.js';
import { verificarToken } from '../middlewares/auth.js';

const router = Router();

router.post('/registro', reglasRegistro, validar, controlador.registro);
router.post('/login', reglasLogin, validar, controlador.login);
router.get('/me', verificarToken, controlador.yo);
router.post('/cambiar-password', verificarToken, reglasCambiarPassword, validar, controlador.cambiarPassword);

export default router;
