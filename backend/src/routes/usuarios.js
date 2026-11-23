import { Router } from 'express';
import * as controlador from '../controllers/usuarios.js';
import { reglasEditarPerfil, reglasBuscar, reglaIdUsuario } from '../validators/usuarios.js';
import { validar } from '../middlewares/validar.js';
import { verificarToken } from '../middlewares/auth.js';
import { subida } from '../middlewares/subida.js';

const router = Router();
router.use(verificarToken);

// Las rutas con "me" van antes que "/:id" para que "me" no se tome como un id
router.get('/me', controlador.verMiPerfil);
router.patch('/me', reglasEditarPerfil, validar, controlador.editarMiPerfil);
router.put('/me/foto', subida.single('foto'), controlador.cambiarMiFoto);
router.get('/', reglasBuscar, validar, controlador.buscar);
router.get('/:id', reglaIdUsuario, validar, controlador.perfilPublico);

export default router;
