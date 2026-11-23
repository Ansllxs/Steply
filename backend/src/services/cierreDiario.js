import { cierre } from '@steply/database';
import { borrarGruposVacios } from './grupos.js';

const UNA_HORA = 60 * 60 * 1000;

// Tareas que se repiten cada hora. Se pueden repetir sin problema.
// 1. El cierre diario marca incumplimientos, aplica castigos y termina los retos vencidos.
// 2. Se borran los grupos que llevan varios días sin ningún miembro.
async function ejecutar() {
  try {
    const resumen = await cierre.ejecutarCierreDiario();
    console.log('Cierre diario ejecutado', resumen);
  } catch (err) {
    // Un fallo aquí no debe tumbar el servidor, se intenta de nuevo en la próxima hora
    console.error('Falló el cierre diario', err);
  }

  try {
    const borrados = await borrarGruposVacios();
    if (borrados > 0) console.log(`Grupos vacíos borrados: ${borrados}`);
  } catch (err) {
    console.error('Falló el borrado de grupos vacíos', err);
  }
}

export function iniciarCierreDiario() {
  ejecutar();
  return setInterval(ejecutar, UNA_HORA);
}
