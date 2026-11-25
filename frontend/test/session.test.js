import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  accessTokenExpiry,
  isAccessTokenExpired,
  readStoredToken,
  shouldAbandonSession,
  TOKEN_KEY,
} from '../src/services/session.js'

function tokenWithExpiry(expSeconds) {
  const payload = Buffer.from(JSON.stringify({ exp: expSeconds })).toString('base64url')
  return `header.${payload}.signature`
}

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null
    },
    removeItem(key) {
      data.delete(key)
    },
    data,
  }
}

describe('sesión del navegador', () => {
  test('un token vencido se descarta y no se vuelve a enviar', () => {
    const expired = tokenWithExpiry(1_000)
    const storage = memoryStorage({ [TOKEN_KEY]: expired })
    assert.equal(isAccessTokenExpired(expired, 1_000 * 1000), true)
    assert.equal(readStoredToken(storage, 1_000 * 1000 + 1), null)
    assert.equal(storage.data.has(TOKEN_KEY), false)
  })

  test('un token vigente se conserva', () => {
    const current = tokenWithExpiry(4_000_000_000)
    const storage = memoryStorage({ [TOKEN_KEY]: current })
    assert.equal(readStoredToken(storage, Date.now()), current)
    assert.equal(accessTokenExpiry('no-es-jwt'), null)
    assert.equal(isAccessTokenExpired('no-es-jwt'), false)
  })

  test('un 401 cierra solo la sesión que hizo la petición', () => {
    assert.equal(shouldAbandonSession({
      status: 401,
      authenticatedRequest: true,
      sentToken: 'viejo',
      currentToken: 'viejo',
    }), true)
    assert.equal(shouldAbandonSession({
      status: 401,
      authenticatedRequest: true,
      sentToken: 'viejo',
      currentToken: 'renovado',
    }), false)
    assert.equal(shouldAbandonSession({
      status: 403,
      authenticatedRequest: true,
      sentToken: 'viejo',
      currentToken: 'viejo',
    }), false)
    assert.equal(shouldAbandonSession({
      status: 401,
      authenticatedRequest: false,
      sentToken: '',
      currentToken: 'vigente',
    }), false)
  })
})
