export function resolveApiOrigin({ configured = '', dev = false } = {}) {
  const value = String(configured || '').trim().replace(/\/$/, '')
  if (value) return value
  if (dev) return 'http://localhost:3000'
  return ''
}
