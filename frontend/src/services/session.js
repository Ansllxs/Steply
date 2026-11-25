export const TOKEN_KEY = 'steply-token'

function decodeBase64Url(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/** Client-side expiry only. The server still verifies the signature. */
export function accessTokenExpiry(token) {
  if (typeof token !== 'string') return null
  const part = token.split('.')[1]
  if (!part) return null

  try {
    const payload = JSON.parse(decodeBase64Url(part))
    return Number.isFinite(payload.exp) ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

export function isAccessTokenExpired(token, now = Date.now()) {
  const expiry = accessTokenExpiry(token)
  return expiry != null && expiry <= now
}

export function readStoredToken(storage, now = Date.now()) {
  let token = null

  try {
    token = storage.getItem(TOKEN_KEY)
  } catch {
    return null
  }

  if (!token) return null
  if (!isAccessTokenExpired(token, now)) return token

  try {
    storage.removeItem(TOKEN_KEY)
  } catch {
    // An unreadable store still counts as no session.
  }

  return null
}

/**
 * A 401 ends the session that sent the request.
 * A newer token from another tab or a password change is left in place.
 */
export function shouldAbandonSession({ status, authenticatedRequest, sentToken, currentToken }) {
  if (status !== 401 || !authenticatedRequest) return false
  if (currentToken && currentToken !== sentToken) return false
  return true
}
