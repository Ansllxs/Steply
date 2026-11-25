const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')

export function displayMediaUrl(url, publicId, origen = 'evidencia') {
  if (!url) return ''
  if (publicId && url.includes('/demo/image/upload/')) {
    return `${API_URL}/api/medios?id=${encodeURIComponent(publicId)}&origen=${origen}`
  }
  return url
}
