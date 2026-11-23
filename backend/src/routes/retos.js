import { Router } from 'express';
import * as retos from '../controllers/retos.js';
import * as registros from '../controllers/registros.js';
import * as puntos from '../controllers/puntos.js';
import { idsEnRuta } from '../validators/comunes.js';
import { validar } from '../middlewares/validar.js';
import { verificarToken } from '../middlewares/auth.js';
import { subida } from '../middlewares/subida.js';

const router = Router();
router.use(verificarToken);

const id = [idsEnRuta('id'), validar];

router.post('/', retos.crear);
router.get('/', retos.listarMios);
router.get('/:id', id, retos.obtener);
router.patch('/:id', id, retos.editar);
router.delete('/:id', id, retos.eliminar);
router.post('/:id/cancelar', id, retos.cancelar);

router.post('/:id/participantes', id, retos.agregarParticipantes);
router.delete('/:id/participantes/:usuarioId', idsEnRuta('id', 'usuarioId'), validar, retos.removerParticipante);
router.post('/:id/abandonar', id, retos.abandonar);
router.post('/:id/pausa', id, retos.pausar);
router.delete('/:id/pausa', id, retos.reanudar);

// Las fotos van en el campo "fotos" (hasta 5). También acepta JSON sin fotos
router.post('/:id/registros', id, subida.array('fotos', 5), registros.registrar);
router.get('/:id/registros', id, registros.historial);

router.get('/:id/ranking', id, puntos.rankingReto);
router.get('/:id/castigos', id, puntos.castigosReto);

export default router;
