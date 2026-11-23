import { Router } from 'express';
import * as controlador from '../controllers/amistades.js';
import { reglasEnviar, reglaIdAmistad } from '../validators/amistades.js';
import { validar } from '../middlewares/validar.js';
import { verificarToken } from '../middlewares/auth.js';

const router = Router();
router.use(verificarToken);

router.post('/', reglasEnviar, validar, controlador.enviar);
router.get('/', controlador.listar);
router.post('/:id/aceptar', reglaIdAmistad, validar, controlador.aceptar);
router.post('/:id/rechazar', reglaIdAmistad, validar, controlador.rechazar);
router.delete('/:id', reglaIdAmistad, validar, controlador.eliminar);

export default router;
