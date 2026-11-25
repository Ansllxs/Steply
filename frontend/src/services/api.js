const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')
const TOKEN_KEY = 'steply-token'

export class ApiError extends Error {
  constructor(status, codigo, mensaje, detalles) {
    super(mensaje || 'Error')
    this.name = 'ApiError'
    this.status = status
    this.codigo = codigo || ''
    this.detalles = detalles || {}
  }
}

export function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // The session is already gone from memory if storage is unavailable.
  }
}

export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { Accept: 'application/json' }

  if (body !== undefined) headers['Content-Type'] = 'application/json'

  if (auth) {
    const token = readToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let response

  try {
    response = await fetch(`${API_URL}/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'RED', '')
  }

  const text = await response.text()
  let data = null

  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, data?.codigo, data?.mensaje, data?.detalles)
  }

  return data
}

export async function apiForm(path, { method = 'POST', formData, auth = true } = {}) {
  const headers = { Accept: 'application/json' }

  if (auth) {
    const token = readToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let response

  try {
    response = await fetch(`${API_URL}/api${path}`, {
      method,
      headers,
      body: formData,
    })
  } catch {
    throw new ApiError(0, 'RED', '')
  }

  const text = await response.text()
  let data = null

  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, data?.codigo, data?.mensaje, data?.detalles)
  }

  return data
}
