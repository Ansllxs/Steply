import { resolveApiOrigin } from './api-origin'

const API_URL = resolveApiOrigin({
  configured: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL,
  dev: import.meta.env.DEV,
})
const TOKEN_KEY = 'steply-token'

export class ApiError extends Error {
  constructor(status, codigo, mensaje, detalles) {
    super(mensaje || 'Error')
    this.name = 'ApiError'
    this.status = status
    this.codigo = codigo || ''
    this.mensaje = mensaje || ''
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

function abandonSession(response, auth) {
  if (response.status !== 401 || !auth || !readToken()) return
  clearToken()
  const path = window.location.pathname
  if (path !== '/' && path !== '/login' && path !== '/register') {
    window.location.assign('/login')
  }
}

function requestUrl(path) {
  if (!API_URL) {
    throw new ApiError(0, 'CONFIG', 'La aplicación no tiene configurada la dirección del servidor.')
  }
  return `${API_URL}/api${path}`
}

export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { Accept: 'application/json' }

  if (body !== undefined) headers['Content-Type'] = 'application/json'

  if (auth) {
    const token = readToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let response
  const url = requestUrl(path)

  try {
    response = await fetch(url, {
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
    abandonSession(response, auth)
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
  const url = requestUrl(path)

  try {
    response = await fetch(url, {
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
    abandonSession(response, auth)
    throw new ApiError(response.status, data?.codigo, data?.mensaje, data?.detalles)
  }

  return data
}
