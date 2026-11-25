import { resolveApiOrigin } from './api-origin'

const API_URL = resolveApiOrigin({
  configured: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL,
  dev: import.meta.env.DEV,
})

export function displayMediaUrl(url, publicId, origen = 'evidencia') {
  if (!url) return ''
  if (publicId && url.includes('/demo/image/upload/')) {
    if (!API_URL) return ''
    return `${API_URL}/api/medios?id=${encodeURIComponent(publicId)}&origen=${origen}`
  }
  return url
}
