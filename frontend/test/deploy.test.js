import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { resolveApiOrigin } from '../src/services/api-origin.js'

test('Vercel devuelve la aplicación al recargar una ruta interna', () => {
  const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'))
  assert.deepEqual(config.rewrites, [{ source: '/(.*)', destination: '/index.html' }])
})

test('el build de producción no usa localhost si no hay dirección configurada', () => {
  assert.equal(resolveApiOrigin({ configured: '', dev: false }), '')
  assert.equal(resolveApiOrigin({ configured: 'https://steply-api.onrender.com/', dev: false }), 'https://steply-api.onrender.com')
})
