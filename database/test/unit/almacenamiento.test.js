import assert from 'node:assert/strict';
import test from 'node:test';
import { ErrorSteply } from '../../src/errores.js';
import {
  crearAlmacenamientoMemoria,
  crearAlmacenamientoNoDisponible,
} from '../../src/almacenamiento/cloudinary.js';
import { normalizarEvidencia } from '../../src/servicios/evidencias.js';

test('la memoria solo acepta las fotos que ella misma guardó', async () => {
  const almacen = crearAlmacenamientoMemoria({ carpeta: 'steply/perfiles' });
  const foto = await almacen.subir(Buffer.from('abc'), { formato: 'png' });
  assert.equal(almacen.nombre, 'memoria');
  assert.equal(foto.publicId.startsWith('steply/perfiles/'), true);
  assert.equal(almacen.esUrlPropia(foto.url, foto.publicId), true);
  assert.equal(almacen.esUrlPropia('https://ejemplo.com/foto.png', foto.publicId), false);
  assert.equal(almacen.esUrlPropia(foto.url, 'steply/perfiles/ajena'), false);
  assert.doesNotThrow(() => normalizarEvidencia(foto, { almacenamiento: almacen }));
});

test('sin almacenamiento permanente la subida no se presenta como guardada', async () => {
  const almacen = crearAlmacenamientoNoDisponible();
  await assert.rejects(
    () => almacen.subir(Buffer.from('abc')),
    (error) => {
      assert.equal(error instanceof ErrorSteply, true);
      assert.equal(error.codigo, 'NO_DISPONIBLE');
      assert.equal(error.status, 503);
      assert.match(error.message, /no se guardó/i);
      return true;
    },
  );
  assert.equal(almacen.esUrlPropia('https://res.cloudinary.com/demo/image/upload/x.jpg', 'x'), false);
});
