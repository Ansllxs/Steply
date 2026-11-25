import 'dotenv/config';
import { desconectar, intentarLimpieza } from '@steply/database';
import app from './app.js';
import { almacenamientoEvidencias } from './config/almacenamiento.js';
import { validarArranque } from './config/entorno.js';
import { iniciarCierreDiario } from './services/cierreDiario.js';

const problemas = validarArranque(process.env);
if (problemas.length > 0) {
  console.error(problemas.join('\n'));
  process.exit(1);
}

const PORT = Number(process.env.PORT) || 3000;
const servidor = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
  intentarLimpieza(almacenamientoEvidencias).catch(() => {
    console.error('No se pudo reintentar la limpieza de imágenes pendientes.');
  });
});

const intervaloCierre = iniciarCierreDiario();
let cerrando = false;

function apagar() {
  if (cerrando) return;
  cerrando = true;
  clearInterval(intervaloCierre);
  const forzar = setTimeout(() => process.exit(1), 10000);
  forzar.unref();
  servidor.close(async () => {
    try {
      await desconectar();
    } finally {
      clearTimeout(forzar);
      process.exit(0);
    }
  });
}
process.on('SIGINT', apagar);
process.on('SIGTERM', apagar);
