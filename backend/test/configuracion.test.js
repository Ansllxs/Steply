import assert from 'node:assert/strict';
import test from 'node:test';
import { validarArranque, origenesPermitidos } from '../src/config/entorno.js';
import { resolverAlmacenamiento } from '../src/config/almacenamiento.js';
import { limitarIntentos } from '../src/middlewares/limite.js';
import { resolveApiOrigin } from '../../frontend/src/services/api-origin.js';

const base = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/steply',
  JWT_SECRET: 'a'.repeat(32),
  CORS_ORIGIN: 'https://app.ejemplo.com',
  CLOUDINARY_CLOUD_NAME: 'nube',
  CLOUDINARY_API_KEY: 'clave',
  CLOUDINARY_API_SECRET: 'secreto',
};

test('producción válida no reporta problemas', () => {
  assert.deepEqual(validarArranque(base), []);
  assert.deepEqual(origenesPermitidos(base), ['https://app.ejemplo.com']);
});

test('producción rechaza secreto de ejemplo, CORS abierto y Cloudinary vacío', () => {
  const errores = validarArranque({
    ...base,
    JWT_SECRET: 'cambie-esto-por-una-clave-larga',
    CORS_ORIGIN: '*',
    CLOUDINARY_CLOUD_NAME: '',
    CLOUDINARY_API_KEY: '',
    CLOUDINARY_API_SECRET: '',
  });
  assert.equal(errores.some((texto) => texto.includes('JWT_SECRET')), true);
  assert.equal(errores.some((texto) => texto.includes('CORS_ORIGIN')), true);
  assert.equal(errores.some((texto) => texto.includes('Cloudinary')), true);
});

test('Cloudinary incompleto se rechaza también en desarrollo', () => {
  const errores = validarArranque({
    NODE_ENV: 'development',
    DATABASE_URL: base.DATABASE_URL,
    JWT_SECRET: 'desarrollo',
    CLOUDINARY_CLOUD_NAME: 'solo-una',
  });
  assert.equal(errores.some((texto) => texto.includes('incompleto')), true);
});

test('desarrollo sin Cloudinary usa memoria y producción no finge guardarla', async () => {
  const memoria = resolverAlmacenamiento('steply/evidencias', {
    NODE_ENV: 'development',
  });
  assert.equal(memoria.nombre, 'memoria');
  const guardada = await memoria.subir(Buffer.from('foto'), { formato: 'jpg' });
  assert.equal(memoria.archivos.has(guardada.publicId), true);

  const cerrado = resolverAlmacenamiento('steply/evidencias', { NODE_ENV: 'production' });
  assert.equal(cerrado.nombre, 'no-disponible');
  await assert.rejects(() => cerrado.subir(Buffer.from('foto')), /no se guardó/i);
});

test('el límite de intentos corta el undécimo acceso', () => {
  const limite = limitarIntentos({ max: 2, ventanaMs: 1000 });
  const respuestas = [];
  function correr() {
    const res = {
      statusCode: 200,
      headers: {},
      setHeader(nombre, valor) { this.headers[nombre] = valor; },
      status(codigo) { this.statusCode = codigo; return this; },
      json(cuerpo) { respuestas.push({ status: this.statusCode, cuerpo }); },
    };
    let siguio = false;
    limite({ ip: '10.0.0.8' }, res, () => { siguio = true; });
    return siguio;
  }
  assert.equal(correr(), true);
  assert.equal(correr(), true);
  assert.equal(correr(), false);
  assert.equal(respuestas[0].status, 429);
  assert.equal(respuestas[0].cuerpo.codigo, 'LIMITE');
});

test('la URL del API de producción no cae en localhost', () => {
  assert.equal(resolveApiOrigin({ configured: 'https://api.ejemplo.com/', dev: false }), 'https://api.ejemplo.com');
  assert.equal(resolveApiOrigin({ configured: '', dev: true, localOrigin: 'http://localhost:3000' }), 'http://localhost:3000');
  assert.equal(resolveApiOrigin({ configured: '  ', dev: false }), '');
  assert.equal(resolveApiOrigin({ configured: '', dev: false }), '');
});
