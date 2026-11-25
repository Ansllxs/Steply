import { api, apiForm } from './api'

export function updateProfile(body) {
  return api('/usuarios/me', { method: 'PATCH', body })
}

export function uploadAvatar(file) {
  const formData = new FormData()
  formData.append('foto', file, file.name || 'perfil.jpg')
  return apiForm('/usuarios/me/foto', { method: 'PUT', formData })
}

export function changePassword(body) {
  return api('/auth/cambiar-password', { method: 'POST', body })
}
