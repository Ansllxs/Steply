import { Router } from 'express';
import * as controlador from '../controllers/grupos.js';
import { reglaIdGrupo, reglasCrear, reglasEditar, reglasUnirse, reglasMiembro, reglasCambiarRol, reglasInvitar, reglaInvitacion } from '../validators/grupos.js';
import * as invitaciones from '../controllers/invitaciones.js';
import { validar } from '../middlewares/validar.js';
import { verificarToken } from '../middlewares/auth.js';
import * as retos from '../controllers/retos.js';
import * as puntos from '../controllers/puntos.js';

const router = Router();
router.use(verificarToken);

router.get('/invitaciones', invitaciones.listarMias);
router.post('/invitaciones/:invitacionId/aceptar', reglaInvitacion, validar, invitaciones.aceptar);
router.post('/invitaciones/:invitacionId/rechazar', reglaInvitacion, validar, invitaciones.rechazar);

router.post('/', reglasCrear, validar, controlador.crear);
router.get('/', controlador.listarMios);
router.post('/unirse', reglasUnirse, validar, controlador.unirse);
router.get('/:id', reglaIdGrupo, validar, controlador.obtener);
router.patch('/:id', reglasEditar, validar, controlador.editar);
router.delete('/:id', reglaIdGrupo, validar, controlador.eliminar);
router.post('/:id/regenerar-codigo', reglaIdGrupo, validar, controlador.regenerarCodigo);
router.post('/:id/invitaciones', reglasInvitar, validar, invitaciones.invitar);
router.get('/:id/invitaciones', reglaIdGrupo, validar, invitaciones.listarDeGrupo);
router.get('/:id/retos', reglaIdGrupo, validar, retos.listarDeGrupo);
router.get('/:id/ranking', reglaIdGrupo, validar, puntos.rankingGrupo);

// "me" va antes que ":usuarioId" para que no se tome como un id
router.delete('/:id/miembros/me', reglaIdGrupo, validar, controlador.salir);
router.patch('/:id/miembros/:usuarioId', reglasCambiarRol, validar, controlador.cambiarRol);
router.delete('/:id/miembros/:usuarioId', reglasMiembro, validar, controlador.quitarMiembro);

export default router;
