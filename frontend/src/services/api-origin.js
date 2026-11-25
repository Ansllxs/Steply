export function resolveApiOrigin({ configured = '', dev = false, localOrigin = '' } = {}) {
  const value = String(configured || '').trim().replace(/\/$/, '')
  if (value) return value
  if (dev) return localOrigin
  return ''
}
