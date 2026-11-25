import 'dotenv/config';
import { desconectar } from '@steply/database';
import app from './app.js';
import { validarArranque } from './config/entorno.js';
import { iniciarCierreDiario } from './services/cierreDiario.js';

const problemas = validarArranque(process.env);
if (problemas.length > 0) {
  console.error(problemas.join('\n'));
  process.exit(1);
}

const PORT = process.env.PORT || 3000;
const servidor = app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
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
