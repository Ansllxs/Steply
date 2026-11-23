import 'dotenv/config';
import { desconectar } from '@steply/database';
import app from './app.js';
import { iniciarCierreDiario } from './services/cierreDiario.js';

// Sin estas variables el servidor no puede funcionar, así que se avisa y se detiene
const faltantes = ['DATABASE_URL', 'JWT_SECRET'].filter((nombre) => !process.env[nombre]);
if (faltantes.length > 0) {
  console.error(`Faltan variables en backend/.env: ${faltantes.join(', ')}. Copie backend/.env.example y complételo.`);
  process.exit(1);
}

const PORT = process.env.PORT || 3000;
const servidor = app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});

const intervaloCierre = iniciarCierreDiario();

// Al apagar (Ctrl+C o el hosting), se detiene el cierre y se cierra la conexión a la base
async function apagar() {
  clearInterval(intervaloCierre);
  servidor.close();
  await desconectar();
  process.exit(0);
}
process.on('SIGINT', apagar);
process.on('SIGTERM', apagar);
